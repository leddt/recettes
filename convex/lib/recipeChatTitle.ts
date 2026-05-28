const MAX_TITLE_LENGTH = 80;

export function conversationTitleFromMessage(content: string): string {
  const oneLine = content.trim().replace(/\s+/g, " ");
  if (oneLine.length === 0) {
    return "Nouvelle question";
  }
  if (oneLine.length <= MAX_TITLE_LENGTH) {
    return oneLine;
  }
  return `${oneLine.slice(0, MAX_TITLE_LENGTH - 3)}...`;
}
