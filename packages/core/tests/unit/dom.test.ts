import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertBrowser,
  cancelRenderFrame,
  captureTriggerAccessibility,
  querySelectorSafely,
  requestRenderFrame,
  resolveTarget,
  restoreTriggerAccessibility,
  trapFocus
} from '../../src/kit';

describe('DOM accessibility helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('traps focus within a shadow-root dialog instead of including its launcher', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const launcher = document.createElement('button');
    const panel = document.createElement('section');
    const first = document.createElement('button');
    const last = document.createElement('a');
    last.href = 'https://context7.com';
    panel.append(first, last);
    root.append(panel, launcher);
    document.body.append(host);

    makeVisible(first, last, launcher);

    first.focus();
    const backwards = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab', shiftKey: true });
    trapFocus(backwards, panel);
    expect(backwards.defaultPrevented).toBe(true);
    expect(root.activeElement).toBe(last);

    const forwards = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab' });
    trapFocus(forwards, panel);
    expect(forwards.defaultPrevented).toBe(true);
    expect(root.activeElement).toBe(first);
  });

  it('supports a shadow root as the focus-trap container and ignores empty containers', () => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    const panel = document.createElement('section');
    const first = document.createElement('button');
    const last = document.createElement('button');
    panel.append(first, last);
    root.append(panel);
    document.body.append(host);
    makeVisible(first, last);

    last.focus();
    const forwards = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab' });
    trapFocus(forwards, root);

    expect(forwards.defaultPrevented).toBe(true);
    expect(root.activeElement).toBe(first);

    const empty = document.createElement('div');
    const untouched = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab' });
    trapFocus(untouched, empty);
    expect(untouched.defaultPrevented).toBe(false);
  });

  it('preserves and restores an external trigger accessibility contract', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-expanded', 'mixed');
    trigger.setAttribute('aria-haspopup', 'menu');
    const state = captureTriggerAccessibility(trigger);

    trigger.setAttribute('aria-controls', 'widget-panel');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-haspopup', 'dialog');
    restoreTriggerAccessibility(state);

    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('mixed');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('warns and returns null for an invalid custom-trigger selector', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(querySelectorSafely('[')).toBeNull();
    expect(warn).toHaveBeenCalledWith('[Context7 Widget] Invalid custom trigger selector: [');
  });

  it('uses timer fallbacks when animation-frame APIs are unavailable', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', undefined);
    vi.stubGlobal('cancelAnimationFrame', undefined);
    const cancelledCallback = vi.fn();
    const completedCallback = vi.fn();
    const clearTimeout = vi.spyOn(window, 'clearTimeout');

    const cancelledFrame = requestRenderFrame(cancelledCallback);
    cancelRenderFrame(cancelledFrame);
    vi.advanceTimersByTime(16);

    expect(clearTimeout).toHaveBeenCalledWith(cancelledFrame);
    expect(cancelledCallback).not.toHaveBeenCalled();

    requestRenderFrame(completedCallback);
    vi.advanceTimersByTime(16);
    expect(completedCallback).toHaveBeenCalledOnce();
    expect(completedCallback).toHaveBeenCalledWith(expect.any(Number));

    clearTimeout.mockClear();
    cancelRenderFrame(null);
    expect(clearTimeout).not.toHaveBeenCalled();
  });

  it('resolves direct targets and reports use without a browser document', () => {
    const target = document.createDocumentFragment();
    expect(resolveTarget(target)).toBe(target);

    const browserDocument = document;
    vi.stubGlobal('document', undefined);
    expect(assertBrowser).toThrow('Context7 widget helpers require a browser document.');
    vi.stubGlobal('document', browserDocument);
  });
});

function makeVisible(...elements: HTMLElement[]): void {
  for (const element of elements) {
    Object.defineProperty(element, 'offsetParent', {
      configurable: true,
      value: element.parentElement
    });
  }
}
