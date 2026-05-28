import { useEffect, useRef, useState } from "react";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { useMutation } from "convex/react";

import { RecipeChatDeleteDialog } from "@/components/recipes/chat/recipe-chat-delete-dialog";
import { RecipeChatConversationList } from "@/components/recipes/chat/recipe-chat-conversation-list";
import { RecipeChatMessage } from "@/components/recipes/chat/recipe-chat-message";
import {
  useRecipeChatConversations,
  useRecipeChatThread,
} from "@/components/recipes/chat/use-recipe-chat";
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
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const SUGGESTED_QUESTIONS = [
  "Par quoi remplacer un ingrédient ?",
  "Est-ce que ça se congèle ?",
  "Quels accompagnements me suggères-tu ?",
  "Comment adapter pour 2 personnes ?",
  "Quels ustensiles me faut-il ?",
] as const;

type ChatView = "list" | "thread";

type ActiveConversation = Id<"recipeChatConversations"> | "new" | null;

type ConversationListItem = {
  _id: Id<"recipeChatConversations">;
  title: string;
  updatedAt: number;
};

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
  const [view, setView] = useState<ChatView>("list");
  const [activeConversationId, setActiveConversationId] =
    useState<ActiveConversation>(null);

  const { conversations, isLoading: isLoadingConversations } =
    useRecipeChatConversations(recipeId);

  const threadConversationId =
    view === "thread" ? activeConversationId : null;

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    error,
    setError,
    sendMessage,
  } = useRecipeChatThread(recipeId, threadConversationId);
  const deleteConversation = useMutation(api.recipeChat.deleteConversation);

  const [draft, setDraft] = useState("");
  const [deletingConversationId, setDeletingConversationId] =
    useState<Id<"recipeChatConversations"> | null>(null);
  const [conversationToDelete, setConversationToDelete] =
    useState<ConversationListItem | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setView("list");
      setActiveConversationId(null);
      setDraft("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || isLoadingConversations || conversations === undefined) {
      return;
    }
    if (conversations.length === 0) {
      setView("thread");
      setActiveConversationId("new");
    }
  }, [open, isLoadingConversations, conversations]);

  useEffect(() => {
    if (!open || view !== "thread") {
      return;
    }
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, view, messages, isSending]);

  function openConversationList() {
    setView("list");
    setActiveConversationId(null);
    setDraft("");
  }

  function startNewConversation() {
    setView("thread");
    setActiveConversationId("new");
    setDraft("");
  }

  function openExistingConversation(conversationId: Id<"recipeChatConversations">) {
    setView("thread");
    setActiveConversationId(conversationId);
    setDraft("");
  }

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (trimmed.length === 0 || isSending) {
      return;
    }

    setDraft("");
    try {
      const conversationId = await sendMessage(trimmed);
      if (activeConversationId === "new") {
        setActiveConversationId(conversationId);
      }
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

  async function handleDeleteConversation(
    conversationId: Id<"recipeChatConversations">,
  ) {
    if (deletingConversationId !== null) {
      return;
    }
    setError(null);
    setDeletingConversationId(conversationId);
    try {
      await deleteConversation({ conversationId });
      if (activeConversationId === conversationId) {
        openConversationList();
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "La suppression de la question a échoué.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  function requestDeleteConversation(
    conversationId: Id<"recipeChatConversations">,
  ) {
    if (!Array.isArray(conversations)) {
      return;
    }
    const targetConversation =
      conversations.find((conversation) => conversation._id === conversationId) ??
      null;
    setConversationToDelete(targetConversation);
  }

  const activeTitle =
    activeConversationId !== null &&
    activeConversationId !== "new" &&
    conversations !== undefined
      ? (conversations as ConversationListItem[]).find(
          (c) => c._id === activeConversationId,
        )?.title
      : undefined;

  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const showEmptyThread =
    view === "thread" &&
    !isLoadingMessages &&
    !hasMessages &&
    !isSending &&
    activeConversationId === "new";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <RecipeChatDeleteDialog
        open={conversationToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setConversationToDelete(null);
          }
        }}
        conversationTitle={conversationToDelete?.title ?? "cette question"}
        isDeleting={
          conversationToDelete !== null &&
          deletingConversationId === conversationToDelete._id
        }
        onConfirm={() => {
          if (conversationToDelete === null) {
            return;
          }
          void handleDeleteConversation(conversationToDelete._id).finally(() => {
            setConversationToDelete(null);
          });
        }}
      />
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b pr-12">
          <div className="flex items-center gap-2">
            {view === "thread" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="-ml-2"
                onClick={openConversationList}
                aria-label="Retour aux questions"
              >
                <ArrowLeft />
              </Button>
            ) : null}
            <div className="min-w-0 flex-1">
              <SheetTitle>
                {view === "list"
                  ? "Questions"
                  : activeConversationId === "new"
                    ? "Nouvelle question"
                    : (activeTitle ?? "Question")}
              </SheetTitle>
              <SheetDescription className="line-clamp-2">
                {recipeName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {view === "list" ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {error ? <RecipeErrorAlert message={error} /> : null}
              <RecipeChatConversationList
                conversations={conversations}
                isLoading={isLoadingConversations}
                deletingConversationId={deletingConversationId}
                onSelect={openExistingConversation}
                onDelete={requestDeleteConversation}
                onNewConversation={startNewConversation}
              />
            </div>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                {error ? <RecipeErrorAlert message={error} /> : null}

                {isLoadingMessages ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 w-4/5" />
                    <Skeleton className="ml-auto h-12 w-3/5" />
                  </div>
                ) : null}

                {showEmptyThread ? (
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

                {!isLoadingMessages && hasMessages
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

              <div className="shrink-0 border-t p-4">
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
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
