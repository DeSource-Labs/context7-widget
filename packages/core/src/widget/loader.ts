import { defineContext7Widget, type Context7WidgetElement } from './element.js';

const DATASET_ATTRIBUTE_MAP = [
  ['backdrop', 'backdrop'],
  ['closeOnOutsideClick', 'close-on-outside-click'],
  ['color', 'color'],
  ['customTrigger', 'custom-trigger'],
  ['defaultOpen', 'default-open'],
  ['initialMessage', 'initial-message'],
  ['launcherLabel', 'launcher-label'],
  ['launcherVariant', 'launcher-variant'],
  ['library', 'library'],
  ['panelHeight', 'panel-height'],
  ['panelWidth', 'panel-width'],
  ['placeholder', 'placeholder'],
  ['position', 'position'],
  ['preset', 'preset'],
  ['theme', 'theme'],
  ['title', 'dialog-title'],
  ['welcomeMessage', 'initial-message'],
  ['widgetId', 'widget-id']
] as const;

export function mountContext7WidgetFromScript(script: HTMLScriptElement | null): Context7WidgetElement | null {
  if (!script || script.dataset.c7Mounted === 'true') return null;
  const { library } = script.dataset;

  if (!library) {
    console.warn('[Context7 Widget] Missing data-library attribute.');
    return null;
  }

  defineContext7Widget();

  const widget = document.createElement('context7-widget');

  for (const [datasetKey, widgetAttribute] of DATASET_ATTRIBUTE_MAP) {
    const value = script.dataset[datasetKey];
    if (value === undefined) continue;
    if (datasetKey === 'welcomeMessage' && widget.hasAttribute('initial-message')) continue;
    widget.setAttribute(widgetAttribute, value);
  }

  script.dataset.c7Mounted = 'true';
  document.body.append(widget);
  return widget;
}

export function findCurrentWidgetScript(): HTMLScriptElement | null {
  const current = document.currentScript;
  if (current instanceof HTMLScriptElement && current.dataset.library !== undefined) {
    return current;
  }

  const candidates = document.querySelectorAll<HTMLScriptElement>('script[data-library]');
  return candidates[candidates.length - 1] ?? null;
}
