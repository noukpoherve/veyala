import type { ContentBlock } from "@/lib/blog/types";

/** Serialize structured blocks to an admin-editable markdown dialect. */
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "p":
          return block.text;
        case "h2":
          return `## ${block.text}`;
        case "h3":
          return `### ${block.text}`;
        case "ul":
          return block.items.map((item) => `- ${item}`).join("\n");
        case "ol":
          return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
        case "callout":
          return `!!! ${block.title ?? ""}\n${block.text}`.trimEnd();
        case "quote":
          return block.cite ? `> ${block.text}\n> - ${block.cite}` : `> ${block.text}`;
        case "cta":
          return `@@cta|${block.href}|${block.label}\n${block.text}\n@@`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Parse the admin markdown dialect back into ContentBlock[]. */
export function markdownToBlocks(markdown: string): ContentBlock[] {
  const chunks = markdown
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: ContentBlock[] = [];

  for (const chunk of chunks) {
    if (chunk.startsWith("@@cta|")) {
      const lines = chunk.split("\n");
      const header = lines[0] ?? "";
      const parts = header.split("|");
      const href = parts[1]?.trim() || "/register";
      const label = parts[2]?.trim() || "En savoir plus";
      const text = lines
        .slice(1)
        .filter((line) => line !== "@@")
        .join("\n")
        .trim();
      blocks.push({ type: "cta", href, label, text: text || label });
      continue;
    }

    if (chunk.startsWith("!!!")) {
      const lines = chunk.split("\n");
      const title = (lines[0] ?? "").replace(/^!!!\s*/, "").trim() || undefined;
      const text = lines.slice(1).join("\n").trim() || title || "";
      blocks.push({ type: "callout", title, text });
      continue;
    }

    if (chunk.startsWith(">")) {
      const lines = chunk.split("\n").map((line) => line.replace(/^>\s?/, ""));
      const citeLine = lines.find((line) => line.startsWith("— ") || line.startsWith("- "));
      const textLines = lines.filter((line) => line !== citeLine);
      const cite = citeLine?.replace(/^[—-]\s*/, "").trim();
      blocks.push({ type: "quote", text: textLines.join(" ").trim(), cite });
      continue;
    }

    if (/^###\s+/.test(chunk)) {
      blocks.push({ type: "h3", text: chunk.replace(/^###\s+/, "").trim() });
      continue;
    }

    if (/^##\s+/.test(chunk)) {
      blocks.push({ type: "h2", text: chunk.replace(/^##\s+/, "").trim() });
      continue;
    }

    const lines = chunk.split("\n");
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({
        type: "ul",
        items: lines.map((line) => line.replace(/^[-*]\s+/, "").trim()),
      });
      continue;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      blocks.push({
        type: "ol",
        items: lines.map((line) => line.replace(/^\d+\.\s+/, "").trim()),
      });
      continue;
    }

    blocks.push({ type: "p", text: chunk.replace(/\n/g, " ").trim() });
  }

  return blocks;
}

export function estimateReadingTimeMin(blocks: ContentBlock[]): number {
  const words = blocks
    .map((block) => {
      if ("text" in block) return block.text;
      if ("items" in block) return block.items.join(" ");
      return "";
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function countWords(blocks: ContentBlock[]): number {
  return blocks
    .map((block) => {
      if ("text" in block) return block.text;
      if ("items" in block) return block.items.join(" ");
      return "";
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countHeadings(blocks: ContentBlock[], level: "h2" | "h3" = "h2"): number {
  return blocks.filter((block) => block.type === level).length;
}

export function bodyPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if ("text" in block) return block.text;
      if ("items" in block) return block.items.join(" ");
      return "";
    })
    .join(" ");
}
