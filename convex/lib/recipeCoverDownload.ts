import { MAX_RECIPE_PHOTO_BYTES } from "./recipeImageLimits";
import { validatePublicHttpUrl } from "./urlFetch";

const FETCH_TIMEOUT_MS = 10_000;

async function readImageWithLimit(response: Response): Promise<Blob> {
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    if (blob.size > MAX_RECIPE_PHOTO_BYTES) {
      throw new Error("Image too large");
    }
    return blob;
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

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";

  return new Blob([merged], { type: contentType });
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

      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
      if (!contentType?.startsWith("image/")) {
        return null;
      }

      return await readImageWithLimit(response);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}
