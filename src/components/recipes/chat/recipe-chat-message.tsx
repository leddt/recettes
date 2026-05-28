import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";

type RecipeChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

export function RecipeChatMessage({ role, content }: RecipeChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground whitespace-pre-wrap"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? content : <MarkdownContent content={content} />}
      </div>
    </div>
  );
}
