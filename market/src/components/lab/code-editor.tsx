"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { OnMount } from "@monaco-editor/react";

/** A compiler message on a line of the sketch. */
export type EditorDiagnostic = { line: number; column: number; severity: "error" | "warning"; message: string };

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-background font-mono text-xs text-on-surface-variant">
      &gt; بارگذاری ویرایشگر…
    </div>
  ),
});

type Api = { editor: Parameters<OnMount>[0]; monaco: Parameters<OnMount>[1] };

export function CodeEditor({
  value,
  onChange,
  diagnostics = [],
  revealToken = 0,
}: {
  value: string;
  onChange: (v: string) => void;
  diagnostics?: EditorDiagnostic[];
  /** Bump to scroll to the first error. */
  revealToken?: number;
}) {
  const api = useRef<Api | null>(null);

  // compiler errors/warnings as squiggles + gutter markers
  useEffect(() => {
    const a = api.current;
    const model = a?.editor.getModel();
    if (!a || !model) return;
    a.monaco.editor.setModelMarkers(
      model,
      "compile",
      diagnostics.map((d) => ({
        startLineNumber: d.line,
        endLineNumber: d.line,
        startColumn: Math.max(1, d.column),
        endColumn: model.getLineMaxColumn(Math.min(d.line, model.getLineCount())),
        message: d.message,
        severity: d.severity === "error" ? a.monaco.MarkerSeverity.Error : a.monaco.MarkerSeverity.Warning,
      })),
    );
  }, [diagnostics]);

  useEffect(() => {
    const first = diagnostics.find((d) => d.severity === "error");
    if (!revealToken || !first || !api.current) return;
    api.current.editor.revealLineInCenter(first.line);
    api.current.editor.setPosition({ lineNumber: first.line, column: Math.max(1, first.column) });
  }, [revealToken, diagnostics]);

  return (
    <div className="h-full min-h-[160px] overflow-hidden" dir="ltr">
      <Monaco
        height="100%"
        defaultLanguage="cpp"
        theme="pushrsp"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={(editor, monaco) => {
          api.current = { editor, monaco };
        }}
        beforeMount={(monaco) => {
          // Brand theme: void background, orange keywords, cyan types
          monaco.editor.defineTheme("pushrsp", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "keyword", foreground: "ff7a00" },
              { token: "type", foreground: "00d4ff" },
              { token: "number", foreground: "f0abfc" },
              { token: "string", foreground: "a7f3d0" },
              { token: "comment", foreground: "6b7280", fontStyle: "italic" },
            ],
            colors: {
              "editor.background": "#0a0a0f",
              "editor.lineHighlightBackground": "#12121a",
              "editorLineNumber.foreground": "#3f3f55",
              "editorLineNumber.activeForeground": "#ff7a00",
              "editorCursor.foreground": "#ff7a00",
              "editor.selectionBackground": "#ff7a0033",
              "editorIndentGuide.background1": "#1c1c2e",
            },
          });
        }}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 10 },
          renderLineHighlight: "line",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
