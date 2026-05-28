import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Trash2 } from "lucide-react";

import { RecipeChatMessage } from "@/components/recipes/chat/recipe-chat-message";
import { useRecipeChat } from "@/components/recipes/chat/use-recipe-chat";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Id } from "../../../../convex/_generated/dataModel";

const SUGGESTED_QUESTIONS = [
  "Par quoi remplacer un ingrédient ?",
  "Est-ce que ça se congèle ?",
  "Quels accompagnements me suggères-tu ?",
  "Comment adapter pour 2 personnes ?",
  "Quels ustensiles me faut-il ?",
] as const;

type RecipeChatSheetProps = {
  recipeId: Id<"recipes">;
  recipeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecipeChatSheet({
  recipeId,
  recipeName,
  open,
  onOpenChange,
}: RecipeChatSheetProps) {
  const {
    messages,
    isLoading,
    isSending,
    isClearing,
    error,
    sendMessage,
    clearMessages,
  } = useRecipeChat(recipeId);

  const [draft, setDraft] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, isSending]);

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (trimmed.length === 0 || isSending) {
      return;
    }

    setDraft("");
    try {
      await sendMessage(trimmed);
    } catch {
      setDraft(trimmed);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend(draft);
    }
  }

  function applySuggestion(question: string) {
    setDraft(question);
    textareaRef.current?.focus();
  }

  const hasMessages = messages !== undefined && messages.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>Question sur la recette</SheetTitle>
          <SheetDescription className="line-clamp-2">{recipeName}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {error ? <RecipeErrorAlert message={error} /> : null}

            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-4/5" />
                <Skeleton className="ml-auto h-12 w-3/5" />
              </div>
            ) : null}

            {!isLoading && !hasMessages ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Posez une question sur cette recette : substitutions,
                  conservation, accompagnements, adaptation des portions…
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <Badge
                      key={question}
                      variant="outline"
                      className="cursor-pointer font-normal"
                      render={
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => applySuggestion(question)}
                        />
                      }
                    >
                      {question}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {!isLoading && hasMessages
              ? messages.map((message) => (
                  <RecipeChatMessage
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))
              : null}

            {isSending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Spinner />
                  Réflexion…
                </div>
              </div>
            ) : null}

            <div ref={scrollAnchorRef} />
          </div>

          {hasMessages ? (
            <div className="shrink-0 border-t px-4 pt-2">
              <div className="flex flex-wrap gap-2 pb-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((question) => (
                  <Badge
                    key={question}
                    variant="outline"
                    className="cursor-pointer font-normal"
                    render={
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => applySuggestion(question)}
                      />
                    }
                  >
                    {question}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="shrink-0 border-t p-4">
            <div className="flex flex-col gap-2">
              <InputGroup className="h-auto min-h-0 items-end">
                <InputGroupTextarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Votre question…"
                  rows={2}
                  disabled={isSending}
                  className="min-h-[4.5rem] py-2"
                />
                <InputGroupAddon align="block-end" className="pb-2">
                  <InputGroupButton
                    size="icon-sm"
                    disabled={isSending || draft.trim().length === 0}
                    onClick={() => void handleSend(draft)}
                    aria-label="Envoyer"
                  >
                    {isSending ? <Spinner /> : <SendHorizontal />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>

              {hasMessages ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  disabled={isSending || isClearing}
                  onClick={() => void clearMessages()}
                >
                  {isClearing ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Effacement…
                    </>
                  ) : (
                    <>
                      <Trash2 data-icon="inline-start" />
                      Effacer l&apos;historique
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
