<script lang="ts">
  import Context7Widget from '@src/Context7Widget.svelte';
  import type { Context7WidgetProps } from '@src/types';

  let {
    rootProps,
    onChildKey
  }: { rootProps?: Context7WidgetProps['rootProps']; onChildKey?: (event: KeyboardEvent) => void } = $props();

  let open = $state(true);

  export function setOpen(value: boolean): void {
    open = value;
  }
</script>

<section data-testid="native-parent">
  <Context7Widget bind:open customTrigger library="/owner/repo" {rootProps}>
    {#snippet trigger({ label, triggerId })}
      <span data-testid="custom-trigger" data-trigger-id={triggerId}>{label}</span>
    {/snippet}

    <button
      type="button"
      data-testid="child-content"
      onkeydown={onChildKey}
      onkeyup={onChildKey}
      onkeypress={onChildKey}>Child content</button
    >
  </Context7Widget>
</section>
