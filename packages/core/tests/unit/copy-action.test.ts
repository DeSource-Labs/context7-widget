import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContext7CopyActionController, syncContext7CopyButton } from '@src/copy-action';

describe('copy action controller', () => {
  it('keeps a new pending write protected when an older write settles after reset', async () => {
    const completions: ((copied: boolean) => void)[] = [];
    const copy = vi.fn(() => new Promise<boolean>((resolve) => completions.push(resolve)));
    const actions = createContext7CopyActionController<string>({ copy, onChange: vi.fn() });
    const stale = actions.copy('answer', 'Old answer');
    actions.reset();
    const current = actions.copy('answer', 'New answer');
    completions[0]?.(true);
    await expect(stale).resolves.toBe(false);

    const duplicate = actions.copy('answer', 'New answer');
    const calls = copy.mock.calls.length;
    completions.slice(1).forEach((finish) => finish(true));
    await current;
    await expect(duplicate).resolves.toBe(false);
    expect(calls).toBe(2);
    actions.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('deduplicates pending and copied clicks, then resets after the feedback delay', async () => {
    vi.useFakeTimers();
    let finishCopy: ((copied: boolean) => void) | undefined;
    const copy = vi.fn(
      async () =>
        await new Promise<boolean>((resolve) => {
          finishCopy = resolve;
        })
    );
    const onChange = vi.fn();
    const actions = createContext7CopyActionController<string>({ copy, delay: 1600, onChange });

    const first = actions.copy('answer', '  answer text  ');
    await expect(actions.copy('answer', 'answer text')).resolves.toBe(false);
    expect(copy).toHaveBeenCalledOnce();
    expect(copy).toHaveBeenCalledWith('answer text');

    finishCopy?.(true);
    await expect(first).resolves.toBe(true);
    expect(actions.isCopied('answer')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('answer', true);
    await expect(actions.copy('answer', 'answer text')).resolves.toBe(false);
    expect(copy).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1599);
    expect(actions.isCopied('answer')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(actions.isCopied('answer')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith('answer', false);
  });

  it('handles empty values, failures, independent keys, reset, and stale writes', async () => {
    vi.useFakeTimers();
    let finishStaleCopy: ((copied: boolean) => void) | undefined;
    const copy = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockImplementationOnce(
        async () =>
          await new Promise<boolean>((resolve) => {
            finishStaleCopy = resolve;
          })
      );
    const onChange = vi.fn();
    const actions = createContext7CopyActionController<string>({ copy, delay: -1, onChange });

    await expect(actions.copy('empty', '  ')).resolves.toBe(false);
    await expect(actions.copy('failed', 'failed')).resolves.toBe(false);
    await expect(actions.copy('answer', 'answer')).resolves.toBe(true);
    await expect(actions.copy('code', 'code')).resolves.toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);

    actions.reset();
    expect(onChange).toHaveBeenCalledWith('answer', false);
    expect(onChange).toHaveBeenCalledWith('code', false);

    const stale = actions.copy('stale', 'stale');
    actions.reset(false);
    finishStaleCopy?.(true);
    await expect(stale).resolves.toBe(false);
    expect(actions.isCopied('stale')).toBe(false);
  });

  it('synchronizes icon-only button feedback and accessible labels', () => {
    const button = document.createElement('button');
    const status = document.createElement('span');
    status.className = 'c7-copy-status';
    status.setAttribute('aria-live', 'polite');
    button.append(status);

    syncContext7CopyButton(button, true, 'Copy answer', 'Copied');
    expect(button.hasAttribute('data-c7-copied')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Copied');
    expect(button.title).toBe('Copied');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Copied');

    syncContext7CopyButton(button, false, 'Copy answer', 'Copied');
    expect(button.hasAttribute('data-c7-copied')).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Copy answer');
    expect(status.textContent).toBe('');

    syncContext7CopyButton(document.createElement('button'), false, 'Copy code', 'Copied');
  });
});
