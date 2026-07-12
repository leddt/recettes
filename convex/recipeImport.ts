"use node";

import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";

import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { extractedRecipeValidator } from "./lib/recipeValidators";
import { parseJsonLdBlocks } from "./lib/htmlParse";
import { extractRecipeFromJsonLd } from "./lib/recipeJsonLd";
import {
  extractRecipeWithAiFromImages,
  extractRecipeWithAiFromText,
  type ImageContentPart,
} from "./lib/recipeAi";
import {
  MAX_RECIPE_PHOTO_BYTES,
  MAX_RECIPE_PHOTOS,
} from "./lib/recipeImageLimits";
import { fetchRecipeCoverImage } from "./lib/recipeCoverDownload";
import { extractRecipeImageUrlFromHtml } from "./lib/recipePageImage";
import {
  isValidRecipeDraft,
  normalizeRecipeDraft,
} from "./lib/recipeDraft";
import { fetchPageContent, htmlToText } from "./lib/urlFetch";
import { requireAuthUserId } from "./lib/requireAuth";
import { action } from "./_generated/server";

type ActionCtx = GenericActionCtx<DataModel>;

async function loadImageParts(
  ctx: ActionCtx,
  storageIds: Id<"_storage">[],
): Promise<ImageContentPart[]> {
  if (storageIds.length === 0) {
    throw new Error("Ajoutez au moins une photo.");
  }

  if (storageIds.length > MAX_RECIPE_PHOTOS) {
    throw new Error(`Maximum ${MAX_RECIPE_PHOTOS} photos par import.`);
  }

  const metadataList = await ctx.runQuery(internal.files.getStorageMetadataBatch, {
    storageIds,
  });

  const imageParts: ImageContentPart[] = [];

  for (let index = 0; index < storageIds.length; index += 1) {
    const storageId = storageIds[index];
    const metadata = metadataList[index];
    if (metadata === null || metadata === undefined) {
      throw new Error("Une des photos est introuvable.");
    }

    if (
      metadata.contentType === undefined ||
      !metadata.contentType.startsWith("image/")
    ) {
      throw new Error("Seules les images sont acceptées.");
    }

    if (metadata.size > MAX_RECIPE_PHOTO_BYTES) {
      throw new Error("Une des photos dépasse la taille maximale de 5 Mo.");
    }

    const blob = await ctx.storage.get(storageId);
    if (blob === null) {
      throw new Error("Une des photos est introuvable.");
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);
    imageParts.push({
      type: "image_url",
      image_url: {
        url: `data:${metadata.contentType};base64,${base64}`,
        detail: "high",
      },
    });
  }

  return imageParts;
}

async function tryStoreCoverFromPage(
  ctx: ActionCtx,
  html: string,
  pageUrl: URL,
): Promise<{ coverImageId: Id<"_storage">; coverImageUrl: string | null } | null> {
  const imageUrl = extractRecipeImageUrlFromHtml(html, pageUrl);
  if (!imageUrl) {
    return null;
  }

  const blob = await fetchRecipeCoverImage(imageUrl);
  if (!blob) {
    return null;
  }

  const coverImageId = await ctx.storage.store(blob);
  const coverImageUrl = await ctx.storage.getUrl(coverImageId);
  return { coverImageId, coverImageUrl };
}

export const extractFromUrl = action({
  args: {
    url: v.string(),
    forceAi: v.optional(v.boolean()),
    userInstructions: v.optional(v.string()),
  },
  returns: extractedRecipeValidator,
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const page = await fetchPageContent(args.url);
    const { finalUrl } = page;
    const pageText = page.text ?? htmlToText(page.html ?? "");
    const html = page.html ?? "";

    const draft = args.forceAi
      ? await extractRecipeWithAiFromText(
          pageText,
          finalUrl.toString(),
          args.userInstructions,
        )
      : ((html.length > 0
          ? extractRecipeFromJsonLd(parseJsonLdBlocks(html))
          : null) ??
        (await extractRecipeWithAiFromText(
          pageText,
          finalUrl.toString(),
          args.userInstructions,
        )));

    const normalized = normalizeRecipeDraft(draft);
    if (!isValidRecipeDraft(normalized)) {
      throw new Error("Impossible d'extraire une recette depuis cette page.");
    }

    const cover =
      html.length > 0
        ? await tryStoreCoverFromPage(ctx, html, finalUrl)
        : null;

    return {
      ...normalized,
      sourceUrl: finalUrl.toString(),
      sourceLabel: finalUrl.hostname.replace(/^www\./, ""),
      coverImageId: cover?.coverImageId,
      coverImageUrl: cover?.coverImageUrl ?? undefined,
    };
  },
});

export const extractFromImages = action({
  args: {
    storageIds: v.array(v.id("_storage")),
    userInstructions: v.optional(v.string()),
  },
  returns: extractedRecipeValidator,
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const imageParts = await loadImageParts(ctx, args.storageIds);
    const { draft, sourceLabel } = await extractRecipeWithAiFromImages(
      imageParts,
      args.userInstructions,
    );

    const normalized = normalizeRecipeDraft(draft);
    if (!isValidRecipeDraft(normalized)) {
      throw new Error(
        "Impossible d'extraire une recette depuis ces photos.",
      );
    }

    return {
      ...normalized,
      sourceLabel,
      photos: args.storageIds,
    };
  },
});
