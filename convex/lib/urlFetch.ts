const MAX_RESPONSE_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_TEXT_LENGTH = 20_000;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

export type RecipeDraftData = {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  steps: Array<{ text: string }>;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  notes?: string;
  tags: string[];
};

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

export function validatePublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("L'URL fournie n'est pas valide.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Seules les URL http et https sont acceptées.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new Error("Cette URL n'est pas autorisée.");
  }

  return parsed;
}

async function readResponseWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return await response.text();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      throw new Error("La page est trop volumineuse pour être analysée.");
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

export async function fetchPageHtml(url: string): Promise<{ html: string; finalUrl: URL }> {
  const parsedUrl = validatePublicHttpUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "RecettesBot/1.0 (+https://recettes.local; recipe import for personal use)",
      },
    });

    if (!response.ok) {
      throw new Error("Impossible d'accéder à cette page.");
    }

    const finalUrl = new URL(response.url);
    validatePublicHttpUrl(finalUrl.toString());

    const html = await readResponseWithLimit(response);
    return { html, finalUrl };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La page met trop de temps à répondre.");
    }

    if (error instanceof Error && error.message.length > 0) {
      throw error;
    }

    throw new Error("Impossible d'accéder à cette page.");
  } finally {
    clearTimeout(timeout);
  }
}

export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const withBreaks = withoutScripts
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const text = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text.slice(0, MAX_TEXT_LENGTH);
}

export function normalizeRecipeDraft(draft: RecipeDraftData): RecipeDraftData {
  return {
    name: draft.name.trim(),
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity?.trim() || undefined,
        unit: ingredient.unit?.trim() || undefined,
      }))
      .filter((ingredient) => ingredient.name.length > 0),
    steps: draft.steps
      .map((step) => ({ text: step.text.trim() }))
      .filter((step) => step.text.length > 0),
    servings: draft.servings,
    prepTime: draft.prepTime,
    cookTime: draft.cookTime,
    totalTime: draft.totalTime,
    notes: draft.notes?.trim() || undefined,
    tags: draft.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
  };
}

export function isValidRecipeDraft(draft: RecipeDraftData): boolean {
  return (
    draft.name.trim().length > 0 &&
    draft.ingredients.some((ingredient) => ingredient.name.trim().length > 0) &&
    draft.steps.some((step) => step.text.trim().length > 0)
  );
}
