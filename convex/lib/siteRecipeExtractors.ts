import { parse } from "node-html-parser";

import type { RecipeDraftData } from "./urlFetch";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

function cleanText(value: string): string {
  return decodeHtmlEntities(value.replace(/\s+/g, " ").trim());
}

function parseIngredientLine(line: string): RecipeDraftData["ingredients"][number] {
  const trimmed = cleanText(line);
  const match = trimmed.match(
    /^([\d.,/\s¼½¾⅓⅔⅛-]+)?\s*((?:\d+\s+)?(?:tasse|tasses|cuillère[sà]? à (?:table|thé)|c\. à (?:table|thé)|lb|ml|g|kg|oz)(?:\s*\([^)]+\))?)?\s*(.+)$/iu,
  );

  if (match?.[3]) {
    return {
      quantity: match[1]?.trim() || undefined,
      unit: match[2]?.trim() || undefined,
      name: match[3].trim(),
    };
  }

  return { name: trimmed };
}

function parseDurationLabel(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanText(value).toLowerCase();
  const hourMatch = normalized.match(/(\d+)\s*h/);
  const minuteMatch = normalized.match(/(\d+)\s*min/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (hours > 0 || minutes > 0) {
    return hours * 60 + minutes;
  }

  if (normalized.includes("30 et 60")) {
    return 45;
  }

  if (normalized.includes("moins de 30")) {
    return 20;
  }

  return undefined;
}

function extractRecettesQcRecipe(html: string): RecipeDraftData | null {
  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
  });

  const name = cleanText(root.querySelector("h1")?.textContent ?? "");
  const ingredientElements = root.querySelectorAll("section.ingredients li");
  const ingredients = ingredientElements
    .map((element) => parseIngredientLine(element.textContent ?? ""))
    .filter((ingredient) => ingredient.name.length > 0);

  const methodSection = root.querySelector("section.method");
  const steps: Array<{ text: string }> = [];
  if (methodSection) {
    const headings = methodSection.querySelectorAll("h3");
    for (const heading of headings) {
      const stepTitle = cleanText(heading.textContent ?? "");
      const paragraph = heading.nextElementSibling;
      const stepBody =
        paragraph?.tagName?.toLowerCase() === "p"
          ? cleanText(paragraph.textContent ?? "")
          : "";
      const text = [stepTitle, stepBody].filter(Boolean).join(" — ");
      if (text.length > 0) {
        steps.push({ text });
      }
    }
  }

  if (name.length === 0 || ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  const notes = cleanText(
    methodSection?.querySelector("h4.author-notes + p")?.textContent ?? "",
  );

  const tags = root
    .querySelectorAll("aside.tags a, .tags a")
    .map((element) => cleanText(element.textContent ?? ""))
    .filter((tag) => tag.length > 0);

  const servingsMatch = cleanText(root.textContent ?? "").match(
    /(\d+)\s+portions?/i,
  );

  return {
    name,
    ingredients,
    steps,
    servings: servingsMatch ? Number(servingsMatch[1]) : undefined,
    prepTime: parseDurationLabel(
      root
        .querySelector('meta[name="cXenseParse:recs:que-preparationtime"]')
        ?.getAttribute("content") ?? undefined,
    ),
    cookTime: parseDurationLabel(
      root
        .querySelector('meta[name="cXenseParse:recs:que-cookingtime"]')
        ?.getAttribute("content") ?? undefined,
    ),
    notes: notes.length > 0 ? notes : undefined,
    tags,
  };
}

export function extractRecipeFromSiteHtml(
  html: string,
  pageUrl: URL,
): RecipeDraftData | null {
  const hostname = pageUrl.hostname.toLowerCase().replace(/^www\./, "");

  if (hostname === "recettes.qc.ca") {
    return extractRecettesQcRecipe(html);
  }

  return null;
}
