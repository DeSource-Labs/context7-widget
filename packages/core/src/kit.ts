import type { Context7RenderedErrorHtml } from './runtime.js';
import { renderMarkdown } from './markdown.js';
import type { Context7MarkdownOptions, Context7RenderedMarkdown } from './markdown.js';
import type { Context7Role, Context7WidgetEventName, Context7WidgetOptions } from './types.js';

export type Context7ErrorDisplayItem = {
  html: Context7RenderedErrorHtml;
  id: string;
  kind: 'error';
  question: string;
};

export type Context7MessageDisplayItem = {
  content: string;
  id: string;
  kind: 'message';
  role: Context7Role;
  streaming?: boolean;
};

export type Context7ToolDisplayItem = {
  contentId: string;
  expanded: boolean;
  hasResult: boolean;
  id: string;
  kind: 'tool';
  query: string;
  result: string;
  toolCallId: string;
};

export type Context7DisplayItem = Context7ErrorDisplayItem | Context7MessageDisplayItem | Context7ToolDisplayItem;

type Context7MarkdownRenderer<Output> = (markdown: string, options?: Context7MarkdownOptions) => Output;

type Context7CompletedMarkdownCacheEntry<Output> = readonly [
  content: string,
  baseUrl: string,
  copyCodeLabel: string,
  output: Output
];

type Context7CompletedMarkdownRenderer<Output> = (
  item: Context7MessageDisplayItem,
  options: Context7MarkdownOptions
) => Output;

export interface Context7StackedRegistry<Value> {
  get(id?: string): Value | undefined;
  register(id: string, value: Value): void;
  unregister(id: string, value: Value): void;
}

/** Keep duplicate widget ids deterministic while mounted instances come and go. */
export function createContext7StackedRegistry<Value>(onChange?: () => void): Context7StackedRegistry<Value> {
  const stacks = new Map<string, Value[]>();

  return {
    get(id = 'default') {
      const stack = stacks.get(id);
      const registered = stack?.[stack.length - 1];
      if (registered || id !== 'default') return registered;

      for (const fallbackStack of stacks.values()) {
        const fallback = fallbackStack[fallbackStack.length - 1];
        if (fallback) return fallback;
      }
      return undefined;
    },
    register(id, value) {
      const stack = stacks.get(id) ?? [];
      if (stack.includes(value)) return;
      stack.push(value);
      stacks.set(id, stack);
      onChange?.();
    },
    unregister(id, value) {
      const stack = stacks.get(id);
      const index = stack?.indexOf(value) ?? -1;
      if (!stack || index < 0) return;
      stack.splice(index, 1);
      if (stack.length === 0) stacks.delete(id);
      onChange?.();
    }
  };
}

/** Cache completed answer HTML for the lifetime of its display item. */
export function createContext7CompletedMarkdownRenderer(): Context7CompletedMarkdownRenderer<Context7RenderedMarkdown>;
export function createContext7CompletedMarkdownRenderer<Output>(
  renderer: Context7MarkdownRenderer<Output>
): Context7CompletedMarkdownRenderer<Output>;
export function createContext7CompletedMarkdownRenderer(
  renderer: Context7MarkdownRenderer<unknown> = renderMarkdown
): Context7CompletedMarkdownRenderer<unknown> {
  const cache = new WeakMap<Context7MessageDisplayItem, Context7CompletedMarkdownCacheEntry<unknown>>();

  return (item, options) => {
    const baseUrl = options.baseUrl ?? '';
    const copyCodeLabel = options.copyCodeLabel ?? '';
    const cached = cache.get(item);

    if (cached?.[0] === item.content && cached[1] === baseUrl && cached[2] === copyCodeLabel) {
      return cached[3];
    }

    const output = renderer(item.content, options);
    cache.set(item, [item.content, baseUrl, copyCodeLabel, output]);
    return output;
  };
}

export const context7WidgetEvents = [
  'c7:ready',
  'c7:open',
  'c7:close',
  'c7:cancel',
  'c7:question',
  'c7:first-token',
  'c7:answer',
  'c7:answer-complete',
  'c7:tool-call',
  'c7:tool-result',
  'c7:error'
] as const satisfies readonly Context7WidgetEventName[];

export const context7WidgetOptionKeys = [
  'backdrop',
  'closeOnOutsideClick',
  'color',
  'customTrigger',
  'defaultOpen',
  'initialMessage',
  'labels',
  'launcherLabel',
  'launcherVariant',
  'library',
  'linkBaseUrl',
  'panelHeight',
  'panelWidth',
  'placeholder',
  'position',
  'preset',
  'theme',
  'title',
  'widgetId'
] as const satisfies readonly (keyof Context7WidgetOptions)[];

export function compactContext7WidgetOptions(options: Partial<Context7WidgetOptions>): Partial<Context7WidgetOptions> {
  const compacted: Partial<Context7WidgetOptions> = {};

  for (const key of context7WidgetOptionKeys) {
    copyContext7WidgetOption(compacted, options, key);
  }

  return compacted;
}

/** Merge layered widget defaults while preserving partial localization dictionaries. */
export function mergeContext7WidgetOptions(
  ...layers: readonly Readonly<Partial<Context7WidgetOptions>>[]
): Partial<Context7WidgetOptions> {
  const merged: Partial<Context7WidgetOptions> = {};
  let labels: Context7WidgetOptions['labels'];

  for (const layer of layers) {
    const compacted = compactContext7WidgetOptions(layer);
    Object.assign(merged, compacted);
    if (compacted.labels) labels = { ...labels, ...compacted.labels };
  }

  if (labels) merged.labels = labels;
  return merged;
}

function copyContext7WidgetOption<Key extends keyof Context7WidgetOptions>(
  target: Partial<Context7WidgetOptions>,
  source: Partial<Context7WidgetOptions>,
  key: Key
): void {
  const value = source[key];
  if (value !== undefined && value !== '') target[key] = value;
}

export function isContext7WidgetEventName(value: string): value is Context7WidgetEventName {
  return (context7WidgetEvents as readonly string[]).includes(value);
}

// The framework-author surface is a strict superset of /core. Keeping the shared
// exports here prevents the two public entry points from drifting as core evolves.
export * from './core.js';
export { callContext7ListenerSafely } from './listener.js';
export { CONTEXT7_URL, DESOURCE_LABS_URL, context7LogoPath, deSourceLabsLogoUrl } from './config.js';
export {
  assertBrowser,
  cancelRenderFrame,
  captureTriggerAccessibility,
  isContext7WidgetTriggerElement,
  querySelectorSafely,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  resolveTarget,
  restoreTriggerAccessibility,
  trapFocus,
  updateAnchorPosition
} from './dom.js';
export type { Context7CustomTriggerResolution } from './dom.js';
export type {
  Context7LauncherVariant,
  Context7Position,
  Context7Theme,
  Context7TriggerA11yState,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetBaseEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetController,
  Context7WidgetDomEvent,
  Context7WidgetDomEventMap,
  Context7WidgetErrorEventDetail,
  Context7WidgetEventDetail,
  Context7WidgetEventDetailFor,
  Context7WidgetEventMap,
  Context7WidgetEventName,
  Context7WidgetEventPayload,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetInstance,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetTarget,
  Context7WidgetTrigger,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from './types.js';
