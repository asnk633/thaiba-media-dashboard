// minimal helpers used by UI components
export function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

export function formatDateISO(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(); // simple readable date
  } catch {
    return iso;
  }
}
