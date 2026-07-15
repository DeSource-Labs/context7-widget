import { defineContext7Widget } from "./widget-element";

const ATTRIBUTE_MAP: Array<[scriptAttribute: string, widgetAttribute: string]> = [
  ["data-api-url", "api-url"],
  ["data-color", "color"],
  ["data-custom-trigger", "custom-trigger"],
  ["data-initial-message", "initial-message"],
  ["data-library", "library"],
  ["data-placeholder", "placeholder"],
  ["data-position", "position"],
  ["data-theme", "theme"],
  ["data-title", "title"],
  ["data-widget-id", "widget-id"]
];

export function mountContext7WidgetFromScript(script: HTMLScriptElement | null): HTMLElement | null {
  if (!script || script.dataset.c7Mounted === "true") return null;
  const library = script.getAttribute("data-library");

  if (!library) {
    console.warn("[Context7 Widget] Missing data-library attribute.");
    return null;
  }

  defineContext7Widget();

  const widget = document.createElement("context7-widget");

  for (const [scriptAttribute, widgetAttribute] of ATTRIBUTE_MAP) {
    const value = script.getAttribute(scriptAttribute);
    if (!value) continue;
    widget.setAttribute(scriptAttribute, value);
    widget.setAttribute(widgetAttribute, value);
  }

  if (!widget.hasAttribute("api-url")) {
    widget.setAttribute("api-url", "https://context7.com");
  }

  if (script.getAttribute("data-hide-default-button") === "true") {
    widget.setAttribute("data-hide-default-button", "true");
    widget.setAttribute("hide-default-button", "");
  }

  script.dataset.c7Mounted = "true";
  document.body.append(widget);
  return widget;
}

export function findCurrentWidgetScript(): HTMLScriptElement | null {
  const current = document.currentScript;
  if (current instanceof HTMLScriptElement && current.hasAttribute("data-library")) {
    return current;
  }

  const candidates = document.querySelectorAll<HTMLScriptElement>("script[data-library]");
  return candidates[candidates.length - 1] ?? null;
}
