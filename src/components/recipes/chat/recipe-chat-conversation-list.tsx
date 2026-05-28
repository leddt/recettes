import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ItemActions,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "../../../../convex/_generated/dataModel";

type Conversation = {
  _id: Id<"recipeChatConversations">;
  title: string;
  updatedAt: number;
};

type RecipeChatConversationListProps = {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  deletingConversationId: Id<"recipeChatConversations"> | null;
  onSelect: (conversationId: Id<"recipeChatConversations">) => void;
  onDelete: (conversationId: Id<"recipeChatConversations">) => void;
  onNewConversation: () => void;
};

function formatConversationDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function RecipeChatConversationList({
  conversations,
  isLoading,
  deletingConversationId,
  onSelect,
  onDelete,
  onNewConversation,
}: RecipeChatConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const hasConversations = conversations !== undefined && conversations.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" onClick={onNewConversation}>
        <MessageSquarePlus data-icon="inline-start" />
        Nouvelle question
      </Button>

      {hasConversations ? (
        <ItemGroup>
          {conversations.map((conversation) => (
            <Item
              key={conversation._id}
              variant="outline"
              size="sm"
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onSelect(conversation._id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(conversation._id);
                }
              }}
            >
              <ItemContent>
                <ItemTitle className="line-clamp-2">{conversation.title}</ItemTitle>
                <ItemDescription>
                  {formatConversationDate(conversation.updatedAt)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={deletingConversationId === conversation._id}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation._id);
                  }}
                  aria-label={`Supprimer la question "${conversation.title}"`}
                >
                  <Trash2 />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune question pour l&apos;instant. Posez-en une nouvelle sur cette
          recette.
        </p>
      )}
    </div>
  );
}
