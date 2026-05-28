import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur est survenue.";
}

export function useRecipeChat(recipeId: Id<"recipes">) {
  const messages = useQuery(api.recipeChat.listMessages, { recipeId });
  const sendMessageAction = useAction(api.recipeChatActions.sendMessage);
  const clearMessagesMutation = useMutation(api.recipeChat.clearMessages);

  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setIsSending(true);
      try {
        await sendMessageAction({ recipeId, content });
      } catch (caught) {
        setError(getErrorMessage(caught));
        throw caught;
      } finally {
        setIsSending(false);
      }
    },
    [recipeId, sendMessageAction],
  );

  const clearMessages = useCallback(async () => {
    setError(null);
    setIsClearing(true);
    try {
      await clearMessagesMutation({ recipeId });
    } catch (caught) {
      setError(getErrorMessage(caught));
      throw caught;
    } finally {
      setIsClearing(false);
    }
  }, [clearMessagesMutation, recipeId]);

  return {
    messages,
    isLoading: messages === undefined,
    isSending,
    isClearing,
    error,
    setError,
    sendMessage,
    clearMessages,
  };
}
