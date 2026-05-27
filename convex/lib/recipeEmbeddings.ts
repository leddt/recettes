import { getOpenAiClient } from "./recipeAi";

export const EMBEDDING_DIMENSIONS = 1536;

function getEmbeddingModel(): string {
  const runtime = globalThis as typeof globalThis & {
    ["process"]?: { env?: Record<string, string | undefined> };
  };
  return runtime["process"]?.env?.["OPENAI_EMBEDDING_MODEL"] ?? "text-embedding-3-small";
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const openai = getOpenAiClient();
  const response = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: texts,
  });

  const embeddings = response.data
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);

  for (const embedding of embeddings) {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Dimension d'embedding inattendue (${embedding.length}, attendu ${EMBEDDING_DIMENSIONS}).`,
      );
    }
  }

  return embeddings;
}
