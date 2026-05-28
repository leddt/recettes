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
import {
  fetchPageHtml,
  htmlToText,
  isValidRecipeDraft,
  normalizeRecipeDraft,
} from "./lib/urlFetch";
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

export const extractFromUrl = action({
  args: {
    url: v.string(),
    forceAi: v.optional(v.boolean()),
    userInstructions: v.optional(v.string()),
  },
  returns: extractedRecipeValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non authentifié.");
    }

    const { html, finalUrl } = await fetchPageHtml(args.url);
    const draft = args.forceAi
      ? await extractRecipeWithAiFromText(
          htmlToText(html),
          finalUrl.toString(),
          args.userInstructions,
        )
      : (extractRecipeFromJsonLd(parseJsonLdBlocks(html)) ??
        (await extractRecipeWithAiFromText(
          htmlToText(html),
          finalUrl.toString(),
          args.userInstructions,
        )));

    const normalized = normalizeRecipeDraft(draft);
    if (!isValidRecipeDraft(normalized)) {
      throw new Error("Impossible d'extraire une recette depuis cette page.");
    }

    return {
      ...normalized,
      sourceUrl: finalUrl.toString(),
      sourceLabel: finalUrl.hostname.replace(/^www\./, ""),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non authentifié.");
    }

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
