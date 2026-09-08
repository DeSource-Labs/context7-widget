export async function copyText(value: string): Promise<boolean> {
  const trimmedText = value.trim();
  if (!trimmedText) return false;

  try {
    await navigator.clipboard.writeText(trimmedText);
    return true;
  } catch {
    return false;
  }
}
