import deSourceLabsLogoSource from './assets/desourcelabs.png?inline';
import { DEFAULT_CONTEXT7_INITIAL_MESSAGE } from './runtime.js';
import { context7WidgetLabels, resolveContext7WidgetLabels } from './labels.js';
import type {
  Context7LauncherVariant,
  Context7Position,
  Context7Theme,
  Context7WidgetConfig,
  Context7WidgetOptions,
  Context7WidgetPreset
} from './types.js';

export type Context7WidgetConfigInput = {
  readonly [Key in keyof Context7WidgetOptions]?: unknown;
};

export const CONTEXT7_URL = 'https://context7.com';
export const DESOURCE_LABS_URL = 'https://desourcelabs.com';

export const deSourceLabsLogoUrl = deSourceLabsLogoSource;

export const context7LogoPath =
  'M10.6 15.3c0 2.2-.9 4.1-2.4 5.8h3.4v1.7H6.3v-1.6c1.7-1.8 2.3-3.3 2.3-5.9h2Zm6.8 0c0 2.2.9 4.1 2.4 5.8h-3.4v1.7h5.3v-1.6c-1.7-1.8-2.3-3.3-2.3-5.9h-2ZM10.6 12.7c0-2.2-.9-4.1-2.4-5.8h3.4V5.2H6.3v1.6c1.7 1.8 2.3 3.3 2.3 5.9h2Zm6.8 0c0-2.2.9-4.1 2.4-5.8h-3.4V5.2h5.3v1.6c-1.7 1.8-2.3 3.3-2.3 5.9h-2Z';

export const context7WidgetDefaults = /* @__PURE__ */ Object.freeze({
  backdrop: false,
  closeOnOutsideClick: true,
  color: '',
  customTrigger: '',
  defaultOpen: false,
  initialMessage: DEFAULT_CONTEXT7_INITIAL_MESSAGE,
  labels: context7WidgetLabels,
  launcherLabel: 'Ask Docs AI',
  launcherVariant: 'icon',
  library: '',
  linkBaseUrl: '',
  panelHeight: '',
  panelWidth: '',
  placeholder: 'Ask about the docs...',
  position: 'bottom-right',
  preset: 'default',
  theme: 'auto',
  title: 'Chat with Documentation',
  widgetId: 'default'
} as const satisfies Context7WidgetConfig);

/** Apply runtime-safe defaults and normalize options received from JavaScript. */
export function resolveContext7WidgetConfig(options: Context7WidgetConfigInput): Context7WidgetConfig {
  const position = normalizePosition(options.position);

  return {
    backdrop: normalizeBoolean(options.backdrop, position === 'center'),
    closeOnOutsideClick: normalizeBoolean(options.closeOnOutsideClick, context7WidgetDefaults.closeOnOutsideClick),
    color: normalizeOptionalString(options.color),
    customTrigger: normalizeContext7WidgetTrigger(options.customTrigger),
    defaultOpen: normalizeBoolean(options.defaultOpen, context7WidgetDefaults.defaultOpen),
    initialMessage: normalizeContent(options.initialMessage, context7WidgetDefaults.initialMessage),
    labels: resolveContext7WidgetLabels(options.labels),
    launcherLabel: normalizeString(options.launcherLabel, context7WidgetDefaults.launcherLabel),
    launcherVariant: normalizeLauncherVariant(options.launcherVariant),
    library: normalizeOptionalString(options.library),
    linkBaseUrl: normalizeOptionalString(options.linkBaseUrl),
    panelHeight: normalizeOptionalString(options.panelHeight),
    panelWidth: normalizeOptionalString(options.panelWidth),
    placeholder: normalizeString(options.placeholder, context7WidgetDefaults.placeholder),
    position,
    preset: normalizePreset(options.preset),
    theme: normalizeTheme(options.theme),
    title: normalizeString(options.title, context7WidgetDefaults.title),
    widgetId: normalizeString(options.widgetId, context7WidgetDefaults.widgetId)
  };
}

/** Normalize an external trigger id or CSS selector for DOM lookup. */
export function normalizeContext7WidgetTrigger(value: unknown): string {
  const selector = normalizeOptionalString(value);
  if (!selector) return '';
  return /^[a-zA-Z_][\w-]*$/.test(selector) ? `#${selector}` : selector;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeString(value: unknown, fallback: string): string {
  return normalizeOptionalString(value) || fallback;
}

function normalizeContent(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizePosition(value: unknown): Context7Position {
  if (
    value === 'bottom-left' ||
    value === 'top-right' ||
    value === 'top-left' ||
    value === 'bottom-right' ||
    value === 'center' ||
    value === 'anchor'
  ) {
    return value;
  }
  return context7WidgetDefaults.position;
}

function normalizeLauncherVariant(value: unknown): Context7LauncherVariant {
  return value === 'pill' || value === 'badge' ? value : context7WidgetDefaults.launcherVariant;
}

function normalizePreset(value: unknown): Context7WidgetPreset {
  if (value === 'minimal' || value === 'glass' || value === 'neo' || value === 'terminal' || value === 'brutalist') {
    return value;
  }
  return context7WidgetDefaults.preset;
}

function normalizeTheme(value: unknown): Context7Theme {
  return value === 'light' || value === 'dark' ? value : context7WidgetDefaults.theme;
}
