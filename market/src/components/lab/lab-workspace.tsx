"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ComponentDef, LabProject, WireDef, WiringIssue } from "@/lab/types";
import type { EngineStatus, SimulationEngine } from "@/lab/engine/types";
import { LAB_COMPONENTS_SEED } from "@/lab/registry";
import { LAB_TEMPLATES, templateToProject } from "@/lab/templates";
import { validateWiring } from "@/lab/wiring/validate";
import {
  createShareToken,
  deserializeProject,
  loadProjectLocal,
  loadShareToken,
  newEmptyProject,
  saveProjectLocal,
  serializeProject,
} from "@/lab/project/schema";
import { buildBom, addBomToCart } from "@/lab/bom";
import { createSimulationEngine } from "@/lab/engine/avr8-engine";
import { ledsDrivenBy, normRotation, snap } from "@/lab/geometry";
import { newId } from "@/lab/ids";
import { PartDefsSprite } from "@/lab/visuals/part-art";
import { withBasePath } from "@/lab/base-path";
import { useCart } from "@/components/cart-provider";
import { Icon, type IconName } from "@/components/icon";
import { LabErrorBoundary } from "./error-boundary";
import { PartsPanel } from "./parts-panel";
import { BoardCanvas, type CanvasApi } from "./board-canvas";
import { Inspector } from "./inspector";
import { BottomPanel, type BottomTab, type LogEntry } from "./bottom-panel";
import { WorkspaceTopbar } from "./workspace-topbar";
import { OnboardingTour } from "./onboarding-tour";

const TOUR_KEY = "pushrsp-lab-tour-v1";
const MAX_HISTORY = 50;

type Init = { project: LabProject; previous: LabProject | null; notice: string | null };

function placeFree(project: LabProject, def: ComponentDef, x: number, y: number) {
  let px = snap(x);
  let py = snap(y);
  // nudge so stacked adds don't hide each other
  while (project.parts.some((p) => Math.abs(p.x - px) < 8 && Math.abs(p.y - py) < 8)) {
    px += 20;
    py += 20;
  }
  return {
    instanceId: newId(def.id),
    componentId: def.id,
    x: px,
    y: py,
    rotation: 0,
  };
}

function initialState(templateId?: string | null, partSlug?: string | null, shareToken?: string | null): Init {
  const saved = loadProjectLocal();
  if (shareToken) {
    const shared = loadShareToken(shareToken);
    if (shared) return { project: shared, previous: saved, notice: "پروژه‌ی اشتراکی باز شد." };
  }
  if (templateId) {
    const t = LAB_TEMPLATES.find((x) => x.id === templateId);
    if (t) {
      return {
        project: templateToProject(t),
        previous: saved && saved.parts.length ? saved : null,
        notice: saved && saved.parts.length ? `قالب «${t.name}» باز شد — پروژه‌ی قبلی با «واگرد» برمی‌گردد.` : null,
      };
    }
  }
  if (partSlug) {
    const def = LAB_COMPONENTS_SEED.find((c) => c.slug === partSlug || c.catalogSlug === partSlug);
    if (def) {
      const base = saved ?? newEmptyProject(`تست ${def.name}`);
      const next: LabProject = { ...base, parts: [...base.parts] };
      if (def.behaviorModel.kind !== "mcu" && !next.parts.some((p) => p.componentId === "arduino-uno" || p.componentId === "arduino-nano")) {
        next.parts.push({ instanceId: "uno1", componentId: "arduino-uno", x: 40, y: 40, rotation: 0 });
      }
      next.parts.push(placeFree(next, def, 320, 80));
      return { project: next, previous: saved, notice: `«${def.name}» به میز کار اضافه شد.` };
    }
  }
  return { project: saved ?? newEmptyProject("پروژه آزمایشگاه"), previous: null, notice: null };
}

/** Desktop vs mobile layout, read synchronously (client-only component). */
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

type MobileSheet = "parts" | "panel" | "inspector" | null;
type Toast = { text: string; tone: "ok" | "warn" | "error"; href?: string; hrefLabel?: string } | null;

export function LabWorkspace({
  initialPartSlug,
  initialTemplateId,
  initialShareToken,
}: {
  initialPartSlug?: string | null;
  initialTemplateId?: string | null;
  initialShareToken?: string | null;
}) {
  const { refresh } = useCart();
  const isDesktop = useIsDesktop();
  const [init] = useState(() => initialState(initialTemplateId, initialPartSlug, initialShareToken));

  const [components, setComponents] = useState<ComponentDef[]>(LAB_COMPONENTS_SEED);
  const [project, setProject] = useState<LabProject>(init.project);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [serial, setSerial] = useState("");
  const [ledOn, setLedOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("idle");
  const [compiling, setCompiling] = useState(false);
  const [tab, setTab] = useState<BottomTab>("code");
  const [bottomH, setBottomH] = useState(300);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const [highlight, setHighlight] = useState<{ partIds: string[]; wireIds: string[] } | null>(null);
  const [toast, setToast] = useState<Toast>(init.notice ? { text: init.notice, tone: "ok" } : null);
  const [bomBusy, setBomBusy] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => {
    try {
      return localStorage.getItem(TOUR_KEY) !== "1";
    } catch {
      return false;
    }
  });

  const history = useRef<{ past: LabProject[]; future: LabProject[] }>({ past: init.previous ? [init.previous] : [], future: [] });
  const [hist, setHist] = useState({ past: init.previous ? 1 : 0, future: 0 });
  const engineRef = useRef<SimulationEngine | null>(null);
  const canvasApi = useRef<CanvasApi>(null);
  const logId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defs = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);
  const simpleMode = project.mode !== "pro";
  const issues = useMemo(() => validateWiring(project, components), [project, components]);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const bom = useMemo(() => buildBom(project, components), [project, components]);
  const driven = useMemo(() => ledsDrivenBy(project, components, "d13"), [project, components]);
  const litLeds = useMemo(() => (ledOn ? driven : new Set<string>()), [ledOn, driven]);

  // ---------- helpers ----------
  const log = useCallback((level: LogEntry["level"], text: string) => {
    logId.current += 1;
    const id = logId.current;
    setLogs((L) => [...L.slice(-200), { id, level, text }]);
  }, []);

  const showToast = useCallback((t: NonNullable<Toast>, ms = 4500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const syncHist = () => setHist({ past: history.current.past.length, future: history.current.future.length });

  /** Every undoable edit goes through here. */
  const commit = useCallback(
    (fn: (p: LabProject) => LabProject) => {
      history.current.past.push(structuredClone(project));
      if (history.current.past.length > MAX_HISTORY) history.current.past.shift();
      history.current.future = [];
      setProject(fn(structuredClone(project)));
      setSaved(false);
      setHist({ past: history.current.past.length, future: 0 });
    },
    [project],
  );

  const undo = () => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.push(structuredClone(project));
    setProject(prev);
    setSelectedId(null);
    setSaved(false);
    syncHist();
  };

  const redo = () => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(structuredClone(project));
    setProject(next);
    setSelectedId(null);
    setSaved(false);
    syncHist();
  };

  // ---------- effects ----------
  // Auto-dismiss the "opened template / shared project" notice
  useEffect(() => {
    if (!init.notice) return;
    const t = setTimeout(() => setToast((cur) => (cur?.text === init.notice ? null : cur)), 6000);
    return () => clearTimeout(t);
  }, [init.notice]);

  // Shop-enriched catalog (prices, stock, product links)
  useEffect(() => {
    let cancelled = false;
    fetch(withBasePath("/api/lab/products"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.components) setComponents(data.components);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Autosave to this browser
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        saveProjectLocal({ ...project, name: project.name.trim() || "پروژه بدون نام" });
      } catch {
        /* storage full / blocked — the project stays in memory */
      }
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [project]);

  // Simulator worker
  useEffect(() => {
    const engine = createSimulationEngine();
    engineRef.current = engine;
    const offPin = engine.onPinChange((s) => {
      if (s.pinId === "d13") setLedOn(s.value === 1);
    });
    const offSerial = engine.onSerial((d) => {
      setSerial((prev) => {
        const next = prev + String.fromCharCode(d.byte);
        return next.length > 8000 ? next.slice(-8000) : next;
      });
    });
    const offStatus = engine.onStatus((s, detail) => {
      setEngineStatus(s);
      if (detail) log(s === "error" ? "error" : "info", detail);
    });
    return () => {
      offPin();
      offSerial();
      offStatus();
      engine.terminate();
    };
  }, [log]);

  // ---------- actions ----------
  const addPartAt = (def: ComponentDef, cx: number, cy: number) => {
    const part = placeFree(project, def, cx - def.width / 2, cy - def.height / 2);
    commit((p) => ({ ...p, parts: [...p.parts, part] }));
    setSelectedId(part.instanceId);
  };

  const addPartCentered = (def: ComponentDef) => {
    const c = canvasApi.current?.center() ?? { x: 300, y: 200 };
    addPartAt(def, c.x, c.y);
    if (!isDesktop) {
      setSheet(null);
      showToast({ text: `«${def.name}» اضافه شد. برای جابه‌جایی بکشید.`, tone: "ok" }, 2500);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit((p) => ({
      ...p,
      parts: p.parts.filter((x) => x.instanceId !== selectedId),
      wires: p.wires.filter((w) => w.id !== selectedId && w.from.instanceId !== selectedId && w.to.instanceId !== selectedId),
    }));
    setSelectedId(null);
  };

  const rotateSelected = () => {
    if (!selectedId || !project.parts.some((p) => p.instanceId === selectedId)) return;
    commit((p) => ({
      ...p,
      parts: p.parts.map((x) => (x.instanceId === selectedId ? { ...x, rotation: normRotation((x.rotation ?? 0) + 90) } : x)),
    }));
  };

  const duplicateSelected = () => {
    const part = project.parts.find((p) => p.instanceId === selectedId);
    const def = part && defs.get(part.componentId);
    if (!part || !def) return;
    const copy = { ...placeFree(project, def, part.x + 30, part.y + 30), rotation: part.rotation };
    commit((p) => ({ ...p, parts: [...p.parts, copy] }));
    setSelectedId(copy.instanceId);
  };

  const replaceProject = (next: LabProject, message: string) => {
    engineRef.current?.stop();
    setLedOn(false);
    commit(() => next);
    setSelectedId(null);
    canvasApi.current?.fitTo(next.parts);
    showToast({ text: message, tone: "ok" });
  };

  const loadTemplate = (id: string) => {
    const t = LAB_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    replaceProject(templateToProject(t), `قالب «${t.name}» باز شد. «واگرد» پروژه‌ی قبلی را برمی‌گرداند.`);
    log("info", `قالب «${t.name}» بارگذاری شد.`);
    setSheet(null);
  };

  const focusIssue = (issue: WiringIssue) => {
    const partIds = issue.partIds ?? [];
    const wireIds = issue.wireIds ?? [];
    setHighlight({ partIds, wireIds });
    setSelectedId(partIds[0] ?? wireIds[0] ?? null);
    if (!isDesktop) setSheet(null);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight(null), 5000);
  };

  const runSim = async () => {
    const firstError = issues.find((i) => i.severity === "error");
    if (simpleMode && firstError) {
      log("error", `سیم‌کشی نامعتبر: ${firstError.message}`);
      setTab("issues");
      if (!isDesktop) setSheet("panel");
      focusIssue(firstError);
      showToast({ text: "پیش از اجرا خطای سیم‌کشی را رفع کنید (در حالت حرفه‌ای این محافظ خاموش است).", tone: "error" });
      return;
    }
    setCompiling(true);
    setSerial("");
    setLedOn(false);
    log("info", "در حال کامپایل با avr-gcc…");

    const runHex = async (hex: string) => {
      await engineRef.current?.load(hex);
      engineRef.current?.setSpeed(speed);
      engineRef.current?.start();
    };
    const blinkFallback = async (reason: string) => {
      if (!(/digitalWrite\s*\(\s*13/.test(project.code) && /delay\s*\(/.test(project.code))) return false;
      const res = await fetch(withBasePath("/lab/firmware/blink.hex"));
      if (!res.ok) return false;
      await runHex(await res.text());
      log("warn", `${reason} — فرم‌ویر آماده‌ی Blink اجرا شد (این کد شما نیست).`);
      return true;
    };

    try {
      const res = await fetch(withBasePath("/api/lab/compile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: project.code, board: "uno" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        const ran = await blinkFallback("کامپایل آنلاین نیاز به ورود دارد");
        showToast({
          text: ran ? "برای کامپایل کد خودتان وارد شوید؛ فعلاً نمونه‌ی Blink اجرا شد." : "برای کامپایل و اجرای کد باید وارد حساب شوید.",
          tone: "warn",
          href: `/login?next=${encodeURIComponent("/lab/workspace")}`,
          hrefLabel: "ورود",
        }, 7000);
        return;
      }
      if (!res.ok || !data.hex) {
        log("error", `کامپایل ناموفق: ${data.error ?? res.status}`);
        if (data.detail) log("error", String(data.detail).slice(0, 1500));
        const ran = await blinkFallback("کامپایلر پاسخ نداد");
        setTab("log");
        showToast({ text: ran ? "کامپایل نشد؛ نمونه‌ی Blink اجرا شد. جزئیات در تب «گزارش»." : "کامپایل نشد. جزئیات در تب «گزارش».", tone: "error" });
        return;
      }
      log("ok", "کامپایل موفق — اجرا در شبیه‌ساز (avr8js).");
      await runHex(data.hex as string);
      if (/Serial\./.test(project.code)) setTab("serial");
    } catch (e) {
      log("error", e instanceof Error ? e.message : "خطای اجرا");
    } finally {
      setCompiling(false);
    }
  };

  const stopSim = () => {
    engineRef.current?.stop();
    setLedOn(false);
  };

  const exportJson = () => {
    try {
      const blob = new Blob([serializeProject({ ...project, name: project.name.trim() || "lab-project" })], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${project.name.trim() || "lab-project"}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      showToast({ text: e instanceof Error ? e.message : "خروجی گرفتن ممکن نشد", tone: "error" });
    }
  };

  const importJson = async (file: File) => {
    try {
      replaceProject(deserializeProject(await file.text()), `«${file.name}» باز شد.`);
    } catch {
      showToast({ text: "این فایل پروژه‌ی معتبر آزمایشگاه نیست.", tone: "error" });
    }
  };

  const share = () => {
    try {
      const token = createShareToken({ ...project, name: project.name.trim() || "پروژه" });
      const url = `${window.location.origin}${window.location.pathname}?share=${token}`;
      void navigator.clipboard?.writeText(url);
      showToast({ text: "لینک کپی شد. توجه: فعلاً فقط در همین مرورگر باز می‌شود.", tone: "ok" });
    } catch {
      showToast({ text: "ساخت لینک ممکن نشد.", tone: "error" });
    }
  };

  const addBom = async () => {
    setBomBusy(true);
    try {
      const results = await addBomToCart(bom);
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      results.filter((r) => !r.ok).forEach((r) => log("warn", `BOM: ${r.componentId} — ${r.error}`));
      await refresh();
      showToast(
        { text: `${ok.toLocaleString("fa-IR")} قلم به سبد اضافه شد${fail ? ` — ${fail.toLocaleString("fa-IR")} قلم در فروشگاه نیست` : ""}.`, tone: fail ? "warn" : "ok", href: "/cart", hrefLabel: "سبد خرید" },
        6000,
      );
    } finally {
      setBomBusy(false);
    }
  };

  const closeTour = useCallback(() => {
    setTourOpen(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* private mode */
    }
  }, []);

  // ---------- keyboard ----------
  const keys = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    keys.current = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const typing = !!el?.closest("input, textarea, select, [contenteditable=true], .monaco-editor");
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (engineStatus !== "running") void runSim();
        return;
      }
      if (typing || tourOpen) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if ((e.key === "r" || e.key === "R" || e.key === "ق") && !mod) {
        rotateSelected();
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- derived view data ----------
  const selPart = project.parts.find((p) => p.instanceId === selectedId) ?? null;
  const selDef = selPart ? defs.get(selPart.componentId) ?? null : null;
  const selWire = selPart ? null : project.wires.find((w) => w.id === selectedId) ?? null;
  const endLabel = (w: WireDef, end: "from" | "to") => {
    const e = w[end];
    const part = project.parts.find((p) => p.instanceId === e.instanceId);
    const def = part && defs.get(part.componentId);
    const pin = def?.pins.find((p) => p.id === e.pinId);
    return `${def?.name ?? e.instanceId} · ${pin?.label ?? e.pinId}`;
  };
  const lit = selDef ? (selDef.behaviorModel.kind === "mcu" ? ledOn : litLeds.has(selPart!.instanceId)) : false;

  const inspector = (
    <Inspector
      part={selPart}
      def={selDef}
      lit={lit}
      wire={selWire}
      wireEnds={selWire ? { from: endLabel(selWire, "from"), to: endLabel(selWire, "to") } : null}
      summary={{ parts: project.parts.length, wires: project.wires.length, errors, warnings }}
      onRotate={rotateSelected}
      onDuplicate={duplicateSelected}
      onDelete={deleteSelected}
    />
  );

  const panel = (
    <BottomPanel
      tab={tab}
      onTab={setTab}
      code={project.code}
      onCodeChange={(code) => {
        setProject((p) => ({ ...p, code }));
        setSaved(false);
      }}
      serial={serial}
      onClearSerial={() => setSerial("")}
      logs={logs}
      onClearLogs={() => setLogs([])}
      issues={issues}
      onFocusIssue={focusIssue}
      bom={bom}
      defs={defs}
      bomBusy={bomBusy}
      onAddBom={() => void addBom()}
    />
  );

  const uno = defs.get("arduino-uno");
  const emptyState = (
    <div className="cyber-chamfer w-full max-w-sm border border-outline bg-surface-container-lowest/95 p-6 text-center shadow-[var(--box-shadow-neon-sm)] backdrop-blur">
      <p dir="ltr" className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">&gt; EMPTY_BENCH</p>
      <h2 className="mt-1 text-lg font-extrabold text-on-surface">میز کار خالی است</h2>
      <p className="mt-2 text-xs leading-6 text-on-surface-variant">
        سریع‌ترین شروع: قالب «چشمک LED» را باز کنید و «اجرا» را بزنید. یا از {isDesktop ? "ستون قطعات" : "دکمه‌ی «قطعات» پایین صفحه"} یک قطعه اضافه کنید.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={() => loadTemplate("blink-led")} className="bg-cta focus-cta cyber-chamfer-sm inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 text-sm font-bold">
          <Icon name="play_circle" className="h-5 w-5" />
          باز کردن قالب Blink
        </button>
        {uno && (
          <button type="button" onClick={() => addPartCentered(uno)} className="focus-cta cyber-chamfer-sm inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-outline text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container">
            <Icon name="developer_board" className="h-5 w-5" />
            شروع با یک Arduino Uno
          </button>
        )}
      </div>
    </div>
  );

  const canvas = (
    <BoardCanvas
      apiRef={canvasApi}
      project={project}
      components={components}
      selectedId={selectedId}
      simpleMode={simpleMode}
      litLeds={litLeds}
      highlight={highlight}
      emptyState={emptyState}
      onSelect={setSelectedId}
      onMoveStart={() => {
        history.current.past.push(structuredClone(project));
        if (history.current.past.length > MAX_HISTORY) history.current.past.shift();
        history.current.future = [];
        syncHist();
      }}
      onMovePart={(id, x, y) => {
        setProject((p) => ({ ...p, parts: p.parts.map((part) => (part.instanceId === id ? { ...part, x, y } : part)) }));
        setSaved(false);
      }}
      onAddWire={(wire) => commit((p) => ({ ...p, wires: [...p.wires, wire] }))}
      onDropPart={(componentId, x, y) => {
        const def = defs.get(componentId);
        if (def) addPartAt(def, x, y);
      }}
      onDeleteSelected={deleteSelected}
      onRotateSelected={rotateSelected}
      onWireBlocked={(m) => {
        log("warn", m);
        showToast({ text: m, tone: "warn" }, 3500);
      }}
    />
  );

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bottomH;
    const max = window.innerHeight * 0.7;
    const move = (ev: PointerEvent) => setBottomH(Math.round(Math.min(max, Math.max(120, startH + (startY - ev.clientY)))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const mobileNav: { id: Exclude<MobileSheet, null>; label: string; icon: IconName; badge?: number }[] = [
    { id: "parts", label: "قطعات", icon: "inventory_2" },
    { id: "panel", label: "کد و خروجی", icon: "integration_instructions", badge: errors || undefined },
    { id: "inspector", label: selDef ? "جزئیات قطعه" : "جزئیات", icon: "memory" },
  ];

  return (
    <LabErrorBoundary>
      <PartDefsSprite />
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-on-surface">
        <WorkspaceTopbar
          name={project.name}
          onRename={(name) => {
            setProject((p) => ({ ...p, name }));
            setSaved(false);
          }}
          saved={saved}
          canUndo={hist.past > 0}
          canRedo={hist.future > 0}
          onUndo={undo}
          onRedo={redo}
          status={engineStatus}
          compiling={compiling}
          onRun={() => void runSim()}
          onStop={stopSim}
          onPause={() => engineRef.current?.pause()}
          onResume={() => engineRef.current?.start()}
          onReset={() => {
            engineRef.current?.reset();
            setLedOn(false);
            setSerial("");
          }}
          speed={speed}
          onSpeed={(v) => {
            setSpeed(v);
            engineRef.current?.setSpeed(v);
          }}
          errors={errors}
          warnings={warnings}
          onShowIssues={() => {
            setTab("issues");
            if (!isDesktop) setSheet("panel");
          }}
          simpleMode={simpleMode}
          onToggleMode={() => {
            commit((p) => ({ ...p, mode: p.mode === "pro" ? "simple" : "pro" }));
            showToast({
              text: simpleMode ? "حالت حرفه‌ای: محافظ‌های سیم‌کشی و اجرا خاموش شدند." : "حالت ساده: اتصال‌های خطرناک رد و پیش از اجرا بررسی می‌شوند.",
              tone: "ok",
            });
          }}
          onLoadTemplate={loadTemplate}
          onNewProject={() => replaceProject(newEmptyProject("پروژه جدید"), "پروژه‌ی خالی ساخته شد. «واگرد» پروژه‌ی قبلی را برمی‌گرداند.")}
          onExport={exportJson}
          onImport={(f) => void importJson(f)}
          onShare={share}
          onHelp={() => setTourOpen(true)}
        />

        {isDesktop ? (
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-72 shrink-0 flex-col border-e border-outline bg-surface-container-lowest" aria-label="قطعات">
              <PartsPanel components={components} onAdd={addPartCentered} />
            </aside>

            <section className="flex min-w-0 flex-1 flex-col" aria-label="بوم و کد">
              <div className="relative min-h-0 flex-1">{canvas}</div>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="تغییر اندازه‌ی پنل پایین"
                onPointerDown={startResize}
                onDoubleClick={() => setBottomH((h) => (h > 160 ? 120 : 300))}
                className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-outline bg-surface-container-low hover:bg-primary-container/20"
              >
                <span className="h-0.5 w-10 bg-outline group-hover:bg-primary-container" />
              </div>
              <div className="shrink-0" style={{ height: bottomH }}>
                {panel}
              </div>
            </section>

            {inspectorOpen ? (
              <aside className="relative flex w-80 shrink-0 flex-col overflow-y-auto border-s border-outline bg-surface-container-lowest" aria-label="جزئیات">
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  className="absolute top-3 left-3 z-10 cursor-pointer text-on-surface-variant hover:text-primary-container"
                  aria-label="بستن پنل جزئیات"
                  title="بستن"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
                {inspector}
              </aside>
            ) : (
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className="flex w-8 shrink-0 cursor-pointer flex-col items-center gap-2 border-s border-outline bg-surface-container-lowest pt-4 text-[11px] text-on-surface-variant hover:text-primary-container"
                aria-label="باز کردن پنل جزئیات"
              >
                <Icon name="memory" className="h-4 w-4" />
                <span className="[writing-mode:vertical-rl]">جزئیات</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1">{canvas}</div>
            <nav className="grid shrink-0 grid-cols-3 border-t border-outline bg-surface-container-lowest pb-[env(safe-area-inset-bottom)]" aria-label="پنل‌ها">
              {mobileNav.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSheet((s) => (s === n.id ? null : n.id))}
                  aria-pressed={sheet === n.id}
                  className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${sheet === n.id ? "text-primary-container" : "text-on-surface-variant"}`}
                >
                  <Icon name={n.icon} className="h-5 w-5" />
                  {n.label}
                  {n.badge ? <span className="absolute top-2 left-1/2 ms-3 min-w-4 bg-error px-1 font-mono text-[10px] text-background">{n.badge}</span> : null}
                </button>
              ))}
            </nav>
            {sheet && (
              <div className="fixed inset-x-0 top-14 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col">
                <button type="button" aria-label="بستن" className="min-h-8 flex-1 bg-background/50" onClick={() => setSheet(null)} />
                <div className="flex h-[68dvh] max-h-full flex-col border-t border-primary-container/50 bg-surface-container-lowest shadow-[0_-8px_30px_rgba(0,0,0,.6)]">
                  <div className="flex shrink-0 items-center justify-between border-b border-outline px-3 py-2">
                    <span className="text-sm font-bold">{mobileNav.find((n) => n.id === sheet)?.label}</span>
                    <button type="button" onClick={() => setSheet(null)} className="cursor-pointer p-1 text-on-surface-variant" aria-label="بستن">
                      <Icon name="close" className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {sheet === "parts" && <PartsPanel components={components} onAdd={addPartCentered} />}
                    {sheet === "panel" && panel}
                    {sheet === "inspector" && inspector}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={`cyber-chamfer-sm fixed bottom-20 left-1/2 z-[70] flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 border bg-surface-container-lowest px-4 py-3 text-xs shadow-[var(--box-shadow-neon-sm)] lg:bottom-6 ${
            toast.tone === "error" ? "border-error text-error" : toast.tone === "warn" ? "border-amber-400 text-amber-200" : "border-accent-tertiary/60 text-on-surface"
          }`}
        >
          <span className="flex-1 leading-6">{toast.text}</span>
          {toast.href && (
            <Link href={toast.href} className="shrink-0 font-bold text-primary-container underline">
              {toast.hrefLabel}
            </Link>
          )}
          <button type="button" onClick={() => setToast(null)} className="shrink-0 cursor-pointer opacity-70 hover:opacity-100" aria-label="بستن پیام">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <OnboardingTour open={tourOpen} onClose={closeTour} />
    </LabErrorBoundary>
  );
}
