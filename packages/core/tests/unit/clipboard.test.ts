import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../../src/kit';

describe('clipboard helper', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the asynchronous Clipboard API when available', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('answer')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('answer');
  });

  it('returns false when Clipboard API not available', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined });

    await expect(copyText('answer')).resolves.toBe(false);
  });

  it('returns false when Clipboard API throws an error', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('Clipboard API error');
    });
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('answer')).resolves.toBe(false);
  });

  it('trims whitespace from the text before copying', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('  answer  ')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('answer');
  });

  it('returns false when the text is empty or whitespace only', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('')).resolves.toBe(false);
    await expect(copyText('   ')).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});
