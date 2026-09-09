import { copyText } from '@desource/context7-widget/kit';

export function useCopy() {
  const copiedKey = ref<string | null>(null);
  let disposed = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const copy = async (value: string, key: string) => {
    if (!(await copyText(value)) || disposed) return;
    copiedKey.value = key;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      copiedKey.value = null;
    }, 1400);
  };

  onBeforeUnmount(() => {
    disposed = true;
    if (timeout) clearTimeout(timeout);
  });

  return { copiedKey: readonly(copiedKey), copy };
}
