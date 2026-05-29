import { getOpenAiClient } from "./recipeAi";

function getEnv(name: string): string | undefined {
  const runtime = globalThis as typeof globalThis & {
    ["process"]?: { env?: Record<string, string | undefined> };
  };
  return runtime["process"]?.env?.[name];
}

function getChatModel(): string {
  return getEnv("OPENAI_CHAT_MODEL") ?? "gpt-5.4-mini";
}

const SYSTEM_PROMPT =
  "Tu es un assistant culinaire francophone. L'utilisateur pose des questions sur une recette précise " +
  "dont le contenu complet t'est fourni ci-dessous.\n\n" +
  "Règles :\n" +
  "- Base tes réponses sur cette recette (ingrédients, étapes, notes, temps, portions).\n" +
  "- Si l'information n'est pas dans la recette, dis-le clairement ; tu peux alors donner un conseil général " +
  "en le présentant comme tel (ex. conservation, substitution courante).\n" +
  "- Réponses concises, pratiques et actionnables. Ne recopie pas toute la recette.\n" +
  "- Pas de conseil médical. Pour allergies ou régimes stricts, rappelle de vérifier les ingrédients.\n" +
  "- Tu peux utiliser du markdown léger (listes, gras) si utile.";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function askRecipeQuestion(args: {
  recipeContext: string;
  messages: ChatTurn[];
}): Promise<string> {
  const openai = getOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n---\n\nRecette :\n\n${args.recipeContext}`,
      },
      ...args.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("L'assistant n'a pas renvoyé de réponse.");
  }

  return reply;
}
