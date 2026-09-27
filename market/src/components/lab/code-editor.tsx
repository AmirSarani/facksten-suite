"use client";

import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-background font-mono text-xs text-on-surface-variant">
      &gt; بارگذاری ویرایشگر…
    </div>
  ),
});

export function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="h-full min-h-[160px] overflow-hidden" dir="ltr">
      <Monaco
        height="100%"
        defaultLanguage="cpp"
        theme="facksten"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={(monaco) => {
          // Brand theme: void background, orange keywords, cyan types
          monaco.editor.defineTheme("facksten", {
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
