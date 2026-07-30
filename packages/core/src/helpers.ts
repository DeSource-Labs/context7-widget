import { defineContext7Widget, Context7WidgetElement } from './widget-element.js';
import type {
  Context7WidgetApi,
  Context7WidgetInstance,
  Context7WidgetOptions,
  Context7WidgetScriptOptions,
  Context7WidgetTarget
} from './types.js';
import { assertBrowser, resolveTarget } from './dom.js';

const DEFAULT_SCRIPT_SRC = 'https://context7.desource-labs.org/widget.js';

const OPTION_ATTRIBUTES: ReadonlyArray<
  readonly [key: keyof Context7WidgetOptions, elementAttribute: string, scriptAttribute: string]
> = [
  ['backdrop', 'backdrop', 'data-backdrop'],
  ['closeOnOutsideClick', 'close-on-outside-click', 'data-close-on-outside-click'],
  ['color', 'color', 'data-color'],
  ['customTrigger', 'custom-trigger', 'data-custom-trigger'],
  ['defaultOpen', 'default-open', 'data-default-open'],
  ['initialMessage', 'initial-message', 'data-initial-message'],
  ['launcherLabel', 'launcher-label', 'data-launcher-label'],
  ['launcherVariant', 'launcher-variant', 'data-launcher-variant'],
  ['library', 'library', 'data-library'],
  ['panelHeight', 'panel-height', 'data-panel-height'],
  ['panelWidth', 'panel-width', 'data-panel-width'],
  ['placeholder', 'placeholder', 'data-placeholder'],
  ['position', 'position', 'data-position'],
  ['preset', 'preset', 'data-preset'],
  ['theme', 'theme', 'data-theme'],
  ['title', 'dialog-title', 'data-title'],
  ['widgetId', 'widget-id', 'data-widget-id']
];

export function toContext7WidgetAttributes(options: Context7WidgetOptions): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const [key, attribute] of OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined || value === '') continue;
    if (typeof value === 'boolean') {
      attributes[attribute] = String(value);
      continue;
    }
    attributes[attribute] = String(value);
  }

  return attributes;
}

export function createContext7Widget(options: Context7WidgetOptions): Context7WidgetElement {
  assertBrowser();
  defineContext7Widget();

  const widget = document.createElement('context7-widget') as Context7WidgetElement;
  setContext7WidgetAttributes(widget, options);
  return widget;
}

export function mountContext7Widget(
  options: Context7WidgetOptions,
  target?: Context7WidgetTarget
): Context7WidgetElement {
  const widget = createContext7Widget(options);
  resolveTarget(target ?? document.body).append(widget);
  return widget;
}

export function setContext7WidgetAttributes(
  widget: HTMLElement,
  options: Partial<Context7WidgetOptions>,
  clearMissing = false
): void {
  for (const [key, attribute] of OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined) {
      if (clearMissing) {
        widget.removeAttribute(attribute);
      }
      continue;
    }
    if (typeof value === 'boolean') {
      widget.setAttribute(attribute, String(value));
      continue;
    }
    if (value === '') {
      widget.removeAttribute(attribute);
    } else {
      widget.setAttribute(attribute, String(value));
    }
  }
}

export function getContext7WidgetApi(): Context7WidgetApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.Context7Widget;
}

export function getContext7Widget(widgetId?: string): Context7WidgetInstance | undefined {
  return getContext7WidgetApi()?.get(widgetId);
}

export function buildContext7WidgetScriptTag(options: Context7WidgetScriptOptions): string {
  const attributes: Record<string, string | boolean> = {
    src: options.src || DEFAULT_SCRIPT_SRC
  };

  if (options.async !== false) {
    attributes.async = true;
  }

  if (options.defer) {
    attributes.defer = true;
  }

  if (options.id) {
    attributes.id = options.id;
  }

  if (options.nonce) {
    attributes.nonce = options.nonce;
  }

  for (const [key, , attribute] of OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined || value === '') continue;
    if (typeof value === 'boolean') {
      attributes[attribute] = String(value);
      continue;
    }
    attributes[attribute] = String(value);
  }

  const serialized = Object.entries(attributes)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeAttribute(String(value))}"`))
    .join(' ');

  return `<script ${serialized}></script>`;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
