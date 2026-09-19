export type TocItem = { id: string; title: string };

export type ArticleBlock =
  | { type: "heading"; id: string; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; text: string }
  | { type: "figure"; src: string; caption: string }
  | { type: "callout"; title: string; text: string };

function slugify(text: string): string {
  const base =
    text
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .toLowerCase() || "section";
  return base;
}

export function estimateReadMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`\[\]()\-!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function parseArticleBody(body: string): {
  blocks: ArticleBlock[];
  toc: TocItem[];
} {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();
  let i = 0;

  function uniqueId(base: string) {
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    return id;
  }

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, text: code.join("\n") });
      continue;
    }

    if (line.startsWith(":::note") || line.startsWith(":::tip")) {
      const title = line.replace(/^:::(note|tip)\s*/, "").trim() || "نکته مهم";
      i++;
      const note: string[] = [];
      while (i < lines.length && lines[i].trim() !== ":::") {
        note.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "callout", title, text: note.join(" ").trim() });
      continue;
    }

    const fig = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (fig) {
      blocks.push({ type: "figure", caption: fig[1], src: fig[2] });
      i++;
      continue;
    }

    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const text = heading[1].trim();
      const id = uniqueId(slugify(text));
      toc.push({ id, title: text });
      blocks.push({ type: "heading", id, text });
      i++;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
      ) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (line.startsWith(">")) {
      const note: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        note.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const joined = note.join(" ").trim();
      const m = joined.match(/^(نکته مهم|توجه|نکته)[:：]?\s*(.*)$/);
      blocks.push({
        type: "callout",
        title: m ? m[1] : "نکته مهم",
        text: m ? m[2] || joined : joined,
      });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("##") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(":::") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !/^!\[[^\]]*\]\(/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return { blocks, toc };
}
