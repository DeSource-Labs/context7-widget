import type { Context7TriggerA11yState, Context7WidgetTarget } from './types.js';

export interface Context7AnchorRect {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export interface Context7AnchorLayoutOptions {
  readonly anchor: Context7AnchorRect;
  readonly gap?: number;
  readonly margin?: number;
  readonly panelHeight: number;
  readonly panelWidth: number;
  readonly viewportHeight: number;
  readonly viewportWidth: number;
}

export interface Context7AnchorLayout {
  readonly left: number;
  readonly origin: string;
  readonly top: number;
}

/** Resolve an end-aligned floating panel within the visible viewport. */
export function resolveContext7AnchorLayout({
  anchor,
  gap = 12,
  margin = 12,
  panelHeight,
  panelWidth,
  viewportHeight,
  viewportWidth
}: Context7AnchorLayoutOptions): Context7AnchorLayout {
  const above = anchor.top - panelHeight - gap;
  const below = anchor.bottom + gap;
  const spaceAbove = anchor.top - margin - gap;
  const spaceBelow = viewportHeight - anchor.bottom - margin - gap;
  const hasSpaceAbove = above >= margin;
  const hasSpaceBelow = below + panelHeight <= viewportHeight - margin;
  const opensAbove = hasSpaceAbove || (!hasSpaceBelow && spaceAbove >= spaceBelow);
  const left = clamp(anchor.right - panelWidth, margin, Math.max(margin, viewportWidth - panelWidth - margin));
  const top = clamp(opensAbove ? above : below, margin, Math.max(margin, viewportHeight - panelHeight - margin));

  return {
    left,
    origin: `${opensAbove ? 'bottom' : 'top'} right`,
    top
  };
}

export function requestRenderFrame(callback: (timestamp: number) => void): number {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return window.setTimeout(() => callback(performance.now()), 16);
}

export function cancelRenderFrame(frame: number | null): void {
  if (frame === null) return;
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(frame);
  } else {
    window.clearTimeout(frame);
  }
}

export function querySelectorSafely(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    console.warn(`[Context7 Widget] Invalid custom trigger selector: ${selector}`);
    return null;
  }
}

export function captureTriggerAccessibility(element: Element): Context7TriggerA11yState {
  return {
    ariaControls: element.getAttribute('aria-controls'),
    ariaExpanded: element.getAttribute('aria-expanded'),
    ariaHasPopup: element.getAttribute('aria-haspopup'),
    element
  };
}

export function restoreTriggerAccessibility(state: Context7TriggerA11yState): void {
  restoreAttribute(state.element, 'aria-controls', state.ariaControls);
  restoreAttribute(state.element, 'aria-expanded', state.ariaExpanded);
  restoreAttribute(state.element, 'aria-haspopup', state.ariaHasPopup);
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement | ShadowRoot): void {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  const root = container instanceof ShadowRoot ? container : container.getRootNode();
  const active = root instanceof ShadowRoot ? root.activeElement : document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function resolveTarget(target: Context7WidgetTarget): Element | DocumentFragment {
  if (typeof target !== 'string') return target;

  const element = document.querySelector(target);
  if (!element) {
    throw new Error(`Context7 widget target was not found: ${target}`);
  }

  return element;
}

export function assertBrowser(): void {
  if (typeof document === 'undefined') {
    throw new Error('Context7 widget helpers require a browser document.');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}
