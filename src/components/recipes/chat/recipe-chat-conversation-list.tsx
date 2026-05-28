import { MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
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
  onSelect: (conversationId: Id<"recipeChatConversations">) => void;
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
  onSelect,
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
              render={
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelect(conversation._id)}
                />
              }
            >
              <ItemContent>
                <ItemTitle className="line-clamp-2">{conversation.title}</ItemTitle>
                <ItemDescription>
                  {formatConversationDate(conversation.updatedAt)}
                </ItemDescription>
              </ItemContent>
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
