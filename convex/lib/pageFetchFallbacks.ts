import { BROWSER_USER_AGENT } from "./browserUserAgent";

const JINA_READER_BASE = "https://r.jina.ai/";
const WAYBACK_AVAILABILITY_API =
  "https://archive.org/wayback/available?url=";
const WAYBACK_LATEST_SNAPSHOT_PREFIX = "http://web.archive.org/web/2/";

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

  const sample =
    normalized.length > 10_000 ? normalized.slice(0, 2_000) : normalized;

  return BLOCKED_PAGE_MARKERS.some((marker) => sample.includes(marker));
}

export function buildJinaReaderUrl(targetUrl: string): string {
  return `${JINA_READER_BASE}${encodeURIComponent(targetUrl)}`;
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
    const htmlResponse = await fetch(buildJinaReaderUrl(url), {
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

    const markdownResponse = await fetch(buildJinaReaderUrl(url), {
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

async function fetchWaybackSnapshot(
  snapshotUrl: string,
  signal: AbortSignal,
  maxBytes: number,
): Promise<string | null> {
  const snapshotResponse = await fetch(snapshotUrl, {
    signal,
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": BROWSER_USER_AGENT,
    },
  });

  if (!snapshotResponse.ok) {
    return null;
  }

  const html = await readLimitedResponse(snapshotResponse, maxBytes);
  if (isBlockedPageContent(html, snapshotResponse.status) || html.length < 1_000) {
    return null;
  }

  return html;
}

export async function fetchViaWaybackMachine(
  url: string,
  maxBytes: number,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const latestSnapshot = await fetchWaybackSnapshot(
      `${WAYBACK_LATEST_SNAPSHOT_PREFIX}${url}`,
      controller.signal,
      maxBytes,
    );
    if (latestSnapshot) {
      return latestSnapshot;
    }

    const availabilityResponse = await fetch(
      `${WAYBACK_AVAILABILITY_API}${encodeURIComponent(url)}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": BROWSER_USER_AGENT,
        },
      },
    );

    if (availabilityResponse.ok) {
      const availability =
        (await availabilityResponse.json()) as WaybackAvailability;
      const snapshot = availability.archived_snapshots?.closest;
      if (
        snapshot?.available === true &&
        snapshot.status === "200" &&
        snapshot.url
      ) {
        const archivedSnapshot = await fetchWaybackSnapshot(
          snapshot.url,
          controller.signal,
          maxBytes,
        );
        if (archivedSnapshot) {
          return archivedSnapshot;
        }
      }
    }

    throw new Error("Aucune archive disponible pour cette page.");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La page met trop de temps à répondre.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
