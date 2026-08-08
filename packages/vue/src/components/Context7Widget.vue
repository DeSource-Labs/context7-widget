<template>
  <div
    ref="root"
    v-bind="attrs"
    class="context7-widget"
    :backdrop-active="resolvedBackdrop ? '' : undefined"
    :close-on-outside-click="String(resolvedCloseOnOutsideClick)"
    :color="resolvedColor || undefined"
    :custom-trigger="customTriggerSelector"
    :custom-trigger-active="hasCustomTrigger ? '' : undefined"
    :default-open="String(resolvedDefaultOpen)"
    :launcher-variant="resolvedLauncherVariant"
    :library="resolvedLibrary"
    :open="isOpen ? '' : undefined"
    :panel-height="resolvedPanelHeight || undefined"
    :panel-width="resolvedPanelWidth || undefined"
    :position="resolvedPosition"
    :preset="resolvedPreset"
    :style="widgetStyle"
    :theme="resolvedTheme"
    :widget-id="resolvedWidgetId"
    @keydown="session.handleKeyDown"
  >
    <div class="c7-backdrop" data-c7-backdrop part="backdrop" aria-hidden="true" @click="session.backdropClick" />

    <button
      v-if="rendersManagedTrigger"
      :id="managedTriggerId"
      ref="managedTrigger"
      class="context7-widget-trigger"
      type="button"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :data-preset="resolvedPreset"
      :data-theme="resolvedTheme"
    >
      <slot name="trigger" :label="resolvedLauncherLabel" :trigger-id="managedTriggerId">
        {{ resolvedLauncherLabel }}
      </slot>
    </button>

    <section
      :id="panelId"
      ref="panel"
      :aria-label="resolvedTitle"
      :aria-busy="busy"
      :aria-modal="resolvedPosition === 'center'"
      class="c7-panel"
      part="panel"
      role="dialog"
    >
      <header class="c7-header" part="header">
        <div class="c7-title" part="title">
          {{ resolvedTitle }}
        </div>

        <button class="c7-close" part="close-button" type="button" aria-label="Close chat" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div
        ref="messagesElement"
        aria-label="Documentation chat conversation"
        aria-live="polite"
        aria-relevant="additions text"
        class="c7-messages"
        part="messages"
        role="log"
      >
        <template v-for="item in displayItems" :key="item.id">
          <!--
            item.html is produced exclusively by core/session.ts using
            renderMarkdown(), which escapes arbitrary source input.
          -->
          <div
            v-if="item.kind === 'message' && item.role === 'assistant'"
            class="c7-message c7-message--assistant"
            part="message assistant-message"
            v-html="item.html"
          />

          <div v-else-if="item.kind === 'message'" class="c7-message c7-message--user" part="message user-message">
            {{ item.content }}
          </div>

          <div
            v-else-if="item.kind === 'error'"
            class="c7-message c7-message--error"
            part="message error-message"
            role="alert"
          >
            {{ item.message }}

            <template v-if="item.adminUrl">
              <br />
              <br />

              If you are the library owner, check your

              <a :href="item.adminUrl" target="_blank" rel="noopener noreferrer"> widget settings </a>

              on Context7.
            </template>
          </div>

          <div v-else class="c7-tool-call" part="tool-call">
            <div class="c7-tool-header">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <span> Searching: {{ item.query }} </span>

              <svg
                v-if="!item.hasResult"
                class="c7-spinner"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>

            <div v-if="item.hasResult" class="c7-tool-result">
              <button
                class="c7-tool-toggle"
                part="tool-toggle"
                type="button"
                :aria-controls="item.contentId"
                :aria-expanded="item.expanded"
                @click="session.toggleTool(item.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>

                <span>{{ item.expanded ? 'Hide results' : 'View results' }}</span>
              </button>

              <div
                v-show="item.expanded"
                :id="item.contentId"
                aria-label="Documentation search results"
                class="c7-tool-content"
                role="region"
              >
                <pre>{{ item.result }}</pre>
              </div>
            </div>
          </div>
        </template>

        <div v-if="showTyping" aria-label="Context7 is responding" class="c7-typing" part="typing" role="status">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      </div>

      <form class="c7-composer" part="composer" @submit.prevent="onSubmit">
        <input
          ref="input"
          v-model="draft"
          aria-label="Ask a documentation question"
          class="c7-input"
          part="input"
          type="text"
          autocomplete="off"
          :disabled="busy"
          :placeholder="resolvedPlaceholder"
        />

        <button :aria-label="busy ? 'Stop response' : 'Send question'" class="c7-send" part="send-button" type="submit">
          {{ busy ? 'Stop' : 'Send' }}
        </button>
      </form>

      <footer class="c7-footer" part="footer">
        <span class="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
          <a
            class="c7-brand-link"
            :href="CONTEXT7_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by Context7"
            title="Powered by Context7"
          >
            <span class="c7-brand-prefix"> Powered by </span>
            <svg
              class="c7-brand-logo c7-brand-logo--context7"
              aria-hidden="true"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="28" height="28" rx="4" fill="currentColor"></rect>
              <path
                d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0445 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
            </svg>
          </a>
          <span class="c7-brand-separator" aria-hidden="true"> · </span>
          <a
            class="c7-brand-link"
            :href="DESOURCE_LABS_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enhanced by DeSource Labs"
            title="Enhanced by DeSource Labs"
          >
            <span class="c7-brand-prefix"> Enhanced by </span>
            <img class="c7-brand-logo c7-brand-logo--desource" :src="deSourceLabsLogoUrl" alt="" />
          </a>
        </span>
      </footer>
    </section>

    <button
      v-if="!hasCustomTrigger"
      ref="launcher"
      class="c7-launcher"
      part="launcher"
      type="button"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      :aria-label="resolvedLauncherLabel"
      aria-haspopup="dialog"
      @click="session.openFrom($event.currentTarget)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M8 9h8" />
        <path d="M8 13h6" />
        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
      </svg>
      <span class="c7-launcher-label">
        {{ resolvedLauncherLabel }}
      </span>
    </button>

    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  compactContext7WidgetOptions,
  deSourceLabsLogoUrl,
  isContext7WidgetTriggerElement,
  normalizeContext7WidgetTrigger,
  resolveContext7WidgetConfig,
  useContext7Session,
  type Context7Message,
  type Context7SessionEvent,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetOptions
} from '@desource/context7-widget/kit';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toValue,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  type MaybeRefOrGetter
} from 'vue';
import { context7WidgetDefaultsKey } from '../internal/injection';
import { registerVueContext7Widget, unregisterVueContext7Widget } from '../internal/registry';
import type {
  Context7WidgetCustomTrigger,
  Context7WidgetEmits,
  Context7WidgetExpose,
  Context7WidgetProps,
  Context7WidgetSlots,
  Context7WidgetStateListener
} from '../types';

defineOptions({
  name: 'Context7Widget',
  inheritAttrs: false
});

const props = withDefaults(defineProps<Context7WidgetProps>(), {
  backdrop: undefined,
  closeOnOutsideClick: undefined,
  defaultOpen: undefined
});

defineSlots<Context7WidgetSlots>();

const emit = defineEmits<Context7WidgetEmits>();

const attrs = useAttrs();

const defaults = inject(context7WidgetDefaultsKey, {});

const root = useTemplateRef('root');
const panel = useTemplateRef('panel');
const input = useTemplateRef('input');
const launcher = useTemplateRef('launcher');
const managedTrigger = useTemplateRef('managedTrigger');
const messagesElement = useTemplateRef('messagesElement');

const draft = ref('');

const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '-');

const managedTriggerId = `context7-widget-trigger-${instanceId}`;

const panelId = `context7-widget-panel-${instanceId}`;

let registeredWidgetId = '';

const options = computed<Partial<Context7WidgetOptions>>(() => {
  const { customTrigger: _customTrigger, ...widgetProps } = props;

  const { customTrigger: _defaultCustomTrigger, ...defaultOptions } = defaults;

  const provided = compactContext7WidgetOptions(widgetProps);

  return compactContext7WidgetOptions({
    ...defaultOptions,
    ...provided
  });
});

const resolvedConfig = computed(() => resolveContext7WidgetConfig(options.value));

const resolvedLibrary = computed(() => resolvedConfig.value.library);

const resolvedPosition = computed(() => resolvedConfig.value.position);

const resolvedPreset = computed(() => resolvedConfig.value.preset);

const resolvedTheme = computed(() => resolvedConfig.value.theme);

const resolvedBackdrop = computed(() => resolvedConfig.value.backdrop);

const resolvedCloseOnOutsideClick = computed(() => resolvedConfig.value.closeOnOutsideClick);

const resolvedColor = computed(() => resolvedConfig.value.color);

const resolvedDefaultOpen = computed(() => resolvedConfig.value.defaultOpen);

const resolvedInitialMessage = computed(() => resolvedConfig.value.initialMessage);

const resolvedLauncherLabel = computed(() => resolvedConfig.value.launcherLabel);

const resolvedLauncherVariant = computed(() => resolvedConfig.value.launcherVariant);

const resolvedPanelHeight = computed(() => resolvedConfig.value.panelHeight);

const resolvedPanelWidth = computed(() => resolvedConfig.value.panelWidth);

const resolvedPlaceholder = computed(() => resolvedConfig.value.placeholder);

const resolvedTitle = computed(() => resolvedConfig.value.title);

const resolvedWidgetId = computed(() => resolvedConfig.value.widgetId);

const resolvedCustomTrigger = computed(() => resolveVueCustomTrigger(props.customTrigger ?? defaults.customTrigger));

const rendersManagedTrigger = computed(() => resolvedCustomTrigger.value === true);

const customTriggerSelector = computed(() => {
  if (resolvedCustomTrigger.value === true) {
    return `#${managedTriggerId}`;
  }

  if (typeof resolvedCustomTrigger.value === 'string') {
    return normalizeContext7WidgetTrigger(resolvedCustomTrigger.value);
  }

  return undefined;
});

const widgetStyle = computed(() => ({
  '--c7-accent': resolvedColor.value || undefined,

  '--c7-panel-height': resolvedPanelHeight.value || undefined,

  '--c7-panel-width': resolvedPanelWidth.value || undefined
}));

const detail = (): Context7WidgetLifecycleEventDetail => ({
  library: resolvedLibrary.value,
  widget: root.value as HTMLElement,
  widgetId: resolvedWidgetId.value
});

function getSessionCustomTrigger(): Element | string | null {
  const value = resolvedCustomTrigger.value;

  if (value === true) {
    return managedTrigger.value;
  }

  if (typeof value === 'string') {
    return normalizeContext7WidgetTrigger(value) || null;
  }

  return isContext7WidgetTriggerElement(value) ? value : null;
}

function handleSessionEvent(event: Context7SessionEvent): void {
  switch (event.type) {
    case 'open':
      emit('open', detail());
      return;

    case 'close':
      emit('close', detail());
      return;

    case 'question':
      draft.value = '';
      emit('question', { ...detail(), ...event.detail });
      return;

    case 'first-token':
      emit('first-token', { ...detail(), ...event.detail });
      return;

    case 'answer':
      emit('answer', { ...detail(), ...event.detail });
      return;

    case 'answer-complete':
      emit('answer-complete', { ...detail(), ...event.detail });
      return;

    case 'cancel':
      emit('cancel', { ...detail(), ...event.detail });
      return;

    case 'tool-call':
      emit('tool-call', { ...detail(), ...event.detail });
      return;

    case 'tool-result':
      emit('tool-result', { ...detail(), ...event.detail });
      return;

    case 'error':
      emit('error', { ...detail(), ...event.detail });
      return;
  }
}

const session = useContext7Session({
  elements: {
    input: () => input.value,
    launcher: () => launcher.value,
    messages: () => messagesElement.value,
    panel: () => panel.value,
    root: () => root.value
  },

  getConfig: () => ({
    closeOnOutsideClick: resolvedCloseOnOutsideClick.value,
    initialMessage: resolvedInitialMessage.value,
    library: resolvedLibrary.value,
    position: resolvedPosition.value
  }),

  getCustomTrigger: getSessionCustomTrigger,

  missingLibraryMessage: 'Missing library prop.',

  onEvent: handleSessionEvent,

  panelId
});

/*
 * Do this before subscribing so SSR / initial render already receives
 * the welcome message snapshot.
 */
session.reset();

const sessionState = shallowRef(session.getSnapshot());

const stopSessionSubscription = session.subscribe((snapshot) => {
  sessionState.value = snapshot;
});

const isOpen = computed(() => sessionState.value.open);

const busy = computed(() => sessionState.value.busy);

const displayItems = computed(() => sessionState.value.items);

const showTyping = computed(() => sessionState.value.typing);

const hasCustomTrigger = computed(() => rendersManagedTrigger.value || sessionState.value.customTriggerBound);

function resolveVueCustomTrigger(value: Context7WidgetCustomTrigger | undefined): Element | string | true | undefined {
  if (value === true || typeof value === 'string' || isContext7WidgetTriggerElement(value)) {
    return value;
  }

  const resolved = toValue(value as MaybeRefOrGetter<Element | null | undefined>);

  return isContext7WidgetTriggerElement(resolved) ? resolved : undefined;
}

function send(rawQuestion?: string) {
  return session.send(rawQuestion ?? draft.value);
}

function onSubmit(): void {
  if (busy.value) {
    session.cancel();
    return;
  }

  void send();
}

const open = () => session.open();
const close = () => session.close();
const toggle = () => session.toggle();
const cancel = () => session.cancel();
const reset = () => session.reset();

const getMessages = (): readonly Context7Message[] => session.getMessages();

function subscribe(listener: Context7WidgetStateListener): () => void {
  let initialized = false;

  let previousBusy = false;
  let previousOpen = false;

  let previousMessages: readonly Context7Message[] | undefined;

  return session.subscribe((snapshot) => {
    if (
      initialized &&
      previousBusy === snapshot.busy &&
      previousOpen === snapshot.open &&
      previousMessages === snapshot.messages
    ) {
      return;
    }

    initialized = true;

    previousBusy = snapshot.busy;
    previousOpen = snapshot.open;
    previousMessages = snapshot.messages;

    listener({
      busy: snapshot.busy,
      messages: snapshot.messages,
      open: snapshot.open
    });
  });
}

const exposed: Context7WidgetExpose = {
  get element() {
    return root.value;
  },
  cancel,
  close,
  getMessages,
  isBusy: () => session.isBusy(),
  isOpen: () => session.isOpen(),
  open,
  reset,
  send,
  subscribe,
  toggle
};

function register(): void {
  if (registeredWidgetId && registeredWidgetId !== resolvedWidgetId.value) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }

  registerVueContext7Widget(resolvedWidgetId.value, exposed);

  registeredWidgetId = resolvedWidgetId.value;
}

watch([resolvedLibrary, resolvedInitialMessage], () => {
  session.reset();
});

watch(
  resolvedCustomTrigger,
  () => {
    session.refreshTrigger();
  },
  {
    flush: 'post'
  }
);

watch([resolvedPosition, resolvedCloseOnOutsideClick], () => {
  session.refreshLayout();
});

watch(resolvedDefaultOpen, (value) => {
  if (value) {
    session.open();
  }
});

watch(resolvedWidgetId, register);

onMounted(() => {
  session.mount();

  register();

  emit('ready', detail());

  if (resolvedDefaultOpen.value) {
    session.open();
  }
});

onBeforeUnmount(() => {
  // If a streamed answer is active, cancellation is committed before teardown.
  session.destroy();

  stopSessionSubscription();

  if (registeredWidgetId) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }
});

defineExpose(exposed);
</script>
