import { parse } from "node-html-parser";

import { parseJsonLdBlocks } from "./htmlParse";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTypeValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenJsonLd(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap((item) => flattenJsonLd(item));
  }

  return [value];
}

export function extractRecipeImageUrlFromJsonLd(
  blocks: unknown[],
  baseUrl: URL,
): string | null {
  for (const block of blocks) {
    for (const node of flattenJsonLd(block)) {
      const types = getTypeValues(node["@type"]).map((type) => type.toLowerCase());
      if (!types.includes("recipe")) {
        continue;
      }

      const resolved = parseImageUrlFromJsonLdValue(node.image, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

function resolveImageUrl(candidate: string, baseUrl: URL): string | null {
  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function metaContent(
  root: ReturnType<typeof parse>,
  selectors: string[],
): string | null {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (!element) {
      continue;
    }

    const content = element.getAttribute("content")?.trim();
    if (content && content.length > 0) {
      return content;
    }
  }

  return null;
}

export function extractRecipeImageUrlFromHtml(
  html: string,
  pageUrl: URL,
): string | null {
  const jsonLdBlocks = parseJsonLdBlocks(html);
  const fromJsonLd = extractRecipeImageUrlFromJsonLd(jsonLdBlocks, pageUrl);
  if (fromJsonLd) {
    return fromJsonLd;
  }

  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
  });

  const fromMeta =
    metaContent(root, [
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="twitter:image"]',
    ]) ?? null;

  if (fromMeta) {
    return resolveImageUrl(fromMeta, pageUrl);
  }

  return null;
}

export function parseImageUrlFromJsonLdValue(
  value: unknown,
  baseUrl: URL,
): string | null {
  if (typeof value === "string") {
    return resolveImageUrl(value, baseUrl);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = parseImageUrlFromJsonLdValue(item, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  if (isRecord(value)) {
    const urlValue =
      (typeof value.url === "string" && value.url) ||
      (typeof value["@id"] === "string" && value["@id"]) ||
      (typeof value.contentUrl === "string" && value.contentUrl) ||
      "";
    if (urlValue.length > 0) {
      return resolveImageUrl(urlValue, baseUrl);
    }
  }

  return null;
}
