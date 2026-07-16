import { defineContext7Widget } from './widget-element';

const ATTRIBUTE_MAP: Array<[scriptAttribute: string, widgetAttribute: string]> = [
  ['data-backdrop', 'backdrop'],
  ['data-close-on-outside-click', 'close-on-outside-click'],
  ['data-color', 'color'],
  ['data-custom-trigger', 'custom-trigger'],
  ['data-default-open', 'default-open'],
  ['data-initial-message', 'initial-message'],
  ['data-launcher-label', 'launcher-label'],
  ['data-launcher-variant', 'launcher-variant'],
  ['data-library', 'library'],
  ['data-panel-height', 'panel-height'],
  ['data-panel-width', 'panel-width'],
  ['data-placeholder', 'placeholder'],
  ['data-position', 'position'],
  ['data-preset', 'preset'],
  ['data-show-powered-by', 'show-powered-by'],
  ['data-theme', 'theme'],
  ['data-title', 'title'],
  ['data-welcome-message', 'initial-message'],
  ['data-widget-id', 'widget-id']
];

export function mountContext7WidgetFromScript(script: HTMLScriptElement | null): HTMLElement | null {
  if (!script || script.dataset.c7Mounted === 'true') return null;
  const library = script.getAttribute('data-library');

  if (!library) {
    console.warn('[Context7 Widget] Missing data-library attribute.');
    return null;
  }

  defineContext7Widget();

  const widget = document.createElement('context7-widget');

  for (const [scriptAttribute, widgetAttribute] of ATTRIBUTE_MAP) {
    const value = script.getAttribute(scriptAttribute);
    if (value === null) continue;
    widget.setAttribute(scriptAttribute, value);
    widget.setAttribute(widgetAttribute, value);
  }

  script.dataset.c7Mounted = 'true';
  document.body.append(widget);
  return widget;
}

export function findCurrentWidgetScript(): HTMLScriptElement | null {
  const current = document.currentScript;
  if (current instanceof HTMLScriptElement && current.hasAttribute('data-library')) {
    return current;
  }

  const candidates = document.querySelectorAll<HTMLScriptElement>('script[data-library]');
  return candidates[candidates.length - 1] ?? null;
}
