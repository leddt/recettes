import OpenAI from "openai";

import {
  normalizeRecipeDraft,
  type RecipeDraftData,
} from "./urlFetch";

function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    ["process"]?: { env?: Record<string, string | undefined> };
  };
  return runtime["process"]?.env?.[name];
}

export function getOpenAiClient(): OpenAI {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "La clé OPENAI_API_KEY n'est pas configurée dans Convex.",
    );
  }

  return new OpenAI({ apiKey });
}

/** Import depuis URL (extraction texte). Surcharge via OPENAI_IMPORT_MODEL. */
function getImportModel(): string {
  return getEnv("OPENAI_IMPORT_MODEL") ?? "gpt-5.4-mini";
}

/** Import depuis photos (vision). Surcharge via OPENAI_VISION_MODEL. */
function getVisionModel(): string {
  return getEnv("OPENAI_VISION_MODEL") ?? "gpt-5.4-mini";
}

const PHOTO_RECIPE_SYSTEM_PROMPT =
  "Tu transcris une recette de cuisine à partir de photos (livre, magazine, fiche, capture d'écran). " +
  "Réponds uniquement avec les champs JSON demandés. Les durées prepTime, cookTime et totalTime sont en minutes. " +
  "Règles de fidélité (prioritaires) : " +
  "(1) Ne résume pas, ne simplifie pas et n'omets aucun détail lisible. " +
  "(2) steps : une entrée par étape, sous-étape ou paragraphe de préparation distinct dans le document ; " +
  "ne fusionne jamais plusieurs étapes numérotées en une seule ; conserve températures, durées, puissances de feu, " +
  "quantités intermédiaires, noms d'ustensiles et formulations du texte source. " +
  "(3) ingredients : liste exhaustive ; quantités et unités exactes telles qu'écrites. " +
  "(4) notes : conseils du chef, variantes, garniture, conservation ou précisions hors étapes numérotées. " +
  "(5) Si le texte est illisible, ne devine pas ; transcris seulement ce qui est certain. " +
  "(6) Plusieurs images : une seule recette, ordre logique des pages, sans perdre de contenu entre images. " +
  "Pour sourceLabel : marque, site, magazine ou source visible (logo, en-tête) ; sinon null.";

const PHOTO_RECIPE_USER_PROMPT =
  "Transcris intégralement la recette visible sur ces images. " +
  "Chaque numéro d'étape, puce ou paragraphe de préparation distinct doit devenir une entrée séparée dans steps, " +
  "avec le libellé complet (pas de résumé en une phrase). " +
  "Reproduis tous les ingrédients et toutes les étapes lisibles.";

export const recipeJsonSchema = {
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

export const recipeWithSourceLabelJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...recipeJsonSchema.properties,
    sourceLabel: { type: ["string", "null"] },
  },
  required: [...recipeJsonSchema.required, "sourceLabel"],
} as const;

export type AiRecipeRaw = {
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

export function mapAiDraft(raw: AiRecipeRaw): RecipeDraftData {
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

export function resolvePhotoSourceLabel(
  aiLabel: string | null | undefined,
): string {
  const trimmed = aiLabel?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Photo";
}

const MAX_USER_INSTRUCTIONS_LENGTH = 2_000;

function appendUserInstructions(
  basePrompt: string,
  userInstructions?: string,
): string {
  const trimmed = userInstructions?.trim();
  if (!trimmed || trimmed.length === 0) {
    return basePrompt;
  }

  const limited =
    trimmed.length > MAX_USER_INSTRUCTIONS_LENGTH
      ? trimmed.slice(0, MAX_USER_INSTRUCTIONS_LENGTH)
      : trimmed;

  return (
    `${basePrompt}\n\nInstructions supplémentaires de l'utilisateur :\n${limited}`
  );
}

export async function extractRecipeWithAiFromText(
  pageText: string,
  sourceUrl: string,
  userInstructions?: string,
): Promise<RecipeDraftData> {
  const openai = getOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: getImportModel(),
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
        content: appendUserInstructions(
          `Extrais la recette depuis cette page (${sourceUrl}) :\n\n${pageText}`,
          userInstructions,
        ),
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

  return mapAiDraft(JSON.parse(content) as AiRecipeRaw);
}

export type ImageContentPart = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "low" | "high" | "auto";
  };
};

export async function extractRecipeWithAiFromImages(
  imageParts: ImageContentPart[],
  userInstructions?: string,
): Promise<{ draft: RecipeDraftData; sourceLabel: string }> {
  const openai = getOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: getVisionModel(),
    temperature: 0,
    max_tokens: 16_384,
    messages: [
      {
        role: "system",
        content: PHOTO_RECIPE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: appendUserInstructions(
              PHOTO_RECIPE_USER_PROMPT,
              userInstructions,
            ),
          },
          ...imageParts,
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "RecipeDraftWithSource",
        strict: true,
        schema: recipeWithSourceLabelJsonSchema,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Impossible d'extraire une recette.");
  }

  const parsed = JSON.parse(content) as AiRecipeRaw & {
    sourceLabel: string | null;
  };

  return {
    draft: mapAiDraft(parsed),
    sourceLabel: resolvePhotoSourceLabel(parsed.sourceLabel),
  };
}
