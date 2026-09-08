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

  it.each([false, true])('keeps separate modal branches interactive (close first: %s)', (closeFirst) => {
    const firstBranch = document.createElement('section');
    const secondBranch = document.createElement('section');
    const first = document.createElement('div');
    const second = document.createElement('div');
    const outside = document.createElement('button');
    firstBranch.append(first);
    secondBranch.append(second);
    document.body.append(firstBranch, secondBranch, outside);

    const releaseFirst = acquireContext7Modal(first);
    expect(secondBranch.inert).toBe(true);
    const releaseSecond = acquireContext7Modal(second);
    try {
      expect(firstBranch.inert).toBeFalsy();
      expect(secondBranch.inert).toBeFalsy();
      expect(outside.inert).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');

      (closeFirst ? releaseFirst : releaseSecond)();
      expect((closeFirst ? firstBranch : secondBranch).inert).toBe(true);
      expect((closeFirst ? secondBranch : firstBranch).inert).toBeFalsy();
      expect(outside.inert).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    } finally {
      releaseSecond();
      releaseFirst();
    }
    expect(firstBranch.inert).toBeFalsy();
    expect(secondBranch.inert).toBeFalsy();
    expect(outside.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('');
  });

  it('releases nested active branches after their container is removed', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const outside = document.createElement('button');
    outer.append(inner);
    document.body.append(outer, outside);
    const releaseOuter = acquireContext7Modal(outer);
    const releaseInner = acquireContext7Modal(inner);
    outer.remove();
    releaseOuter();
    expect(outside.inert).toBe(true);
    releaseInner();
    expect(outside.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('');

    document.body.append(outer);
    const releaseOutside = acquireContext7Modal(outside);
    try {
      expect(outer.inert).toBe(true);
    } finally {
      releaseOutside();
    }
    expect(outer.inert).toBeFalsy();
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
