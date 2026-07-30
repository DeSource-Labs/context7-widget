import { afterEach, describe, expect, it, vi } from 'vitest';

describe('auto entrypoint', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.resetModules();
    setReadyState('complete');
  });

  it('mounts immediately when the document is already ready', async () => {
    setReadyState('complete');
    document.body.append(createLoaderScript('/vercel/next.js'));

    await import('../../src/auto');

    expect(document.querySelector('context7-widget')?.getAttribute('library')).toBe('/vercel/next.js');
  });

  it('waits for DOMContentLoaded while the document is loading', async () => {
    setReadyState('loading');
    document.body.append(createLoaderScript('/desource-labs/context7-widget'));

    await import('../../src/auto');

    expect(document.querySelector('context7-widget')).toBeNull();

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.querySelector('context7-widget')?.getAttribute('library')).toBe('/desource-labs/context7-widget');
  });

  it('retains the matching script when multiple async installs wait for DOMContentLoaded', async () => {
    setReadyState('loading');
    document.body.append(createLoaderScript('/first/library'));
    await import('../../src/auto');

    vi.resetModules();
    document.body.append(createLoaderScript('/second/library'));
    await import('../../src/auto');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(
      Array.from(document.querySelectorAll('context7-widget'), (widget) => widget.getAttribute('library'))
    ).toEqual(['/first/library', '/second/library']);
  });
});

function createLoaderScript(library: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.setAttribute('data-library', library);
  return script;
}

function setReadyState(value: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value
  });
}
