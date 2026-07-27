<template>
  <main data-testid="context7-demo" class="demo-shell">
    <section class="demo-controls" aria-label="Widget demo controls">
      <label>
        Theme
        <select v-model="theme" data-testid="theme">
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>

      <label>
        Preset
        <select v-model="preset" data-testid="preset">
          <option value="default">default</option>
          <option value="minimal">minimal</option>
          <option value="glass">glass</option>
          <option value="neo">neo</option>
          <option value="terminal">terminal</option>
          <option value="brutalist">brutalist</option>
        </select>
      </label>

      <label>
        Position
        <select v-model="position" data-testid="position">
          <option value="bottom-right">bottom-right</option>
          <option value="bottom-left">bottom-left</option>
          <option value="top-right">top-right</option>
          <option value="top-left">top-left</option>
          <option value="center">center</option>
          <option value="anchor">anchor</option>
        </select>
      </label>

      <label>
        Trigger
        <select v-model="triggerMode" data-testid="trigger-mode">
          <option value="managed">managed</option>
          <option value="external">external</option>
          <option value="built-in">built-in</option>
        </select>
      </label>

      <label>
        Panel width
        <input v-model="panelWidth" data-testid="panel-width" type="text" />
      </label>

      <label>
        Panel height
        <input v-model="panelHeight" data-testid="panel-height" type="text" />
      </label>

      <label>
        Accent
        <input v-model="color" data-testid="accent" type="text" />
      </label>

      <label>
        <input v-model="backdrop" data-testid="backdrop" type="checkbox" />
        Backdrop
      </label>

      <label>
        <input v-model="closeOnOutsideClick" data-testid="close-outside" type="checkbox" />
        Close outside
      </label>
    </section>

    <section class="demo-stage">
      <button v-if="triggerMode === 'external'" id="demo-external-trigger" data-testid="external-trigger" type="button">
        External docs trigger
      </button>

      <button data-testid="programmatic-send" type="button" @click="sendPrompt">Programmatic send</button>

      <div data-testid="event-log" class="event-log">
        open:{{ stats.open }} close:{{ stats.close }} question:{{ stats.question }} firstToken:{{
          stats.firstToken
        }}
        answerComplete:{{ stats.answerComplete }} toolCall:{{ stats.toolCall }} toolResult:{{
          stats.toolResult
        }}
        error:{{ stats.error }}
      </div>

      <Context7Widget
        ref="widget"
        :backdrop="backdrop"
        :close-on-outside-click="closeOnOutsideClick"
        :color="color || undefined"
        :custom-trigger="customTrigger"
        initial-message="Hello from the Vue demo for **{library}**."
        launcher-label="Ask docs"
        launcher-variant="pill"
        library="/desource-labs/context7-widget"
        :panel-height="panelHeight"
        :panel-width="panelWidth"
        placeholder="Ask docs..."
        :position="position"
        :preset="preset"
        :theme="theme"
        title="Demo Docs"
        widget-id="demo-widget"
        @answer-complete="stats.answerComplete++"
        @close="stats.close++"
        @error="stats.error++"
        @first-token="stats.firstToken++"
        @open="stats.open++"
        @question="stats.question++"
        @tool-call="stats.toolCall++"
        @tool-result="stats.toolResult++"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Context7Widget,
  type Context7Position,
  type Context7Theme,
  type Context7WidgetExpose,
  type Context7WidgetPreset
} from '../src';

type TriggerMode = 'managed' | 'external' | 'built-in';

const theme = ref<Context7Theme>('auto');
const preset = ref<Context7WidgetPreset>('glass');
const position = ref<Context7Position>('anchor');
const triggerMode = ref<TriggerMode>('managed');
const panelWidth = ref('420px');
const panelHeight = ref('460px');
const color = ref('');
const backdrop = ref(false);
const closeOnOutsideClick = ref(true);
const widget = ref<Context7WidgetExpose | null>(null);
const stats = reactive({
  answerComplete: 0,
  close: 0,
  error: 0,
  firstToken: 0,
  open: 0,
  question: 0,
  toolCall: 0,
  toolResult: 0
});

const customTrigger = computed(() => {
  if (triggerMode.value === 'managed') return true;
  if (triggerMode.value === 'external') return 'demo-external-trigger';
  return undefined;
});

async function sendPrompt() {
  await widget.value?.send('Show me Context7 Widget setup.');
}
</script>

<style scoped>
.demo-shell {
  color: #f8fafc;
  display: grid;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
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
  font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace;
  line-height: 1.5;
  padding: 0.85rem;
}
</style>
