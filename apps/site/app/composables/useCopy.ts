export function useCopy() {
  const copiedKey = ref<string | null>(null);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const copy = async (value: string, key: string) => {
    if (!navigator?.clipboard) return;

    await navigator.clipboard.writeText(value);
    copiedKey.value = key;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      copiedKey.value = null;
    }, 1400);
  };

  onBeforeUnmount(() => {
    if (timeout) clearTimeout(timeout);
  });

  return { copiedKey: readonly(copiedKey), copy };
}
