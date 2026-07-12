import { MAX_RECIPE_PHOTO_BYTES } from "@shared/recipeImageLimits";
import { validatePublicHttpUrl } from "./urlFetch";

const FETCH_TIMEOUT_MS = 10_000;

const GENERIC_CONTENT_TYPES = new Set([
  "application/octet-stream",
  "binary/octet-stream",
]);

function sniffImageContentType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function resolveImageContentType(
  headerContentType: string | undefined,
  bytes: Uint8Array,
): string | null {
  const normalized = headerContentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized?.startsWith("image/")) {
    return normalized;
  }

  if (normalized !== undefined && !GENERIC_CONTENT_TYPES.has(normalized)) {
    return null;
  }

  return sniffImageContentType(bytes);
}

async function readImageBytesWithLimit(response: Response): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    if (blob.size > MAX_RECIPE_PHOTO_BYTES) {
      throw new Error("Image too large");
    }

    return new Uint8Array(await blob.arrayBuffer());
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_RECIPE_PHOTO_BYTES) {
      throw new Error("Image too large");
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}

export async function fetchRecipeCoverImage(
  imageUrl: string,
): Promise<Blob | null> {
  try {
    const parsedUrl = validatePublicHttpUrl(imageUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          Accept: "image/*",
          "User-Agent":
            "RecettesBot/1.0 (+https://recettes.local; recipe import for personal use)",
        },
      });

      if (!response.ok) {
        return null;
      }

      const bytes = await readImageBytesWithLimit(response);
      const contentType = resolveImageContentType(
        response.headers.get("content-type") ?? undefined,
        bytes,
      );
      if (!contentType) {
        return null;
      }

      return new Blob([Uint8Array.from(bytes)], { type: contentType });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}
