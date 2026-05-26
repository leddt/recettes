"use node";

import OpenAI from "openai";
import { v } from "convex/values";

import { extractedRecipeValidator } from "./lib/recipeValidators";
import { parseJsonLdBlocks } from "./lib/htmlParse";
import { extractRecipeFromJsonLd } from "./lib/recipeJsonLd";
import {
  fetchPageHtml,
  htmlToText,
  isValidRecipeDraft,
  normalizeRecipeDraft,
  type RecipeDraftData,
} from "./lib/urlFetch";
import { action } from "./_generated/server";

function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    ["process"]?: { env?: Record<string, string | undefined> };
  };
  return runtime["process"]?.env?.[name];
}

function getOpenAiClient(): OpenAI {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "La clé OPENAI_API_KEY n'est pas configurée dans Convex.",
    );
  }

  return new OpenAI({ apiKey });
}

const recipeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: ["string", "null"] },
          unit: { type: ["string", "null"] },
        },
        required: ["name", "quantity", "unit"],
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
        },
        required: ["text"],
      },
    },
    servings: { type: ["number", "null"] },
    prepTime: { type: ["number", "null"] },
    cookTime: { type: ["number", "null"] },
    totalTime: { type: ["number", "null"] },
    notes: { type: ["string", "null"] },
    tags: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "name",
    "ingredients",
    "steps",
    "servings",
    "prepTime",
    "cookTime",
    "totalTime",
    "notes",
    "tags",
  ],
} as const;

function nullableString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function nullableNumber(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.round(value);
}

function mapAiDraft(raw: {
  name: string;
  ingredients: Array<{
    name: string;
    quantity: string | null;
    unit: string | null;
  }>;
  steps: Array<{ text: string }>;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  notes: string | null;
  tags: string[];
}): RecipeDraftData {
  return normalizeRecipeDraft({
    name: raw.name,
    ingredients: raw.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: nullableString(ingredient.quantity),
      unit: nullableString(ingredient.unit),
    })),
    steps: raw.steps,
    servings: nullableNumber(raw.servings),
    prepTime: nullableNumber(raw.prepTime),
    cookTime: nullableNumber(raw.cookTime),
    totalTime: nullableNumber(raw.totalTime),
    notes: nullableString(raw.notes),
    tags: raw.tags,
  });
}

async function extractRecipeWithAi(
  pageText: string,
  sourceUrl: string,
): Promise<RecipeDraftData> {
  const openai = getOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Tu extrais une recette de cuisine à partir du contenu d'une page web. " +
          "Réponds uniquement avec les champs demandés. " +
          "Les durées prepTime, cookTime et totalTime doivent être en minutes. " +
          "Si une information est absente, mets null ou une liste vide.",
      },
      {
        role: "user",
        content:
          `Extrais la recette depuis cette page (${sourceUrl}) :\n\n${pageText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "RecipeDraft",
        strict: true,
        schema: recipeJsonSchema,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Impossible d'extraire une recette.");
  }

  const parsed = JSON.parse(content) as {
    name: string;
    ingredients: Array<{
      name: string;
      quantity: string | null;
      unit: string | null;
    }>;
    steps: Array<{ text: string }>;
    servings: number | null;
    prepTime: number | null;
    cookTime: number | null;
    totalTime: number | null;
    notes: string | null;
    tags: string[];
  };

  return mapAiDraft(parsed);
}

export const extractFromUrl = action({
  args: {
    url: v.string(),
    forceAi: v.optional(v.boolean()),
  },
  returns: extractedRecipeValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non authentifié.");
    }

    const { html, finalUrl } = await fetchPageHtml(args.url);
    const draft = args.forceAi
      ? await extractRecipeWithAi(htmlToText(html), finalUrl.toString())
      : (extractRecipeFromJsonLd(parseJsonLdBlocks(html)) ??
        (await extractRecipeWithAi(htmlToText(html), finalUrl.toString())));

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
