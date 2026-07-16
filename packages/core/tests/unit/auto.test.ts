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
