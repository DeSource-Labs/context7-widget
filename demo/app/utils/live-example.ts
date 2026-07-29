import type {
  Context7LauncherVariant,
  Context7Position,
  Context7Theme,
  Context7WidgetPreset
} from '@desource/context7-widget';

export type LiveExampleTriggerMode = 'slot' | 'managed' | 'external' | 'none';

export interface LiveExampleOptions {
  backdrop: boolean;
  closeOnOutsideClick: boolean;
  color: string;
  defaultOpen: boolean;
  initialMessage: string;
  launcherLabel: string;
  launcherVariant: Context7LauncherVariant;
  library: string;
  panelHeight: string;
  panelWidth: string;
  placeholder: string;
  position: Context7Position;
  preset: Context7WidgetPreset;
  theme: Context7Theme;
  title: string;
  triggerMode: LiveExampleTriggerMode;
  widgetId: string;
}

export const LIVE_EXAMPLE_DEFAULTS = {
  backdrop: false,
  closeOnOutsideClick: true,
  color: '',
  defaultOpen: false,
  initialMessage:
    "Hello! I'm here to help with **{library}** docs.\n\nAsk about setup, props, events, styling, or integration patterns.",
  launcherLabel: 'Ask docs',
  launcherVariant: 'pill',
  library: '/desource-labs/context7-widget',
  panelHeight: '460px',
  panelWidth: '440px',
  placeholder: 'Ask integration questions...',
  position: 'anchor',
  preset: 'glass',
  theme: 'auto',
  title: 'Context7 Widget Docs',
  triggerMode: 'slot',
  widgetId: 'docs-widget'
} as const satisfies LiveExampleOptions;

const launcherVariants = ['icon', 'pill', 'badge'] as const satisfies readonly Context7LauncherVariant[];
const positions = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
  'center',
  'anchor'
] as const satisfies readonly Context7Position[];
const presets = [
  'default',
  'minimal',
  'glass',
  'neo',
  'terminal',
  'brutalist'
] as const satisfies readonly Context7WidgetPreset[];
const themes = ['auto', 'light', 'dark'] as const satisfies readonly Context7Theme[];
const triggerModes = ['slot', 'managed', 'external', 'none'] as const satisfies readonly LiveExampleTriggerMode[];

export function buildLiveExampleUrl(options: LiveExampleOptions): string {
  const query = new URLSearchParams({
    backdrop: String(options.backdrop),
    closeOnOutsideClick: String(options.closeOnOutsideClick),
    color: options.color,
    defaultOpen: String(options.defaultOpen),
    initialMessage: options.initialMessage,
    launcherLabel: options.launcherLabel,
    launcherVariant: options.launcherVariant,
    library: options.library,
    panelHeight: options.panelHeight,
    panelWidth: options.panelWidth,
    placeholder: options.placeholder,
    position: options.position,
    preset: options.preset,
    theme: options.theme,
    title: options.title,
    triggerMode: options.triggerMode,
    widgetId: options.widgetId
  });

  return `/live?${query.toString()}`;
}

export function parseLiveExampleQuery(query: Record<string, unknown>): LiveExampleOptions {
  return {
    backdrop: readBoolean(query.backdrop, LIVE_EXAMPLE_DEFAULTS.backdrop),
    closeOnOutsideClick: readBoolean(query.closeOnOutsideClick, LIVE_EXAMPLE_DEFAULTS.closeOnOutsideClick),
    color: readString(query.color, LIVE_EXAMPLE_DEFAULTS.color),
    defaultOpen: readBoolean(query.defaultOpen, LIVE_EXAMPLE_DEFAULTS.defaultOpen),
    initialMessage: readString(query.initialMessage, LIVE_EXAMPLE_DEFAULTS.initialMessage),
    launcherLabel: readString(query.launcherLabel, LIVE_EXAMPLE_DEFAULTS.launcherLabel),
    launcherVariant: readOption(query.launcherVariant, launcherVariants, LIVE_EXAMPLE_DEFAULTS.launcherVariant),
    library: readString(query.library, LIVE_EXAMPLE_DEFAULTS.library),
    panelHeight: readString(query.panelHeight, LIVE_EXAMPLE_DEFAULTS.panelHeight),
    panelWidth: readString(query.panelWidth, LIVE_EXAMPLE_DEFAULTS.panelWidth),
    placeholder: readString(query.placeholder, LIVE_EXAMPLE_DEFAULTS.placeholder),
    position: readOption(query.position, positions, LIVE_EXAMPLE_DEFAULTS.position),
    preset: readOption(query.preset, presets, LIVE_EXAMPLE_DEFAULTS.preset),
    theme: readOption(query.theme, themes, LIVE_EXAMPLE_DEFAULTS.theme),
    title: readString(query.title, LIVE_EXAMPLE_DEFAULTS.title),
    triggerMode: readOption(query.triggerMode, triggerModes, LIVE_EXAMPLE_DEFAULTS.triggerMode),
    widgetId: readString(query.widgetId, LIVE_EXAMPLE_DEFAULTS.widgetId)
  };
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  const candidate = firstQueryValue(value);
  if (candidate === 'true') return true;
  if (candidate === 'false') return false;
  return fallback;
}

function readOption<const Option extends string>(value: unknown, options: readonly Option[], fallback: Option): Option {
  const candidate = firstQueryValue(value);
  return candidate && options.includes(candidate as Option) ? (candidate as Option) : fallback;
}

function readString(value: unknown, fallback: string): string {
  return firstQueryValue(value) ?? fallback;
}
