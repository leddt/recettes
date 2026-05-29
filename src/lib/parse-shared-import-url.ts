function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractUrlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/);
  if (!match) {
    return null;
  }

  return match[0].replace(/[.,;:!?)]+$/, "");
}

/** Extrait une URL de recette depuis les paramètres d'un Web Share Target (GET). */
export function parseSharedImportUrl(
  searchParams: URLSearchParams,
): string | null {
  const urlParam = searchParams.get("url")?.trim();
  if (urlParam && isHttpUrl(urlParam)) {
    return urlParam;
  }

  const textParam = searchParams.get("text")?.trim();
  if (textParam) {
    if (isHttpUrl(textParam)) {
      return textParam;
    }

    const fromText = extractUrlFromText(textParam);
    if (fromText) {
      return fromText;
    }
  }

  const titleParam = searchParams.get("title")?.trim();
  if (titleParam && isHttpUrl(titleParam)) {
    return titleParam;
  }

  return null;
}
