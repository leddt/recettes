export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getTypeValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export function flattenJsonLd(value: unknown): Record<string, unknown>[] {
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
