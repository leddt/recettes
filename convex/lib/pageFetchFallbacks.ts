const JINA_READER_BASE = "https://r.jina.ai/";
const WAYBACK_AVAILABILITY_API =
  "https://archive.org/wayback/available?url=";

const BLOCKED_PAGE_MARKERS = [
  "access denied",
  "you don't have permission to access",
  "errors.edgesuite.net",
];

export function isBlockedPageContent(
  content: string,
  statusCode?: number,
): boolean {
  if (statusCode !== undefined && statusCode === 403) {
    return true;
  }

  const normalized = content.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (normalized.length < 600) {
    return BLOCKED_PAGE_MARKERS.some((marker) => normalized.includes(marker));
  }

  return BLOCKED_PAGE_MARKERS.some((marker) => normalized.includes(marker));
}

export function parseJinaReaderMarkdown(body: string): {
  title: string;
  markdown: string;
  blocked: boolean;
} {
  const titleMatch = body.match(/^Title:\s*(.*)$/m);
  const title = titleMatch?.[1]?.trim() ?? "";

  const warningMatch = body.match(/^Warning:\s*(.*)$/m);
  const warning = warningMatch?.[1]?.trim().toLowerCase() ?? "";

  const markdownMarker = "Markdown Content:";
  const markerIndex = body.indexOf(markdownMarker);
  const markdown =
    markerIndex >= 0
      ? body.slice(markerIndex + markdownMarker.length).trim()
      : body.trim();

  const blocked =
    title.toLowerCase() === "access denied" ||
    warning.includes("403") ||
    warning.includes("forbidden") ||
    isBlockedPageContent(markdown);

  return { title, markdown, blocked };
}

async function readLimitedResponse(response: Response, maxBytes: number): Promise<string> {
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
    if (totalBytes > maxBytes) {
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

export async function fetchViaJinaReader(
  url: string,
  maxBytes: number,
  timeoutMs: number,
): Promise<{ html?: string; text?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const htmlResponse = await fetch(`${JINA_READER_BASE}${url}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html",
        "X-Return-Format": "html",
      },
    });

    if (htmlResponse.ok) {
      const html = await readLimitedResponse(htmlResponse, maxBytes);
      if (!isBlockedPageContent(html, htmlResponse.status)) {
        return { html };
      }
    }

    const markdownResponse = await fetch(`${JINA_READER_BASE}${url}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/plain",
      },
    });

    if (!markdownResponse.ok) {
      throw new Error("Lecteur alternatif indisponible.");
    }

    const body = await readLimitedResponse(markdownResponse, maxBytes);
    const parsed = parseJinaReaderMarkdown(body);
    if (parsed.blocked || parsed.markdown.length === 0) {
      throw new Error("Lecteur alternatif bloqué par le site.");
    }

    return { text: parsed.markdown };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La page met trop de temps à répondre.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

type WaybackAvailability = {
  archived_snapshots?: {
    closest?: {
      available?: boolean;
      status?: string;
      url?: string;
    };
  };
};

export async function fetchViaWaybackMachine(
  url: string,
  maxBytes: number,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const availabilityResponse = await fetch(
      `${WAYBACK_AVAILABILITY_API}${encodeURIComponent(url)}`,
      { signal: controller.signal },
    );

    if (!availabilityResponse.ok) {
      throw new Error("Archive web indisponible.");
    }

    const availability =
      (await availabilityResponse.json()) as WaybackAvailability;
    const snapshot = availability.archived_snapshots?.closest;
    if (
      snapshot?.available !== true ||
      snapshot.status !== "200" ||
      !snapshot.url
    ) {
      throw new Error("Aucune archive disponible pour cette page.");
    }

    const snapshotResponse = await fetch(snapshot.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; RecettesBot/1.0; +https://recettes.local)",
      },
    });

    if (!snapshotResponse.ok) {
      throw new Error("Impossible de lire l'archive de cette page.");
    }

    const html = await readLimitedResponse(snapshotResponse, maxBytes);
    if (isBlockedPageContent(html, snapshotResponse.status)) {
      throw new Error("L'archive de cette page n'est pas utilisable.");
    }

    return html;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La page met trop de temps à répondre.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
