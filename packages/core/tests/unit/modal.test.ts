import { afterEach, describe, expect, it } from 'vitest';
import { acquireContext7Modal } from '@src/kit';

describe('modal isolation helper', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.removeAttribute('style');
  });

  it('inerts outside branches, locks scrolling, and restores authored state', () => {
    const existingInert = document.createElement('aside');
    existingInert.inert = true;
    existingInert.setAttribute('inert', '');
    const app = document.createElement('main');
    const widget = document.createElement('div');
    const sibling = document.createElement('button');
    app.append(sibling, widget);
    document.body.append(existingInert, app);
    document.body.style.overflow = 'auto';

    const release = acquireContext7Modal(widget);

    expect(existingInert.inert).toBe(true);
    expect(app.inert).toBeFalsy();
    expect(sibling.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    release();
    release();
    expect(existingInert.inert).toBe(true);
    expect(sibling.inert).toBeFalsy();
    expect(sibling.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('auto');
  });

  it('reference-counts multiple modal acquisitions', () => {
    const widget = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(outside, widget);

    const releaseFirst = acquireContext7Modal(widget);
    const releaseSecond = acquireContext7Modal(widget);
    releaseFirst();
    expect(outside.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    releaseSecond();
    expect(outside.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('');
  });

  it('supports detached documents without a browsing context', () => {
    const detached = document.implementation.createHTMLDocument('Detached');
    const outside = detached.createElement('button');
    const widget = detached.createElement('div');
    detached.body.append(outside, widget);

    const release = acquireContext7Modal(widget);
    expect(outside.inert).toBe(true);
    expect(detached.body.style.overflow).toBe('hidden');

    release();
    expect(outside.inert).toBeFalsy();
    expect(detached.body.style.overflow).toBe('');
  });
});
