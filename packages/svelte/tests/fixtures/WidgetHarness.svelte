<script lang="ts">
  import Context7Widget from '@src/Context7Widget.svelte';

  let open = $state(true);

  export function setOpen(value: boolean): void {
    open = value;
  }
</script>

<Context7Widget bind:open customTrigger library="/owner/repo">
  {#snippet trigger({ label, triggerId })}
    <span data-testid="custom-trigger" data-trigger-id={triggerId}>{label}</span>
  {/snippet}

  <span data-testid="child-content">Child content</span>
</Context7Widget>
