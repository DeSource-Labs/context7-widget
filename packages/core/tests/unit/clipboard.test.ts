import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyContext7Text } from '../../src/kit';

describe('clipboard helper', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the asynchronous Clipboard API when available', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyContext7Text('answer')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('answer');
  });

  it('falls back to a temporary textarea and reports copy failures', async () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    vi.stubGlobal('navigator', {});

    await expect(copyContext7Text('fallback')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();

    execCommand.mockImplementation(() => {
      throw new Error('blocked');
    });
    await expect(copyContext7Text('blocked')).resolves.toBe(false);
    await expect(copyContext7Text('')).resolves.toBe(false);
  });
});
