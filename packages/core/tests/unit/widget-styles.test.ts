import { afterEach, describe, expect, it, vi } from 'vitest';

const originalAdoptedStyleSheets = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets');

describe('widget style-sheet adoption', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();

    if (originalAdoptedStyleSheets) {
      Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', originalAdoptedStyleSheets);
    } else {
      Reflect.deleteProperty(ShadowRoot.prototype, 'adoptedStyleSheets');
    }
  });

  it('reuses one constructable style sheet when the browser supports it', async () => {
    const replaceSync = vi.fn();
    class ConstructableStyleSheet {
      replaceSync(styles: string): void {
        replaceSync(styles);
      }
    }
    vi.stubGlobal('CSSStyleSheet', ConstructableStyleSheet);
    const adoptedSheets = installAdoptedStyleSheetsSupport();
    vi.resetModules();
    const { defineContext7Widget } = await import('../../src/widget-element');
    defineContext7Widget('context7-adopted-styles');

    const first = document.createElement('context7-adopted-styles');
    const second = document.createElement('context7-adopted-styles');
    document.body.append(first, second);

    const firstSheets = adoptedSheets.get(first.shadowRoot as ShadowRoot);
    const secondSheets = adoptedSheets.get(second.shadowRoot as ShadowRoot);
    expect(replaceSync).toHaveBeenCalledOnce();
    expect(replaceSync).toHaveBeenCalledWith(expect.any(String));
    expect(first.shadowRoot?.querySelector('style')).toBeNull();
    expect(second.shadowRoot?.querySelector('style')).toBeNull();
    expect(firstSheets).toHaveLength(1);
    expect(secondSheets).toEqual(firstSheets);
  });

  it('falls back to inline styles after constructable style-sheet adoption fails', async () => {
    const replaceSync = vi.fn((_styles: string) => {
      throw new Error('Constructable styles are blocked');
    });
    class BrokenStyleSheet {
      replaceSync(styles: string): void {
        replaceSync(styles);
      }
    }
    vi.stubGlobal('CSSStyleSheet', BrokenStyleSheet);
    installAdoptedStyleSheetsSupport();
    vi.resetModules();
    const { defineContext7Widget } = await import('../../src/widget-element');
    defineContext7Widget('context7-inline-styles');

    const first = document.createElement('context7-inline-styles');
    const second = document.createElement('context7-inline-styles');
    document.body.append(first, second);

    expect(replaceSync).toHaveBeenCalledOnce();
    expect(first.shadowRoot?.querySelector('style')).not.toBeNull();
    expect(second.shadowRoot?.querySelector('style')).not.toBeNull();
  });
});

function installAdoptedStyleSheetsSupport(): WeakMap<ShadowRoot, unknown[]> {
  const adoptedSheets = new WeakMap<ShadowRoot, unknown[]>();

  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    configurable: true,
    get(this: ShadowRoot) {
      return adoptedSheets.get(this) ?? [];
    },
    set(this: ShadowRoot, value: unknown[]) {
      adoptedSheets.set(this, value);
    }
  });

  return adoptedSheets;
}
