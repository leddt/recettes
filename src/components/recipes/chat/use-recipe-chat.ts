import { useAction, useQuery } from "convex/react";
import { useCallback, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur est survenue.";
}

export function useRecipeChatConversations(recipeId: Id<"recipes">) {
  const conversations = useQuery(api.recipeChat.listConversations, { recipeId });

  return {
    conversations,
    isLoading: conversations === undefined,
  };
}

export function useRecipeChatThread(
  recipeId: Id<"recipes">,
  conversationId: Id<"recipeChatConversations"> | "new" | null,
) {
  const messages = useQuery(
    api.recipeChat.listMessages,
    conversationId !== null && conversationId !== "new"
      ? { conversationId }
      : "skip",
  );
  const sendMessageAction = useAction(api.recipeChatActions.sendMessage);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setIsSending(true);
      try {
        const newConversationId = await sendMessageAction({
          recipeId,
          conversationId:
            conversationId === "new" || conversationId === null
              ? undefined
              : conversationId,
          content,
        });
        return newConversationId;
      } catch (caught) {
        setError(getErrorMessage(caught));
        throw caught;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, recipeId, sendMessageAction],
  );

  return {
    messages: conversationId === "new" || conversationId === null ? [] : messages,
    isLoading:
      conversationId !== null &&
      conversationId !== "new" &&
      messages === undefined,
    isSending,
    error,
    setError,
    sendMessage,
  };
}
