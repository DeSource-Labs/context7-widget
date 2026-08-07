<template>
  <section id="lab" class="lab-section">
    <div class="section-heading">
      <p class="eyebrow">Live configuration</p>
      <h2>Tune the widget contract before you paste it.</h2>
      <p>
        Change the runtime props, inspect the script tag, then open the same widget instance from the custom trigger.
      </p>
    </div>

    <div class="lab">
      <form class="lab-controls" @submit.prevent>
        <label>
          <span>Library</span>
          <input v-model="library" type="text" autocomplete="off" />
        </label>

        <label>
          <span>Placeholder</span>
          <input v-model="placeholder" type="text" autocomplete="off" />
        </label>

        <div class="control-group">
          <span>Theme</span>
          <div class="segmented">
            <button
              v-for="item in themes"
              :key="item"
              type="button"
              :aria-pressed="theme === item"
              @click="theme = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <label>
          <span>Position</span>
          <select v-model="position">
            <option v-for="item in positions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label>
          <span>Preset</span>
          <select v-model="preset">
            <option v-for="item in presets" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label>
          <span>Launcher</span>
          <select v-model="launcherVariant" :disabled="customTriggerEnabled">
            <option v-for="item in launcherVariants" :key="item" :value="item">{{ item }}</option>
          </select>
          <small v-if="customTriggerEnabled" class="field-note">
            Disabled while custom trigger is active. Disable custom trigger to preview the built-in launcher.
          </small>
        </label>

        <div class="control-group">
          <span>Accent</span>
          <div class="swatches">
            <button
              class="swatch-preset"
              type="button"
              aria-label="Use preset color"
              :aria-pressed="color === ''"
              @click="color = ''"
            >
              preset
            </button>
            <button
              v-for="item in colors"
              :key="item"
              type="button"
              :aria-label="`Use ${item}`"
              :aria-pressed="color === item"
              :style="{ '--swatch': item }"
              @click="color = item"
            />
          </div>
        </div>

        <label class="toggle">
          <input v-model="customTriggerEnabled" type="checkbox" />
          <span>Use custom trigger</span>
        </label>

        <label class="toggle">
          <input v-model="backdrop" type="checkbox" />
          <span>Use backdrop</span>
        </label>

        <label class="toggle">
          <input v-model="closeOnOutsideClick" type="checkbox" />
          <span>Close outside</span>
        </label>

        <Context7Widget
          :backdrop="backdrop"
          :close-on-outside-click="closeOnOutsideClick"
          :color="color || undefined"
          :custom-trigger="customTriggerEnabled ? '#context7-lab-trigger' : undefined"
          launcher-label="Ask docs"
          :launcher-variant="launcherVariant"
          :library="library"
          panel-height="460px"
          panel-width="440px"
          :placeholder="placeholder"
          :position="position"
          :preset="preset"
          :theme="theme"
          title="Context7 Widget Docs"
          widget-id="site-lab"
          @question="events.question += 1"
          @cancel="events.cancel += 1"
          @answer-complete="events.answer += 1"
        >
          <button id="context7-lab-trigger" class="lab-trigger" type="button" :disabled="!customTriggerEnabled">
            <MessageSquare :size="18" aria-hidden="true" />
            Ask docs
          </button>
        </Context7Widget>
      </form>

      <div class="lab-output">
        <CodeBlock id="lab-script" label="/widget.js" :code="scriptCode" />
        <CodeBlock id="lab-vue" label="Vue component" :code="vueCode" />
      </div>
    </div>

    <div class="event-strip" aria-live="polite">
      <span>Questions {{ events.question }}</span>
      <span>Cancelled {{ events.cancel }}</span>
      <span>Completed answers {{ events.answer }}</span>
      <span>Widget id site-lab</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquare } from '@lucide/vue';
import {
  Context7Widget,
  type Context7LauncherVariant,
  type Context7Position,
  type Context7Theme,
  type Context7WidgetPreset
} from '@desource/context7-widget-vue';
import { buildContext7WidgetScriptTag } from '@desource/context7-widget';

const themes: Context7Theme[] = ['auto', 'light', 'dark'];
const positions: Context7Position[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center', 'anchor'];
const presets: Context7WidgetPreset[] = ['default', 'minimal', 'glass', 'neo', 'terminal', 'brutalist'];
const launcherVariants: Context7LauncherVariant[] = ['icon', 'pill', 'badge'];
const colors = ['#10b981', '#f97316', '#3b82f6', '#f43f5e'];

const library = ref('/desource-labs/context7-widget');
const placeholder = ref('Ask integration questions...');
const theme = ref<Context7Theme>('auto');
const position = ref<Context7Position>('anchor');
const preset = ref<Context7WidgetPreset>('glass');
const launcherVariant = ref<Context7LauncherVariant>('pill');
const color = ref('');
const customTriggerEnabled = ref(true);
const backdrop = ref(false);
const closeOnOutsideClick = ref(true);
const events = reactive({ answer: 0, cancel: 0, question: 0 });

const scriptCode = computed(() =>
  buildContext7WidgetScriptTag({
    backdrop: backdrop.value,
    closeOnOutsideClick: closeOnOutsideClick.value,
    color: color.value || undefined,
    customTrigger: customTriggerEnabled.value ? '#context7-lab-trigger' : undefined,
    launcherLabel: 'Ask docs',
    launcherVariant: launcherVariant.value,
    library: library.value,
    panelHeight: '460px',
    panelWidth: '440px',
    placeholder: placeholder.value,
    position: position.value,
    preset: preset.value,
    theme: theme.value
  })
);

const vueCode = computed(() => {
  const colorLine = color.value ? `  color="${color.value}"\n` : '';
  const colorComment = color.value ? '' : '  <!-- color omitted: preset owns the action color -->\n';
  const customTriggerLines = customTriggerEnabled.value ? '  custom-trigger="#context7-lab-trigger"\n' : '';

  return `<Context7Widget
  library="${library.value}"
${colorLine}${colorComment}  theme="${theme.value}"
  position="${position.value}"
  preset="${preset.value}"
  launcher-variant="${launcherVariant.value}"
  :backdrop="${backdrop.value}"
  :close-on-outside-click="${closeOnOutsideClick.value}"
  panel-height="460px"
${customTriggerLines}  launcher-label="Ask docs"
  placeholder="${placeholder.value}"
  @question="trackQuestion"
/>`;
});
</script>
