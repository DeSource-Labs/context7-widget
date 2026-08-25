<script lang="ts">
  import Context7Widget from '../src/Context7Widget.svelte';
  import type { Context7Position, Context7Theme, Context7WidgetHandle, Context7WidgetPreset } from '../src/index.js';

  type TriggerMode = 'managed' | 'external' | 'built-in';

  let theme = $state<Context7Theme>('auto');
  let preset = $state<Context7WidgetPreset>('glass');
  let position = $state<Context7Position>('anchor');
  let triggerMode = $state<TriggerMode>('managed');
  let panelWidth = $state('420px');
  let panelHeight = $state('460px');
  let color = $state('');
  let backdrop = $state(false);
  let closeOnOutsideClick = $state(true);
  let widget = $state<Context7WidgetHandle>();
  let stats = $state({
    answerComplete: 0,
    cancel: 0,
    close: 0,
    error: 0,
    firstToken: 0,
    open: 0,
    question: 0,
    toolCall: 0,
    toolResult: 0
  });
  const customTrigger = $derived(
    triggerMode === 'managed' ? true : triggerMode === 'external' ? 'demo-external-trigger' : undefined
  );
</script>

<main data-testid="context7-demo" class="demo-shell">
  <section class="demo-controls" aria-label="Widget demo controls">
    <label
      >Theme<select bind:value={theme} data-testid="theme"
        ><option>auto</option><option>light</option><option>dark</option></select
      ></label
    >
    <label
      >Preset<select bind:value={preset} data-testid="preset"
        ><option>default</option><option>minimal</option><option>glass</option><option>neo</option><option
          >terminal</option
        ><option>brutalist</option></select
      ></label
    >
    <label
      >Position<select bind:value={position} data-testid="position"
        ><option>bottom-right</option><option>bottom-left</option><option>top-right</option><option>top-left</option
        ><option>center</option><option>anchor</option></select
      ></label
    >
    <label
      >Trigger<select bind:value={triggerMode} data-testid="trigger-mode"
        ><option>managed</option><option>external</option><option>built-in</option></select
      ></label
    >
    <label>Panel width<input bind:value={panelWidth} data-testid="panel-width" type="text" /></label>
    <label>Panel height<input bind:value={panelHeight} data-testid="panel-height" type="text" /></label>
    <label>Accent<input bind:value={color} data-testid="accent" type="text" /></label>
    <label class="checkbox-control"
      ><input bind:checked={backdrop} data-testid="backdrop" type="checkbox" />Backdrop</label
    >
    <label class="checkbox-control"
      ><input bind:checked={closeOnOutsideClick} data-testid="close-outside" type="checkbox" />Close outside</label
    >
  </section>

  <section class="demo-stage">
    {#if triggerMode === 'external'}
      <button id="demo-external-trigger" data-testid="external-trigger" type="button">External docs trigger</button>
    {/if}
    <button
      data-testid="programmatic-send"
      type="button"
      onclick={() => widget?.send('Show me Context7 Widget setup.')}
    >
      Programmatic send
    </button>
    <div data-testid="event-log" class="event-log">
      open:{stats.open} close:{stats.close} cancel:{stats.cancel} question:{stats.question}
      firstToken:{stats.firstToken} answerComplete:{stats.answerComplete} toolCall:{stats.toolCall}
      toolResult:{stats.toolResult} error:{stats.error}
    </div>

    <Context7Widget
      bind:this={widget}
      {backdrop}
      {closeOnOutsideClick}
      color={color || undefined}
      {customTrigger}
      initialMessage={'Hello from the Svelte demo for **{library}**.'}
      launcherLabel="Ask docs"
      launcherVariant="pill"
      library="/desource-labs/context7-widget"
      {panelHeight}
      {panelWidth}
      placeholder="Ask docs..."
      {position}
      {preset}
      {theme}
      title="Demo Docs"
      widgetId="demo-widget"
      onAnswerComplete={() => stats.answerComplete++}
      onCancel={() => stats.cancel++}
      onClose={() => stats.close++}
      onError={() => stats.error++}
      onFirstToken={() => stats.firstToken++}
      onOpen={() => stats.open++}
      onQuestion={() => stats.question++}
      onToolCall={() => stats.toolCall++}
      onToolResult={() => stats.toolResult++}
    />
  </section>
</main>

<style>
  .demo-shell {
    color: #f8fafc;
    display: grid;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    gap: 1rem;
    grid-template-columns: 18rem minmax(0, 1fr);
    min-height: 100vh;
    padding: 1rem;
  }
  .demo-controls,
  .demo-stage {
    background: #101513;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    min-width: 0;
    padding: 1rem;
  }
  .demo-controls {
    align-content: start;
    display: grid;
    gap: 0.8rem;
  }
  label {
    color: rgba(248, 250, 252, 0.72);
    display: grid;
    gap: 0.35rem;
    font-size: 0.85rem;
  }
  .checkbox-control {
    align-items: center;
    grid-template-columns: auto minmax(0, 1fr);
  }
  input,
  select,
  button {
    font: inherit;
  }
  input[type='text'],
  select {
    background: #070b09;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 7px;
    color: #f8fafc;
    min-height: 2.4rem;
    padding: 0 0.7rem;
    width: 100%;
  }
  button {
    background: #7cffb2;
    border: 0;
    border-radius: 8px;
    color: #07120c;
    cursor: pointer;
    font-weight: 800;
    min-height: 2.55rem;
    padding: 0 0.9rem;
  }
  .demo-stage {
    display: grid;
    gap: 1rem;
    place-content: start;
  }
  .event-log {
    background: #070b09;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    color: rgba(248, 250, 252, 0.78);
    font-family: monospace;
    line-height: 1.5;
    padding: 0.85rem;
    word-break: break-word;
  }
  @media (max-width: 720px) {
    .demo-shell {
      grid-template-columns: minmax(0, 1fr);
      padding: 0.75rem;
    }
  }
</style>
