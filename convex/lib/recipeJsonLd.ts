import type { RecipeDraftData } from "./recipeDraft";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTypeValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenJsonLd(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap((item) => flattenJsonLd(item));
  }

  return [value];
}

function parseDurationToMinutes(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const isoMatch = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (isoMatch) {
    const hours = Number(isoMatch[1] ?? 0);
    const minutes = Number(isoMatch[2] ?? 0);
    const seconds = Number(isoMatch[3] ?? 0);
    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  const hourMatch = value.match(/(\d+)\s*h/i);
  const minuteMatch = value.match(/(\d+)\s*min/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

function parseServings(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) {
      return Number(match[0]);
    }
  }

  return undefined;
}

function parseIngredient(
  value: unknown,
): { name: string; quantity?: string; unit?: string } | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const match = trimmed.match(
    /^([\d.,/\s]+)\s*([a-zA-Zàâäéèêëïîôùûüç°%]+)?\s*(.*)$/u,
  );
  if (match && match[3]?.trim()) {
    return {
      quantity: match[1]?.trim() || undefined,
      unit: match[2]?.trim() || undefined,
      name: match[3].trim(),
    };
  }

  return { name: trimmed };
}

function parseInstructions(value: unknown): Array<{ text: string }> {
  if (typeof value === "string") {
    const text = value.trim();
    return text.length > 0 ? [{ text }] : [];
  }

  if (Array.isArray(value)) {
    const steps: Array<{ text: string }> = [];
    for (const item of value) {
      if (typeof item === "string") {
        const text = item.trim();
        if (text.length > 0) {
          steps.push({ text });
        }
        continue;
      }

      if (isRecord(item)) {
        const textValue =
          (typeof item.text === "string" && item.text) ||
          (typeof item.name === "string" && item.name) ||
          "";
        const text = textValue.trim();
        if (text.length > 0) {
          steps.push({ text });
        }
      }
    }
    return steps;
  }

  return [];
}

function recipeFromJsonLd(node: Record<string, unknown>): RecipeDraftData | null {
  const types = getTypeValues(node["@type"]).map((type) => type.toLowerCase());
  if (!types.includes("recipe")) {
    return null;
  }

  const name = typeof node.name === "string" ? node.name.trim() : "";
  const ingredients = Array.isArray(node.recipeIngredient)
    ? node.recipeIngredient
        .map(parseIngredient)
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];
  const steps = parseInstructions(node.recipeInstructions);

  if (name.length === 0 || ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  const keywords =
    typeof node.keywords === "string"
      ? node.keywords
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : Array.isArray(node.keywords)
        ? node.keywords
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

  return {
    name,
    ingredients,
    steps,
    servings: parseServings(node.recipeYield),
    prepTime: parseDurationToMinutes(node.prepTime),
    cookTime: parseDurationToMinutes(node.cookTime),
    totalTime: parseDurationToMinutes(node.totalTime),
    notes:
      typeof node.description === "string" && node.description.trim().length > 0
        ? node.description.trim()
        : undefined,
    tags: keywords,
  };
}

export function extractRecipeFromJsonLd(blocks: unknown[]): RecipeDraftData | null {
  for (const block of blocks) {
    for (const node of flattenJsonLd(block)) {
      const recipe = recipeFromJsonLd(node);
      if (recipe) {
        return recipe;
      }
    }
  }

  return null;
}
