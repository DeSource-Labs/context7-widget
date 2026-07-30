import { afterEach, describe, expect, it, vi } from 'vitest';
import { findCurrentWidgetScript, mountContext7WidgetFromScript } from '../../src/loader';

describe('script loader', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('mounts a widget from script data attributes and keeps welcome-message compatibility', () => {
    const script = document.createElement('script');
    script.setAttribute('data-library', '/vercel/next.js');
    script.setAttribute('data-color', '#111827');
    script.setAttribute('data-position', 'center');
    script.setAttribute('data-welcome-message', 'Legacy welcome');
    script.setAttribute('data-widget-id', 'docs');
    document.body.append(script);

    const widget = mountContext7WidgetFromScript(script);

    expect(widget?.tagName).toBe('CONTEXT7-WIDGET');
    expect(widget?.getAttribute('library')).toBe('/vercel/next.js');
    expect(widget?.getAttribute('color')).toBe('#111827');
    expect(widget?.getAttribute('position')).toBe('center');
    expect(widget?.getAttribute('initial-message')).toBe('Legacy welcome');
    expect(widget?.hasAttribute('data-welcome-message')).toBe(false);
    expect(script.dataset.c7Mounted).toBe('true');
  });

  it('prefers the current initial-message attribute over the legacy welcome alias', () => {
    const script = document.createElement('script');
    script.setAttribute('data-library', '/vercel/next.js');
    script.setAttribute('data-initial-message', 'Current welcome');
    script.setAttribute('data-welcome-message', 'Legacy welcome');
    document.body.append(script);

    const widget = mountContext7WidgetFromScript(script);

    expect(widget?.getAttribute('initial-message')).toBe('Current welcome');
  });

  it('does not mount twice from the same script', () => {
    const script = document.createElement('script');
    script.setAttribute('data-library', '/desource-labs/context7-widget');
    document.body.append(script);

    expect(mountContext7WidgetFromScript(script)).toBeTruthy();
    expect(mountContext7WidgetFromScript(script)).toBeNull();
    expect(document.querySelectorAll('context7-widget')).toHaveLength(1);
  });

  it('warns and skips scripts without data-library', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const script = document.createElement('script');

    expect(mountContext7WidgetFromScript(script)).toBeNull();
    expect(warn).toHaveBeenCalledWith('[Context7 Widget] Missing data-library attribute.');
  });

  it('finds the latest script candidate when document.currentScript is unavailable', () => {
    const first = document.createElement('script');
    first.setAttribute('data-library', '/first/repo');
    const second = document.createElement('script');
    second.setAttribute('data-library', '/second/repo');
    document.body.append(first, second);

    expect(findCurrentWidgetScript()).toBe(second);
  });

  it('prefers the current script when it declares a library', () => {
    const current = document.createElement('script');
    current.dataset.library = '/current/repo';
    document.body.append(current);
    vi.spyOn(document, 'currentScript', 'get').mockReturnValue(current);

    expect(findCurrentWidgetScript()).toBe(current);
  });
});
