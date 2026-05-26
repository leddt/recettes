import { parse } from "node-html-parser";

export function parseJsonLdBlocks(html: string): unknown[] {
  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
  });

  const blocks: unknown[] = [];

  for (const script of root.querySelectorAll("script")) {
    const type = (script.getAttribute("type") ?? "")
      .trim()
      .toLowerCase()
      .split(";")[0]
      ?.trim();

    if (type !== "application/ld+json") {
      continue;
    }

    const raw = script.textContent.trim();
    if (raw.length === 0) {
      continue;
    }

    try {
      blocks.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }

  return blocks;
}
