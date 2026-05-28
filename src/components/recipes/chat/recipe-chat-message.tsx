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
          "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {content}
      </div>
    </div>
  );
}
