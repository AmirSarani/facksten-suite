"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentDef, LabProject, WireDef } from "@/lab/types";
import { LAB_COMPONENTS_SEED } from "@/lab/registry";
import { LAB_TEMPLATES, templateToProject } from "@/lab/templates";
import { validateWiring } from "@/lab/wiring/validate";
import {
  createShareToken,
  loadProjectLocal,
  newEmptyProject,
  saveProjectLocal,
  serializeProject,
  deserializeProject,
} from "@/lab/project/schema";
import { buildBom, addBomToCart } from "@/lab/bom";
import { createSimulationEngine } from "@/lab/engine/avr8-engine";
import type { SimulationEngine } from "@/lab/engine/types";
import { LabErrorBoundary } from "./error-boundary";
import { PartsPanel } from "./parts-panel";
import { BoardCanvas } from "./board-canvas";
import { Inspector } from "./inspector";
import { CodeEditor } from "./code-editor";
import { ConsolePanel } from "./console-panel";
import { useCart } from "@/components/cart-provider";
import { withBasePath } from "@/lab/base-path";

type HistoryEntry = LabProject;

export function LabWorkspace({
  initialPartSlug,
  initialTemplateId,
}: {
  initialPartSlug?: string | null;
  initialTemplateId?: string | null;
}) {
  const { refresh } = useCart();
  const [components, setComponents] = useState<ComponentDef[]>(LAB_COMPONENTS_SEED);
  const [project, setProject] = useState<LabProject>(() => newEmptyProject("پروژه آزمایشگاه"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [simpleMode, setSimpleMode] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [serial, setSerial] = useState("");
  const [ledOn, setLedOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [engineStatus, setEngineStatus] = useState("idle");
  const [compiling, setCompiling] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [bomMsg, setBomMsg] = useState<string | null>(null);

  const history = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({
    past: [],
    future: [],
  });
  const engineRef = useRef<SimulationEngine | null>(null);
  const skipSave = useRef(true);

  const pushHistory = useCallback((next: LabProject) => {
    history.current.past.push(structuredClone(project));
    if (history.current.past.length > 50) history.current.past.shift();
    history.current.future = [];
    setProject(next);
    setSaveState("dirty");
  }, [project]);

  const updateProject = useCallback(
    (fn: (p: LabProject) => LabProject) => {
      pushHistory(fn(structuredClone(project)));
    },
    [project, pushHistory],
  );

  // Load shop-enriched catalog + local project / query params
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(withBasePath("/api/lab/products"));
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.components) setComponents(data.components);
        }
      } catch {
        /* keep seed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = loadProjectLocal();
    if (initialTemplateId) {
      const t = LAB_TEMPLATES.find((x) => x.id === initialTemplateId);
      if (t) {
        setProject(templateToProject(t));
        skipSave.current = false;
        return;
      }
    }
    if (saved) {
      setProject(saved);
    } else if (initialPartSlug) {
      const c =
        components.find((x) => x.slug === initialPartSlug || x.catalogSlug === initialPartSlug) ||
        LAB_COMPONENTS_SEED.find(
          (x) => x.slug === initialPartSlug || x.catalogSlug === initialPartSlug,
        );
      if (c) {
        const p = newEmptyProject(`تست ${c.name}`);
        p.parts = [
          {
            instanceId: `${c.id}-1`,
            componentId: c.id,
            x: 120,
            y: 80,
            rotation: 0,
          },
        ];
        if (c.behaviorModel.kind !== "mcu") {
          p.parts.unshift({
            instanceId: "uno1",
            componentId: "arduino-uno",
            x: 40,
            y: 40,
            rotation: 0,
          });
        }
        setProject(p);
      }
    }
    skipSave.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPartSlug, initialTemplateId]);

  // Autosave
  useEffect(() => {
    if (skipSave.current) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      saveProjectLocal(project);
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [project]);

  useEffect(() => {
    setSimpleMode(project.mode !== "pro");
  }, [project.mode]);

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
      if (detail) setLogs((L) => [...L.slice(-200), `[${s}] ${detail}`]);
    });
    return () => {
      offPin();
      offSerial();
      offStatus();
      engine.terminate();
    };
  }, []);

  const issues = useMemo(() => validateWiring(project, components), [project, components]);
  const selectedPart = project.parts.find((p) => p.instanceId === selectedId) ?? null;
  const selectedDef = selectedPart
    ? components.find((c) => c.id === selectedPart.componentId) ?? null
    : null;
  const bom = useMemo(() => buildBom(project, components), [project, components]);

  const log = (msg: string) => setLogs((L) => [...L.slice(-200), msg]);

  const undo = () => {
    const prev = history.current.past.pop();
    if (!prev) return;
    history.current.future.push(structuredClone(project));
    setProject(prev);
    setSaveState("dirty");
  };

  const redo = () => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(structuredClone(project));
    setProject(next);
    setSaveState("dirty");
  };

  const addPart = (c: ComponentDef) => {
    updateProject((p) => ({
      ...p,
      parts: [
        ...p.parts,
        {
          instanceId: `${c.id}-${Date.now().toString(36)}`,
          componentId: c.id,
          x: 80 + (p.parts.length % 5) * 24,
          y: 80 + (p.parts.length % 4) * 24,
          rotation: 0,
        },
      ],
    }));
  };

  const runSim = async () => {
    const errs = issues.filter((i) => i.severity === "error");
    if (simpleMode && errs.length) {
      log(`⛔ سیم‌کشی نامعتبر: ${errs[0].message}`);
      return;
    }
    setCompiling(true);
    setSerial("");
    setLedOn(false);
    log("در حال کامپایل با avr-gcc…");
    try {
      const res = await fetch(withBasePath("/api/lab/compile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: project.code, board: "uno" }),
      });
      const data = await res.json();
      if (!res.ok || !data.hex) {
        log(`خطای کامپایل: ${data.error ?? res.status}`);
        if (data.detail) log(String(data.detail).slice(0, 1500));
        // Fallback: Blink template firmware if sketch looks like blink
        if (/digitalWrite\s*\(\s*13/.test(project.code) && /delay\s*\(/.test(project.code)) {
          log("تلاش با فرم‌ویر آماده Blink…");
          const hexRes = await fetch(withBasePath("/lab/firmware/blink.hex"));
          if (hexRes.ok) {
            const hex = await hexRes.text();
            await engineRef.current?.load(hex);
            engineRef.current?.setSpeed(speed);
            engineRef.current?.start();
            log("اجرای فرم‌ویر Blink (avr8js) شروع شد.");
          }
        }
        setCompiling(false);
        return;
      }
      log("کامپایل موفق — بارگذاری در avr8js…");
      await engineRef.current?.load(data.hex as string);
      engineRef.current?.setSpeed(speed);
      engineRef.current?.start();
      log("شبیه‌سازی در حال اجرا (Worker).");
    } catch (e) {
      log(e instanceof Error ? e.message : "خطای اجرا");
    } finally {
      setCompiling(false);
    }
  };

  const loadTemplate = (id: string) => {
    const t = LAB_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    history.current = { past: [], future: [] };
    setProject(templateToProject(t));
    log(`قالب «${t.name}» بارگذاری شد.`);
  };

  const exportJson = () => {
    const blob = new Blob([serializeProject(project)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name || "lab-project"}.json`;
    a.click();
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    try {
      setProject(deserializeProject(text));
      log("پروژه وارد شد.");
    } catch (e) {
      log(e instanceof Error ? e.message : "JSON نامعتبر");
    }
  };

  const share = () => {
    const token = createShareToken(project);
    const url = `${window.location.origin}${window.location.pathname}?share=${token}`;
    void navigator.clipboard?.writeText(url);
    log(`لینک اشتراک (محلی) کپی شد: ${token}`);
  };

  const addBom = async () => {
    setBomMsg(null);
    const results = await addBomToCart(bom);
    const ok = results.filter((r) => r.ok).length;
    const fail = results.filter((r) => !r.ok);
    setBomMsg(`${ok} مورد به سبد اضافه شد` + (fail.length ? ` — ${fail.length} ناموفق` : ""));
    fail.forEach((f) => log(`BOM: ${f.componentId} — ${f.error}`));
    await refresh();
  };

  return (
    <LabErrorBoundary>
      <div className="flex h-[calc(100dvh-4rem)] min-h-[560px] flex-col bg-surface text-on-surface">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-2 border-b border-outline bg-surface-container-low px-3 py-2">
          <Link href="/lab" className="text-xs text-primary hover:underline">
            ← آزمایشگاه
          </Link>
          <input
            className="min-w-[140px] flex-1 rounded border border-outline bg-surface-container px-2 py-1 text-sm font-semibold outline-none focus:border-primary md:max-w-xs"
            value={project.name}
            onChange={(e) =>
              updateProject((p) => ({ ...p, name: e.target.value }))
            }
          />
          <span className="text-[11px] text-on-surface-variant">
            {saveState === "saved" ? "ذخیره شد" : saveState === "saving" ? "در حال ذخیره…" : "تغییرات ذخیره‌نشده"}
          </span>
          <button type="button" className="lab-btn" onClick={undo} title="واگرد">
            Undo
          </button>
          <button type="button" className="lab-btn" onClick={redo}>
            Redo
          </button>
          <button
            type="button"
            className="lab-btn"
            onClick={() => {
              saveProjectLocal(project);
              setSaveState("saved");
              log("ذخیره دستی انجام شد.");
            }}
          >
            ذخیره
          </button>
          <button type="button" className="lab-btn" onClick={share}>
            اشتراک
          </button>
          <button type="button" className="lab-btn" onClick={() => setShowHelp((h) => !h)}>
            راهنما
          </button>
          <button
            type="button"
            className={`lab-btn ${simpleMode ? "lab-btn-active" : ""}`}
            onClick={() => {
              setSimpleMode(true);
              updateProject((p) => ({ ...p, mode: "simple" }));
            }}
          >
            ساده
          </button>
          <button
            type="button"
            className={`lab-btn ${!simpleMode ? "lab-btn-active" : ""}`}
            onClick={() => {
              setSimpleMode(false);
              updateProject((p) => ({ ...p, mode: "pro" }));
            }}
          >
            حرفه‌ای
          </button>
          <select
            className="rounded border border-outline bg-surface-container px-2 py-1 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) loadTemplate(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">قالب‌ها…</option>
            {LAB_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button type="button" className="lab-btn" onClick={exportJson}>
            خروجی JSON
          </button>
          <label className="lab-btn cursor-pointer">
            ورود JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
              }}
            />
          </label>
        </header>

        {showHelp && (
          <div className="border-b border-outline bg-surface-container px-4 py-2 text-xs leading-6 text-on-surface-variant">
            <strong className="text-on-surface">راهنمای سریع:</strong> قطعه را بکشید، روی پین‌ها کلیک
            کنید تا سیم بکشید (قرمز=تغذیه، مشکی=GND). قالب Blink را باز کنید و Run بزنید — کد با
            avr-gcc کامپایل و با avr8js در Worker اجرا می‌شود و LED چشمک می‌زند. قطعات «فقط مدل
            سه‌بعدی» شبیه‌سازی پین ندارند.
          </div>
        )}

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {leftOpen && (
            <aside className="flex w-56 shrink-0 flex-col border-e border-outline bg-surface-container-lowest p-2 md:w-64">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span>قطعات</span>
                <button type="button" className="text-on-surface-variant" onClick={() => setLeftOpen(false)}>
                  بستن
                </button>
              </div>
              <PartsPanel components={components} onAdd={addPart} />
            </aside>
          )}
          {!leftOpen && (
            <button
              type="button"
              className="w-6 shrink-0 border-e border-outline text-[10px] writing-vertical"
              onClick={() => setLeftOpen(true)}
            >
              قطعات
            </button>
          )}

          <main className="flex min-w-0 flex-1 flex-col gap-2 p-2">
            <div className="min-h-0 flex-[1.2]">
              <BoardCanvas
                project={project}
                components={components}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMovePart={(id, x, y) =>
                  setProject((p) => ({
                    ...p,
                    parts: p.parts.map((part) =>
                      part.instanceId === id ? { ...part, x, y } : part,
                    ),
                  }))
                }
                onAddWire={(wire: WireDef) =>
                  updateProject((p) => ({ ...p, wires: [...p.wires, wire] }))
                }
                onDeleteSelected={() => {
                  if (!selectedId) return;
                  updateProject((p) => ({
                    ...p,
                    parts: p.parts.filter((x) => x.instanceId !== selectedId),
                    wires: p.wires.filter(
                      (w) =>
                        w.id !== selectedId &&
                        w.from.instanceId !== selectedId &&
                        w.to.instanceId !== selectedId,
                    ),
                  }));
                  setSelectedId(null);
                }}
                ledOn={ledOn}
                simpleMode={simpleMode}
                onWireBlocked={(m) => log(`⛔ ${m}`)}
              />
            </div>

            {/* Transport */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={compiling}
                onClick={() => void runSim()}
                className={`rounded bg-primary-container px-4 py-2 font-mono text-sm font-bold text-on-primary shadow-[var(--box-shadow-neon)] ${
                  simpleMode ? "px-6 py-3 text-base" : ""
                }`}
              >
                {compiling ? "کامپایل…" : "Run ▶"}
              </button>
              <button type="button" className="lab-btn" onClick={() => engineRef.current?.pause()}>
                Pause
              </button>
              <button
                type="button"
                className="lab-btn"
                onClick={() => {
                  engineRef.current?.stop();
                  setLedOn(false);
                }}
              >
                Stop
              </button>
              <button
                type="button"
                className="lab-btn"
                onClick={() => {
                  engineRef.current?.reset();
                  setLedOn(false);
                  setSerial("");
                }}
              >
                Reset
              </button>
              <label className="flex items-center gap-1 text-xs">
                سرعت
                <input
                  type="range"
                  min={0.25}
                  max={8}
                  step={0.25}
                  value={speed}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSpeed(v);
                    engineRef.current?.setSpeed(v);
                  }}
                />
                ×{speed}
              </label>
              <span className="text-[11px] text-on-surface-variant">وضعیت: {engineStatus}</span>
              <span
                className={`inline-flex h-3 w-3 rounded-full ${ledOn ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-zinc-600"}`}
                title="LED D13"
              />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
              <CodeEditor
                value={project.code}
                onChange={(code) => updateProject((p) => ({ ...p, code }))}
              />
              <ConsolePanel logs={logs} serial={serial} />
            </div>
          </main>

          {rightOpen && (
            <aside className="flex w-56 shrink-0 flex-col border-s border-outline bg-surface-container-lowest md:w-72">
              <div className="flex items-center justify-between border-b border-outline px-2 py-1 text-xs font-semibold">
                <span>بازرس</span>
                <button type="button" onClick={() => setRightOpen(false)}>
                  بستن
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <Inspector part={selectedPart} def={selectedDef} />
              </div>
              <div className="max-h-40 overflow-y-auto border-t border-outline p-2 text-[11px]">
                <p className="mb-1 font-semibold">اعتبارسنجی سیم‌کشی</p>
                {issues.length === 0 ? (
                  <p className="text-emerald-400">مشکلی یافت نشد</p>
                ) : (
                  <ul className="space-y-1">
                    {issues.map((i, idx) => (
                      <li
                        key={`${i.code}-${idx}`}
                        className={
                          i.severity === "error"
                            ? "text-error"
                            : i.severity === "warning"
                              ? "text-amber-300"
                              : "text-on-surface-variant"
                        }
                      >
                        {i.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!simpleMode && (
                <div className="border-t border-outline p-2 text-[10px] font-mono text-on-surface-variant">
                  <p className="mb-1 font-semibold text-on-surface">Netlist</p>
                  {project.wires.map((w) => (
                    <div key={w.id}>
                      {w.from.instanceId}.{w.from.pinId} ↔ {w.to.instanceId}.{w.to.pinId}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-outline p-2">
                <p className="mb-1 text-xs font-semibold">BOM → سبد خرید</p>
                <ul className="mb-2 max-h-24 overflow-y-auto text-[11px]">
                  {bom.map((b) => (
                    <li key={b.componentId} className="flex justify-between gap-1">
                      <span>
                        {b.name} ×{b.qty}
                      </span>
                      <span className="text-on-surface-variant">
                        {b.productId ? "متصل" : "بدون محصول"}
                      </span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="lab-btn w-full" onClick={() => void addBom()}>
                  افزودن BOM به سبد
                </button>
                {bomMsg && <p className="mt-1 text-[11px] text-primary">{bomMsg}</p>}
              </div>
            </aside>
          )}
          {!rightOpen && (
            <button
              type="button"
              className="w-6 shrink-0 border-s border-outline text-[10px]"
              onClick={() => setRightOpen(true)}
            >
              بازرس
            </button>
          )}
        </div>
      </div>
      <style jsx global>{`
        .lab-btn {
          border-radius: 4px;
          border: 1px solid var(--outline);
          background: var(--surface-container);
          padding: 0.25rem 0.5rem;
          font-size: 11px;
          font-family: var(--font-mono);
        }
        .lab-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .lab-btn-active {
          background: var(--primary-container);
          color: var(--on-primary);
          border-color: transparent;
        }
      `}</style>
    </LabErrorBoundary>
  );
}
