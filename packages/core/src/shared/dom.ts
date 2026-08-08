import type {
  Context7Position,
  Context7TriggerA11yState,
  Context7WidgetTarget,
  Context7WidgetTrigger
} from '../types.js';

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
  readonly viewportLeft?: number;
  readonly viewportTop?: number;
  readonly viewportWidth: number;
}

export interface Context7AnchorLayout {
  readonly left: number;
  readonly maxHeight: number;
  readonly maxWidth: number;
  readonly origin: string;
  readonly placement: 'bottom' | 'top';
  readonly top: number;
}

export interface Context7CustomTriggerResolution {
  readonly element: Element | null;
  readonly invalidSelector: boolean;
  readonly selector: string;
}

/** Resolve an end-aligned floating panel within the visible visual viewport. */
export function resolveContext7AnchorLayout({
  anchor,
  gap = 12,
  margin = 12,
  panelHeight,
  panelWidth,
  viewportHeight,
  viewportLeft = 0,
  viewportTop = 0,
  viewportWidth
}: Context7AnchorLayoutOptions): Context7AnchorLayout {
  const viewportBottom = viewportTop + Math.max(0, viewportHeight);
  const viewportRight = viewportLeft + Math.max(0, viewportWidth);
  const topBoundary = viewportTop + margin;
  const leftBoundary = viewportLeft + margin;
  const maxHeight = Math.max(0, viewportHeight - margin * 2);
  const maxWidth = Math.max(0, viewportWidth - margin * 2);
  const renderedWidth = Math.min(Math.max(0, panelWidth), maxWidth);
  const spaceAbove = Math.max(0, anchor.top - gap - topBoundary);
  const spaceBelow = Math.max(0, viewportBottom - margin - anchor.bottom - gap);

  // Prefer the top placement. Flip when it cannot fit there, or choose the
  // roomier side when neither side can fit the requested height.
  const opensAbove = spaceAbove >= panelHeight || (spaceBelow < panelHeight && spaceAbove >= spaceBelow);
  const placement = opensAbove ? 'top' : 'bottom';
  const availableHeight = Math.min(opensAbove ? spaceAbove : spaceBelow, maxHeight);
  const renderedHeight = Math.min(Math.max(0, panelHeight), availableHeight);
  const left = clamp(
    anchor.right - renderedWidth,
    leftBoundary,
    Math.max(leftBoundary, viewportRight - margin - renderedWidth)
  );
  const naturalTop = opensAbove ? anchor.top - gap - renderedHeight : anchor.bottom + gap;
  const top = clamp(naturalTop, topBoundary, Math.max(topBoundary, viewportBottom - margin - renderedHeight));

  return {
    left,
    maxHeight: availableHeight,
    maxWidth,
    origin: `${opensAbove ? 'bottom' : 'top'} right`,
    placement,
    top
  };
}

/** Update the CSS custom properties for an anchored floating panel. */
export function updateAnchorPosition(
  position: Context7Position,
  anchor: Element | null,
  panel?: HTMLElement | null,
  rootStyle?: CSSStyleDeclaration
): void {
  if (position !== 'anchor' || !anchor || !panel || !rootStyle) return;

  const rect = anchor.getBoundingClientRect();
  rootStyle.removeProperty('--c7-anchor-max-height');
  rootStyle.removeProperty('--c7-anchor-max-width');
  const panelWidth = panel.offsetWidth || 400;
  const panelHeight = panel.offsetHeight || 600;
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth || panelWidth;
  const viewportHeight = viewport?.height || window.innerHeight || document.documentElement.clientHeight || panelHeight;
  const { left, maxHeight, maxWidth, origin, placement, top } = resolveContext7AnchorLayout({
    anchor: rect,
    panelHeight,
    panelWidth,
    viewportHeight,
    viewportLeft: viewport?.offsetLeft,
    viewportTop: viewport?.offsetTop,
    viewportWidth
  });
  rootStyle.setProperty('--c7-anchor-left', `${left}px`);
  rootStyle.setProperty('--c7-anchor-max-height', `${maxHeight}px`);
  rootStyle.setProperty('--c7-anchor-max-width', `${maxWidth}px`);
  rootStyle.setProperty('--c7-anchor-top', `${top}px`);
  rootStyle.setProperty('--c7-anchor-origin', origin);
  rootStyle.setProperty('--c7-anchor-translate-y', placement === 'top' ? '8px' : '-8px');
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

export function isContext7WidgetTriggerElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element;
}

export function resolveContext7CustomTrigger(
  trigger: Context7WidgetTrigger,
  warnInvalidSelector = true
): Context7CustomTriggerResolution {
  if (isContext7WidgetTriggerElement(trigger)) {
    return {
      element: trigger,
      invalidSelector: false,
      selector: ''
    };
  }

  try {
    return {
      element: document.querySelector(trigger),
      invalidSelector: false,
      selector: trigger
    };
  } catch {
    if (warnInvalidSelector) console.warn(`[Context7 Widget] Invalid custom trigger selector: ${trigger}`);
    return {
      element: null,
      invalidSelector: true,
      selector: trigger
    };
  }
}

export function querySelectorSafely(selector: string): Element | null {
  return resolveContext7CustomTrigger(selector).element;
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
