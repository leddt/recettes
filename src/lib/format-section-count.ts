export function formatSectionCount(checked: number, total: number) {
  return checked > 0 ? `${checked} / ${total}` : String(total);
}
