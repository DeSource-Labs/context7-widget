import { describe, expect, it } from 'vitest';
import { trapFocus } from '../../src/kit';

describe('DOM accessibility helpers', () => {
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
});

function makeVisible(...elements: HTMLElement[]): void {
  for (const element of elements) {
    Object.defineProperty(element, 'offsetParent', {
      configurable: true,
      value: element.parentElement
    });
  }
}
