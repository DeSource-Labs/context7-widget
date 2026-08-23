import { describe, expect, it, vi } from 'vitest';
import { callContext7ListenerSafely } from '../../src/kit';

describe('safe public listeners', () => {
  it('reports callback failures through the browser error reporter', () => {
    const error = new Error('consumer failed');
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);

    expect(() =>
      callContext7ListenerSafely(() => {
        throw error;
      }, undefined)
    ).not.toThrow();
    expect(reportError).toHaveBeenCalledWith(error);
  });

  it('falls back to the console error reporter', () => {
    const error = new Error('consumer failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('reportError', undefined);

    callContext7ListenerSafely(() => {
      throw error;
    }, undefined);

    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
