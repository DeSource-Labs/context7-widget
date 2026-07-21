<template>
  <main class="examples-page">
    <section class="examples-hero examples-hero--with-scan">
      <GridScan
        class="examples-hero__background"
        lines-color="#315f68"
        scan-color="#7ab8ff"
        line-style="solid"
        scan-direction="pingpong"
        :bloom-intensity="0.36"
        :bloom-smoothing="0.34"
        :bloom-threshold="0.05"
        :chromatic-aberration="0.0016"
        :grid-scale="0.085"
        :line-jitter="0.04"
        :line-thickness="1.15"
        :noise-intensity="0.012"
        :scan-delay="0.7"
        :scan-duration="3.1"
        :scan-glow="0.92"
        :scan-on-click="true"
        :scan-opacity="0.78"
        :scan-phase-taper="0.35"
        :scan-softness="1.5"
        :sensitivity="0.42"
      />
      <SiteHeader
        :items="[
          { href: '/', label: 'Home' },
          { href: '#live', label: 'Constructor' },
          { href: '#positions', label: 'Positions' },
          { href: '/customization', label: 'Customize' }
        ]"
      />

      <div class="examples-hero__content">
        <p class="eyebrow">Examples</p>
        <h1>Try the widget before you install it.</h1>
        <p>
          Test trigger modes, positions, presets, and generated snippets. Pick the version that fits your app today.
        </p>
        <div class="hero__actions">
          <a class="button button--primary" href="#live">Try constructor</a>
          <a class="button button--ghost" href="#positions">See positions</a>
        </div>
        <LogoBallpit compact class="examples-hero__frameworks" />
      </div>

      <HeroWidgetDialog
        class="examples-hero__dialog"
        placeholder="Ask integration questions..."
        title="Context7 Widget Docs"
        tone="blue"
        :messages="[
          { kind: 'assistant', text: 'Test position, preset, trigger mode, and panel size before touching your app.' },
          { kind: 'user', text: 'Show the Vue setup.' },
          {
            kind: 'assistant',
            text: 'Copy a component, composable, core helper, or hosted script from the same constructor.'
          }
        ]"
      />
    </section>

    <section id="live" class="examples-section examples-section--constructor">
      <div class="section-heading">
        <p class="eyebrow">Live constructor</p>
        <h2>Make decisions visually, then copy the integration.</h2>
        <p>
          The constructor renders a real widget instance. Try copy, position, preset, trigger mode, panel size, and
          behavior first; then copy the script, Vue, or core TypeScript version.
        </p>
      </div>

      <div class="constructor-shell">
        <div class="constructor-controls" aria-label="Context7 widget constructor controls">
          <div class="constructor-group constructor-group--full">
            <span>Identity</span>
            <label class="constructor-field" for="constructor-library">
              Library
              <input id="constructor-library" v-model="constructorLibrary" spellcheck="false" type="text" />
            </label>
            <label class="constructor-field" for="constructor-title">
              Title
              <input id="constructor-title" v-model="constructorTitle" type="text" />
            </label>
            <label class="constructor-field" for="constructor-widget-id">
              Widget id
              <input id="constructor-widget-id" v-model="constructorWidgetId" spellcheck="false" type="text" />
            </label>
          </div>

          <div class="constructor-group constructor-group--full">
            <span>Copy</span>
            <label class="constructor-field" for="constructor-placeholder">
              Placeholder
              <input id="constructor-placeholder" v-model="constructorPlaceholder" type="text" />
            </label>
            <label class="constructor-field constructor-field--wide" for="constructor-message">
              Initial message
              <textarea id="constructor-message" v-model="constructorInitialMessage" rows="3" />
            </label>
          </div>

          <div class="constructor-group">
            <span>Theme</span>
            <div class="constructor-segmented" role="group" aria-label="Theme">
              <button
                v-for="themeOption in themeOptions"
                :key="themeOption"
                :aria-pressed="constructorTheme === themeOption"
                type="button"
                @click="constructorTheme = themeOption"
              >
                {{ themeOption }}
              </button>
            </div>
          </div>

          <div class="constructor-group">
            <span>Preset</span>
            <select v-model="constructorPreset" aria-label="Preset">
              <option v-for="presetOption in presetOptions" :key="presetOption" :value="presetOption">
                {{ presetOption }}
              </option>
            </select>
          </div>

          <div class="constructor-group">
            <span>Position</span>
            <select v-model="constructorPosition" aria-label="Position">
              <option v-for="positionOption in positionOptions" :key="positionOption" :value="positionOption">
                {{ positionOption }}
              </option>
            </select>
          </div>

          <div class="constructor-group">
            <span>Launcher</span>
            <select
              v-model="constructorLauncherVariant"
              aria-label="Launcher variant"
              :disabled="constructorTriggerMode !== 'none'"
            >
              <option v-for="launcherOption in launcherOptions" :key="launcherOption" :value="launcherOption">
                {{ launcherOption }}
              </option>
            </select>
            <p v-if="constructorTriggerMode !== 'none'" class="field-note">
              Launcher variant is ignored while a custom trigger replaces the built-in button.
            </p>
            <label class="constructor-field" for="constructor-launcher-label">
              Label
              <input id="constructor-launcher-label" v-model="constructorLauncherLabel" type="text" />
            </label>
          </div>

          <div class="constructor-group constructor-group--full">
            <span>Trigger mode</span>
            <div class="constructor-trigger-modes">
              <button
                v-for="mode in triggerModes"
                :key="mode.value"
                :aria-pressed="constructorTriggerMode === mode.value"
                type="button"
                @click="constructorTriggerMode = mode.value"
              >
                <strong>{{ mode.label }}</strong>
                <small>{{ mode.copy }}</small>
              </button>
            </div>
          </div>

          <div class="constructor-group constructor-group--full">
            <span>Accent</span>
            <div class="constructor-swatches" role="group" aria-label="Accent color">
              <button
                v-for="accentOption in accentOptions"
                :key="accentOption.label"
                :aria-label="accentOption.label"
                :aria-pressed="constructorColor === accentOption.value"
                :class="{ 'constructor-swatch--preset': !accentOption.value }"
                :style="accentOption.swatch ? `--swatch: ${accentOption.swatch}` : undefined"
                type="button"
                @click="constructorColor = accentOption.value"
              >
                <span v-if="!accentOption.value">preset</span>
              </button>
            </div>
          </div>

          <div class="constructor-group constructor-group--full">
            <span>Panel size</span>
            <div class="constructor-size-grid">
              <label class="constructor-field" for="constructor-width">
                Width
                <input id="constructor-width" v-model="constructorPanelWidth" spellcheck="false" type="text" />
              </label>
              <label class="constructor-field" for="constructor-height">
                Height
                <input id="constructor-height" v-model="constructorPanelHeight" spellcheck="false" type="text" />
              </label>
            </div>
          </div>

          <div class="constructor-group constructor-group--full">
            <span>Behavior</span>
            <div class="constructor-toggles">
              <label class="constructor-toggle">
                <input v-model="constructorBackdrop" type="checkbox" />
                Backdrop
              </label>
              <label class="constructor-toggle">
                <input v-model="constructorCloseOnOutsideClick" type="checkbox" />
                Close outside
              </label>
              <label class="constructor-toggle">
                <input v-model="constructorDefaultOpen" type="checkbox" />
                Default open
              </label>
              <label class="constructor-toggle">
                <input v-model="constructorShowPoweredBy" type="checkbox" />
                Powered by
              </label>
            </div>
          </div>
        </div>

        <div class="constructor-preview">
          <div class="constructor-preview__header">
            <div>
              <span>Live preview</span>
              <strong>{{ constructorPreset }} · {{ constructorPosition }}</strong>
            </div>
            <button class="constructor-mini-button" type="button" @click="sendConstructorPrompt">
              <Send :size="15" aria-hidden="true" />
              Ask install
            </button>
          </div>

          <div class="constructor-stage">
            <div class="constructor-device" :data-preset="constructorPreset" :data-theme="constructorTheme">
              <div class="constructor-device__bar">
                <span />
                <span />
                <span />
                <strong>docs.example.dev</strong>
              </div>

              <div class="constructor-device__body">
                <div class="constructor-doc">
                  <p class="eyebrow">Widget surface</p>
                  <h3>{{ constructorTitle }}</h3>
                  <p>{{ constructorPlaceholder }}</p>
                </div>

                <button
                  v-if="constructorTriggerMode === 'external'"
                  id="examples-constructor-trigger"
                  class="constructor-external-trigger"
                  type="button"
                >
                  <MessageSquare :size="18" aria-hidden="true" />
                  {{ constructorLauncherLabel }}
                </button>

                <div class="constructor-highlight-grid">
                  <span v-for="item in constructorHighlights" :key="item.label">
                    <small>{{ item.label }}</small>
                    {{ item.value }}
                  </span>
                </div>

                <div class="constructor-widget">
                  <Context7Widget
                    ref="constructorWidget"
                    :key="constructorWidgetKey"
                    :backdrop="constructorBackdrop"
                    :close-on-outside-click="constructorCloseOnOutsideClick"
                    :color="constructorColor || undefined"
                    :custom-trigger="constructorCustomTrigger"
                    :default-open="constructorDefaultOpen"
                    :initial-message="constructorInitialMessage"
                    :launcher-label="constructorLauncherLabel"
                    :launcher-variant="constructorLauncherVariant"
                    :library="constructorLibrary"
                    :panel-height="constructorPanelHeight"
                    :panel-width="constructorPanelWidth"
                    :placeholder="constructorPlaceholder"
                    :position="constructorPosition"
                    :preset="constructorPreset"
                    :show-powered-by="constructorShowPoweredBy"
                    :theme="constructorTheme"
                    :title="constructorTitle"
                    :widget-id="constructorWidgetId"
                    @answer-complete="onConstructorAnswerComplete"
                    @close="constructorStats.closes++"
                    @error="onConstructorError"
                    @open="constructorStats.opens++"
                    @question="onConstructorQuestion"
                  >
                    <template v-if="constructorUsesTriggerSlot" #trigger="{ label }">
                      <span class="constructor-trigger-dot" />
                      <span>{{ label }}</span>
                      <Wand2 :size="16" aria-hidden="true" />
                    </template>
                  </Context7Widget>
                </div>
              </div>
            </div>
          </div>

          <div class="constructor-stats" aria-label="Live event counters">
            <span>opens {{ constructorStats.opens }}</span>
            <span>closes {{ constructorStats.closes }}</span>
            <span>questions {{ constructorStats.questions }}</span>
            <span>answers {{ constructorStats.answers }}</span>
            <span>errors {{ constructorStats.errors }}</span>
          </div>
        </div>

        <div class="constructor-code">
          <CodeBlock id="constructor-vue-code" label="Vue component" :code="constructorVueCode" />
          <CodeBlock id="constructor-script-code" label="/widget.js" :code="constructorScriptCode" />
          <CodeBlock id="constructor-core-code" label="Core package" :code="constructorCoreCode" />
        </div>
      </div>
    </section>

    <section id="positions" class="examples-section examples-section--positions">
      <div class="section-heading">
        <p class="eyebrow">Position use cases</p>
        <h2>Corner, centered, and anchored entry points.</h2>
        <p>
          Fixed corner works for classic docs pages. Centered dialog works when users ask for help intentionally.
          Anchored popovers work when the assistant belongs to your navigation, dashboard, command palette, or support
          menu.
        </p>
      </div>

      <div class="example-grid">
        <article class="example-card example-card--center">
          <div class="example-card__visual">
            <button id="example-center-trigger" class="example-trigger example-trigger--terminal" type="button">
              <Search :size="18" aria-hidden="true" />
              Open centered help
            </button>
            <div class="example-center-preview">
              <span />
              <strong>Terminal preset</strong>
              <p>Centered dialog with backdrop and outside-click close.</p>
            </div>
          </div>
          <CodeBlock id="example-center-code" label="Centered script" :code="centerScript" />
        </article>

        <article class="example-card example-card--anchor">
          <div class="example-card__visual">
            <div class="example-toolbar">
              <span>Docs shell</span>
              <button id="example-anchor-trigger" class="example-trigger" type="button">
                <MessageSquare :size="18" aria-hidden="true" />
                Ask docs
              </button>
            </div>
            <div class="example-popover-preview">
              <span>Anchored to the trigger</span>
              <p>Best for nav bars, command menus, dashboards, and custom design systems.</p>
            </div>
          </div>
          <CodeBlock id="example-anchor-code" label="Vue anchored trigger" :code="anchorVue" />
        </article>

        <article class="example-card example-card--corner">
          <div class="example-card__visual">
            <div class="corner-stage">
              <span class="corner-stage__page" />
              <button id="example-corner-trigger" class="example-trigger example-trigger--corner" type="button">
                <MessageSquare :size="18" aria-hidden="true" />
                Open corner widget
              </button>
            </div>
            <div>
              <h3>Fixed corner</h3>
              <p>Click the button to open a real bottom-right widget, the same placement used by script installs.</p>
            </div>
          </div>
          <CodeBlock id="example-corner-code" label="Official-compatible" :code="cornerScript" />
        </article>
      </div>
    </section>

    <section class="examples-section examples-section--matrix">
      <div class="section-heading">
        <p class="eyebrow">Customization examples</p>
        <h2>Presets get you close. Variables make it yours.</h2>
      </div>

      <div class="preset-strip">
        <article v-for="item in presetCards" :key="item.name" :class="['preset-card', `preset-card--${item.name}`]">
          <span>{{ item.name }}</span>
          <p>{{ item.copy }}</p>
        </article>
      </div>

      <div class="recipe-grid recipe-grid--expanded">
        <CodeBlock id="example-preset-color-code" label="Preset color fallback" :code="presetColorFallback" />
        <CodeBlock id="example-managed-trigger-code" label="Managed Vue trigger" :code="managedTriggerVue" />
        <CodeBlock id="example-slot-trigger-code" label="Trigger slot" :code="slotTriggerVue" />
        <CodeBlock id="example-external-trigger-code" label="External trigger id" :code="externalTriggerVue" />
        <CodeBlock id="example-css-code" label="CSS overrides" :code="cssOverrides" />
        <CodeBlock id="example-core-code" label="Core helper" :code="coreHelper" />
        <CodeBlock id="example-composable-code" label="Vue composable" :code="vueComposable" />
      </div>
    </section>

    <Context7Widget
      close-on-outside-click
      custom-trigger="#example-center-trigger"
      library="/desource-labs/context7-widget"
      panel-width="520px"
      position="center"
      preset="terminal"
      title="Centered Documentation Help"
      widget-id="examples-center"
    />

    <Context7Widget
      custom-trigger="#example-anchor-trigger"
      library="/desource-labs/context7-widget"
      panel-height="420px"
      panel-width="420px"
      position="anchor"
      preset="glass"
      title="Anchored Documentation Help"
      widget-id="examples-anchor"
    />

    <Context7Widget
      custom-trigger="#example-corner-trigger"
      library="/desource-labs/context7-widget"
      panel-height="440px"
      panel-width="420px"
      position="bottom-right"
      preset="neo"
      title="Corner Documentation Help"
      widget-id="examples-corner"
    />
  </main>
</template>

<script setup lang="ts">
import { MessageSquare, Search, Send, Wand2 } from 'lucide-vue-next';
import {
  buildContext7WidgetScriptTag,
  type Context7LauncherVariant,
  type Context7Position,
  type Context7Theme,
  type Context7WidgetPreset,
  type Context7WidgetScriptOptions
} from '@desource/context7-widget';
import {
  Context7Widget,
  type Context7WidgetAnswerCompleteEventDetail,
  type Context7WidgetCustomTrigger,
  type Context7WidgetErrorEventDetail,
  type Context7WidgetExpose,
  type Context7WidgetQuestionEventDetail
} from '@desource/context7-widget-vue';

const themeOptions = ['auto', 'light', 'dark'] as const satisfies readonly Context7Theme[];
const positionOptions = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
  'center',
  'anchor'
] as const satisfies readonly Context7Position[];
const presetOptions = [
  'default',
  'minimal',
  'glass',
  'neo',
  'terminal',
  'brutalist'
] as const satisfies readonly Context7WidgetPreset[];
const launcherOptions = ['icon', 'pill', 'badge'] as const satisfies readonly Context7LauncherVariant[];
const triggerModes = [
  { copy: 'Vue renders the button and exposes a slot.', label: 'Slot trigger', value: 'slot' },
  { copy: 'Vue renders the default package button.', label: 'Managed button', value: 'managed' },
  { copy: 'Bind to a button anywhere by id.', label: 'External id', value: 'external' },
  { copy: 'Use the built-in floating launcher.', label: 'Built-in', value: 'none' }
] as const;
const accentOptions = [
  { label: 'Preset color', swatch: '', value: '' },
  { label: 'Context7 green', swatch: '#7cffb2', value: '#7cffb2' },
  { label: 'Product blue', swatch: '#7ab8ff', value: '#7ab8ff' },
  { label: 'Action orange', swatch: '#ffb45e', value: '#ffb45e' },
  { label: 'Hot rose', swatch: '#ff6f91', value: '#ff6f91' }
] as const;

type ConstructorTriggerMode = (typeof triggerModes)[number]['value'];

const constructorLibrary = ref('/desource-labs/context7-widget');
const constructorTitle = ref('Context7 Widget Docs');
const constructorWidgetId = ref('docs-widget');
const constructorInitialMessage = ref(
  "Hello! I'm here to help with **{library}** docs.\n\nAsk about setup, props, events, styling, or integration patterns."
);
const constructorPlaceholder = ref('Ask integration questions...');
const constructorTheme = ref<Context7Theme>('auto');
const constructorPosition = ref<Context7Position>('anchor');
const constructorPreset = ref<Context7WidgetPreset>('glass');
const constructorLauncherVariant = ref<Context7LauncherVariant>('pill');
const constructorTriggerMode = ref<ConstructorTriggerMode>('slot');
const constructorColor = ref('');
const constructorPanelWidth = ref('440px');
const constructorPanelHeight = ref('460px');
const constructorLauncherLabel = ref('Ask docs');
const constructorBackdrop = ref(false);
const constructorCloseOnOutsideClick = ref(true);
const constructorDefaultOpen = ref(false);
const constructorShowPoweredBy = ref(true);
const constructorWidget = ref<Context7WidgetExpose | null>(null);
const constructorStats = reactive({
  answers: 0,
  closes: 0,
  errors: 0,
  lastAnswer: '',
  lastError: '',
  lastQuestion: '',
  opens: 0,
  questions: 0
});

const constructorUsesTriggerSlot = computed(() => constructorTriggerMode.value === 'slot');
const constructorCustomTrigger = computed<Context7WidgetCustomTrigger | undefined>(() => {
  if (constructorTriggerMode.value === 'none') return undefined;
  if (constructorTriggerMode.value === 'external') return 'examples-constructor-trigger';
  return true;
});
const constructorWidgetKey = computed(() =>
  [
    constructorLibrary.value,
    constructorInitialMessage.value,
    constructorTriggerMode.value,
    constructorPreset.value,
    constructorTheme.value,
    constructorPosition.value,
    constructorWidgetId.value
  ].join('|')
);
const constructorHighlights = computed(() => [
  { label: 'theme', value: constructorTheme.value },
  {
    label: 'trigger',
    value: triggerModes.find((mode) => mode.value === constructorTriggerMode.value)?.label ?? 'built-in'
  },
  { label: 'accent', value: constructorColor.value || 'preset' },
  { label: 'size', value: `${constructorPanelWidth.value} x ${constructorPanelHeight.value}` }
]);

const constructorVueCode = computed(() => {
  const props = [
    vueStringProp('library', constructorLibrary.value),
    vueStringProp('title', constructorTitle.value),
    vueStringProp('initial-message', normalizeSnippetText(constructorInitialMessage.value)),
    vueStringProp('placeholder', constructorPlaceholder.value),
    vueStringProp('theme', constructorTheme.value),
    vueStringProp('position', constructorPosition.value),
    vueStringProp('preset', constructorPreset.value),
    vueStringProp('launcher-variant', constructorLauncherVariant.value),
    vueStringProp('launcher-label', constructorLauncherLabel.value),
    vueStringProp('panel-width', constructorPanelWidth.value),
    vueStringProp('panel-height', constructorPanelHeight.value),
    vueBooleanProp('backdrop', constructorBackdrop.value),
    vueBooleanProp('close-on-outside-click', constructorCloseOnOutsideClick.value),
    vueBooleanProp('default-open', constructorDefaultOpen.value),
    vueBooleanProp('show-powered-by', constructorShowPoweredBy.value),
    vueStringProp('widget-id', constructorWidgetId.value),
    '@question="trackQuestion"',
    '@answer-complete="trackAnswer"'
  ];

  if (constructorColor.value) {
    props.splice(7, 0, vueStringProp('color', constructorColor.value));
  }

  if (constructorTriggerMode.value === 'external') {
    props.splice(7, 0, vueStringProp('custom-trigger', 'docs-trigger'));
  } else if (constructorTriggerMode.value !== 'none') {
    props.splice(7, 0, 'custom-trigger');
  }

  const componentOpen = `<Context7Widget\n${props.map((prop) => `  ${prop}`).join('\n')}`;

  if (constructorUsesTriggerSlot.value) {
    return `${componentOpen}
>
  <template #trigger="{ label }">
    <span class="docs-trigger-dot" />
    {{ label }}
  </template>
</Context7Widget>`;
  }

  const component = `${componentOpen}
/>`;

  if (constructorTriggerMode.value === 'external') {
    return `<button id="docs-trigger" type="button">
  ${escapeText(constructorLauncherLabel.value)}
</button>

${component}`;
  }

  return component;
});

const constructorScriptCode = computed(() => {
  const scriptOptions: Context7WidgetScriptOptions = {
    async: true,
    backdrop: constructorBackdrop.value,
    closeOnOutsideClick: constructorCloseOnOutsideClick.value,
    color: constructorColor.value || undefined,
    customTrigger: constructorTriggerMode.value === 'external' ? '#docs-trigger' : undefined,
    defaultOpen: constructorDefaultOpen.value,
    initialMessage: normalizeSnippetText(constructorInitialMessage.value),
    launcherLabel: constructorLauncherLabel.value,
    launcherVariant: constructorLauncherVariant.value,
    library: constructorLibrary.value,
    panelHeight: constructorPanelHeight.value,
    panelWidth: constructorPanelWidth.value,
    placeholder: constructorPlaceholder.value,
    position: constructorPosition.value,
    preset: constructorPreset.value,
    showPoweredBy: constructorShowPoweredBy.value,
    theme: constructorTheme.value,
    title: constructorTitle.value,
    widgetId: constructorWidgetId.value
  };
  const scriptTag = formatScriptTag(buildContext7WidgetScriptTag(scriptOptions));

  if (constructorTriggerMode.value === 'external') {
    return `<button id="docs-trigger" type="button">
  ${escapeText(constructorLauncherLabel.value)}
</button>

${scriptTag}`;
  }

  if (constructorTriggerMode.value === 'managed' || constructorTriggerMode.value === 'slot') {
    return `<!-- Managed buttons and slots are Vue-only.
     With widget.js, provide your own trigger id if you want a custom trigger. -->

${scriptTag}`;
  }

  return scriptTag;
});

const constructorCoreCode = computed(() => {
  const entries: Array<[string, string | boolean | undefined]> = [
    ['library', constructorLibrary.value],
    ['title', constructorTitle.value],
    ['initialMessage', normalizeSnippetText(constructorInitialMessage.value)],
    ['placeholder', constructorPlaceholder.value],
    ['theme', constructorTheme.value],
    ['position', constructorPosition.value],
    ['preset', constructorPreset.value],
    ['color', constructorColor.value || undefined],
    ['customTrigger', constructorTriggerMode.value === 'external' ? '#docs-trigger' : undefined],
    ['launcherVariant', constructorLauncherVariant.value],
    ['launcherLabel', constructorLauncherLabel.value],
    ['panelWidth', constructorPanelWidth.value],
    ['panelHeight', constructorPanelHeight.value],
    ['backdrop', constructorBackdrop.value],
    ['closeOnOutsideClick', constructorCloseOnOutsideClick.value],
    ['defaultOpen', constructorDefaultOpen.value],
    ['showPoweredBy', constructorShowPoweredBy.value],
    ['widgetId', constructorWidgetId.value]
  ];
  const compactEntries = entries.filter((entry): entry is [string, string | boolean] => entry[1] !== undefined);

  const objectBody = compactEntries
    .map(([key, value]) => `  ${key}: ${typeof value === 'boolean' ? value : JSON.stringify(value)}`)
    .join(',\n');

  const prefix =
    constructorTriggerMode.value === 'none' || constructorTriggerMode.value === 'external'
      ? ''
      : `// Core accepts selector-based custom triggers. Vue-only managed triggers stay in the Vue package.\n\n`;

  return `import { mountContext7Widget } from "@desource/context7-widget";

${prefix}mountContext7Widget({
${objectBody}
});`;
});

function onConstructorQuestion(detail: Context7WidgetQuestionEventDetail) {
  constructorStats.questions += 1;
  constructorStats.lastQuestion = detail.question;
}

function onConstructorAnswerComplete(detail: Context7WidgetAnswerCompleteEventDetail) {
  constructorStats.answers += 1;
  constructorStats.lastAnswer = detail.answer;
}

function onConstructorError(detail: Context7WidgetErrorEventDetail) {
  constructorStats.errors += 1;
  constructorStats.lastError = typeof detail.error === 'string' ? detail.error : detail.error.message;
}

async function sendConstructorPrompt() {
  await constructorWidget.value?.send('Show me the fastest Vue install path.');
}

function vueStringProp(name: string, value: string): string {
  return `${name}="${escapeAttribute(value)}"`;
}

function vueBooleanProp(name: string, value: boolean): string {
  return `:${name}="${value}"`;
}

function normalizeSnippetText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(value: string): string {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatScriptTag(scriptTag: string): string {
  const attributes =
    scriptTag
      .replace(/^<script\s+/, '')
      .replace(/><\/script>$/, '')
      .match(/[^\s=]+(?:="[^"]*")?/g) ?? [];

  return [`<script`, ...attributes.map((attribute) => `  ${attribute}`), `></scr` + `ipt>`].join('\n');
}

const centerScript =
  `<button id="docs-help">Open centered help</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-custom-trigger="#docs-help"
  data-position="center"
  data-preset="terminal"
  data-backdrop="true"
  data-close-on-outside-click="true"
></scr` + `ipt>`;

const anchorVue = `<button id="docs-trigger">Ask docs</button>

<Context7Widget
  library="/owner/repo"
  custom-trigger="docs-trigger"
  position="anchor"
  preset="glass"
  panel-height="420px"
  panel-width="420px"
/>`;

const cornerScript =
  `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-preset="minimal"
  data-position="bottom-right"
  data-placeholder="Ask about the docs..."
></scr` + `ipt>`;

const presetColorFallback =
  `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-preset="neo"
></scr` +
  `ipt>

<!-- data-color is omitted, so neo owns the button color. -->`;

const managedTriggerVue = `<Context7Widget
  library="/owner/repo"
  custom-trigger
  position="anchor"
  preset="glass"
  launcher-label="Ask docs"
/>`;

const slotTriggerVue = `<Context7Widget
  library="/owner/repo"
  custom-trigger
  position="anchor"
  preset="neo"
>
  <template #trigger="{ label, triggerId }">
    <span :data-trigger-id="triggerId" class="my-docs-button__dot" />
    {{ label }}
  </template>
</Context7Widget>`;

const externalTriggerVue = `<button id="docs-trigger">Ask docs</button>

<Context7Widget
  library="/owner/repo"
  custom-trigger="docs-trigger"
  position="anchor"
  panel-width="420px"
/>`;

const cssOverrides = `context7-widget {
  --c7-accent: #ff6f91;
  --c7-panel-radius: 8px;
  --c7-launcher-radius: 8px;
}

context7-widget::part(send-button) {
  min-width: 5rem;
}`;

const coreHelper = `import { mountContext7Widget } from "@desource/context7-widget";

mountContext7Widget({
  library: "/owner/repo",
  position: "center",
  preset: "neo",
  backdrop: true,
  closeOnOutsideClick: true,
  launcherVariant: "pill",
  launcherLabel: "Ask docs"
});`;

const vueComposable = `const docs = useContext7Widget({
  autoMount: true,
  library: "/owner/repo",
  widgetId: "docs",
  preset: "minimal"
});

await docs.send("Show installation examples");`;

const presetCards = [
  { copy: 'Quiet product UI with low visual noise.', name: 'minimal' },
  { copy: 'Layered translucent surface for rich demos.', name: 'glass' },
  { copy: 'Hard-edged playful docs widget.', name: 'neo' },
  { copy: 'Monospace assistant for dev-tool pages.', name: 'terminal' },
  { copy: 'High-contrast editorial surface.', name: 'brutalist' }
];
</script>
