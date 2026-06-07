import {
  fetchViaJinaReader,
  fetchViaWaybackMachine,
  isBlockedPageContent,
} from "./pageFetchFallbacks";

const MAX_RESPONSE_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_TEXT_LENGTH = 20_000;
const MAX_REDIRECTS = 5;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
    a === 169 && b === 254 ||
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

export type FetchedPageContent = {
  html?: string;
  text?: string;
  finalUrl: URL;
};

async function fetchPageDirect(
  parsedUrl: URL,
): Promise<{ html: string; finalUrl: URL; status: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentUrl = parsedUrl;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      validatePublicHttpUrl(currentUrl.toString());

      const response = await fetch(currentUrl.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
          "User-Agent": BROWSER_USER_AGENT,
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return null;
        }

        currentUrl = new URL(location, currentUrl);
        continue;
      }

      const finalUrl = new URL(response.url || currentUrl.toString());
      validatePublicHttpUrl(finalUrl.toString());

      const html = await readResponseWithLimit(response);
      if (!response.ok || isBlockedPageContent(html, response.status)) {
        return null;
      }

      return { html, finalUrl, status: response.status };
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La page met trop de temps à répondre.");
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPageContent(url: string): Promise<FetchedPageContent> {
  const parsedUrl = validatePublicHttpUrl(url);

  const direct = await fetchPageDirect(parsedUrl);
  if (direct) {
    return { html: direct.html, finalUrl: direct.finalUrl };
  }

  try {
    const jina = await fetchViaJinaReader(
      parsedUrl.toString(),
      MAX_RESPONSE_BYTES,
      FETCH_TIMEOUT_MS,
    );
    if (jina.html) {
      return { html: jina.html, finalUrl: parsedUrl };
    }
    if (jina.text) {
      return { text: jina.text, finalUrl: parsedUrl };
    }
  } catch {
    // Try the next fallback.
  }

  try {
    const html = await fetchViaWaybackMachine(
      parsedUrl.toString(),
      MAX_RESPONSE_BYTES,
      FETCH_TIMEOUT_MS,
    );
    return { html, finalUrl: parsedUrl };
  } catch {
    // Fall through to the user-facing error below.
  }

  throw new Error(
    "Impossible d'accéder à cette page. Certains sites bloquent l'import automatique ; essayez l'import par photo.",
  );
}

export async function fetchPageHtml(url: string): Promise<{ html: string; finalUrl: URL }> {
  const page = await fetchPageContent(url);
  if (!page.html) {
    throw new Error(
      "Impossible d'accéder à cette page. Certains sites bloquent l'import automatique ; essayez l'import par photo.",
    );
  }

  return { html: page.html, finalUrl: page.finalUrl };
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
    .replace(/&eacute;/gi, "é")
    .replace(/&Eacute;/gi, "É")
    .replace(/&egrave;/gi, "è")
    .replace(/&Egrave;/gi, "È")
    .replace(/&agrave;/gi, "à")
    .replace(/&Agrave;/gi, "À")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/gi, "Ç")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&icirc;/gi, "î")
    .replace(/&ucirc;/gi, "û")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
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
