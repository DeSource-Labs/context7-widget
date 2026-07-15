import { defineContext7Widget, Context7WidgetElement } from "./widget-element";
import type {
  Context7WidgetApi,
  Context7WidgetOptions,
  Context7WidgetScriptOptions,
  Context7WidgetTarget
} from "./types";

const DEFAULT_SCRIPT_SRC = "https://context7.desource-labs.org/widget.js";

const OPTION_ATTRIBUTES: Array<[keyof Context7WidgetOptions, string]> = [
  ["apiUrl", "api-url"],
  ["color", "color"],
  ["customTrigger", "custom-trigger"],
  ["initialMessage", "initial-message"],
  ["library", "library"],
  ["placeholder", "placeholder"],
  ["position", "position"],
  ["theme", "theme"],
  ["title", "title"],
  ["widgetId", "widget-id"]
];

const SCRIPT_OPTION_ATTRIBUTES: Array<[keyof Context7WidgetOptions, string]> = [
  ["apiUrl", "data-api-url"],
  ["color", "data-color"],
  ["customTrigger", "data-custom-trigger"],
  ["initialMessage", "data-initial-message"],
  ["library", "data-library"],
  ["placeholder", "data-placeholder"],
  ["position", "data-position"],
  ["theme", "data-theme"],
  ["title", "data-title"],
  ["widgetId", "data-widget-id"]
];

export function toContext7WidgetAttributes(options: Context7WidgetOptions): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const [key, attribute] of OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined || value === "") continue;
    attributes[attribute] = String(value);
  }

  if (options.hideDefaultButton) {
    attributes["hide-default-button"] = "";
  }

  return attributes;
}

export function createContext7Widget(options: Context7WidgetOptions): Context7WidgetElement {
  assertBrowser();
  defineContext7Widget();

  const widget = document.createElement("context7-widget") as Context7WidgetElement;
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
  options: Partial<Context7WidgetOptions>
): void {
  for (const [key, attribute] of OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined) continue;
    if (value === "") {
      widget.removeAttribute(attribute);
    } else {
      widget.setAttribute(attribute, String(value));
    }
  }

  if (options.hideDefaultButton === true) {
    widget.setAttribute("hide-default-button", "");
  } else if (options.hideDefaultButton === false) {
    widget.removeAttribute("hide-default-button");
  }
}

export function getContext7WidgetApi(): Context7WidgetApi | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Context7Widget;
}

export function getContext7Widget(widgetId?: string): HTMLElement | undefined {
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

  for (const [key, attribute] of SCRIPT_OPTION_ATTRIBUTES) {
    const value = options[key];
    if (value === undefined || value === "") continue;
    attributes[attribute] = String(value);
  }

  if (options.hideDefaultButton) {
    attributes["data-hide-default-button"] = "true";
  }

  const serialized = Object.entries(attributes)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeAttribute(String(value))}"`))
    .join(" ");

  return `<script ${serialized}></script>`;
}

function resolveTarget(target: Context7WidgetTarget): Element | DocumentFragment {
  if (typeof target !== "string") return target;

  const element = document.querySelector(target);
  if (!element) {
    throw new Error(`Context7 widget target was not found: ${target}`);
  }

  return element;
}

function assertBrowser(): void {
  if (typeof document === "undefined") {
    throw new Error("Context7 widget helpers require a browser document.");
  }
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
