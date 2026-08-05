import { describe, expect, it } from 'vitest';
import { resolveContext7AnchorLayout } from '../../src';

describe('resolveContext7AnchorLayout', () => {
  it('opens above an end-aligned trigger when space is available', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 840, left: 700, right: 840, top: 784 },
        panelHeight: 300,
        panelWidth: 400,
        viewportHeight: 900,
        viewportWidth: 1200
      })
    ).toEqual({
      left: 440,
      maxHeight: 760,
      maxWidth: 1176,
      origin: 'bottom right',
      placement: 'top',
      top: 472
    });
  });

  it('opens below and clamps the panel to viewport margins', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 88, left: 4, right: 104, top: 40 },
        panelHeight: 300,
        panelWidth: 400,
        viewportHeight: 900,
        viewportWidth: 380
      })
    ).toEqual({
      left: 12,
      maxHeight: 788,
      maxWidth: 356,
      origin: 'top right',
      placement: 'bottom',
      top: 100
    });
  });

  it('chooses the side with more room when neither side fully fits', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 530, left: 300, right: 400, top: 490 },
        panelHeight: 600,
        panelWidth: 360,
        viewportHeight: 700,
        viewportWidth: 800
      })
    ).toMatchObject({
      maxHeight: 466,
      origin: 'bottom right',
      placement: 'top',
      top: 12
    });
  });

  it('prefers opening above when the requested height fits on both sides', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 460, left: 500, right: 600, top: 420 },
        panelHeight: 300,
        panelWidth: 400,
        viewportHeight: 900,
        viewportWidth: 1200
      })
    ).toMatchObject({
      maxHeight: 396,
      placement: 'top',
      top: 108
    });
  });

  it('sizes a panel to the chosen side instead of overlapping its trigger', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 320, left: 350, right: 450, top: 280 },
        panelHeight: 500,
        panelWidth: 400,
        viewportHeight: 600,
        viewportWidth: 800
      })
    ).toMatchObject({
      maxHeight: 256,
      placement: 'top',
      top: 12
    });
  });

  it('uses visual viewport offsets when the visible viewport is shifted', () => {
    expect(
      resolveContext7AnchorLayout({
        anchor: { bottom: 640, left: 300, right: 380, top: 600 },
        panelHeight: 300,
        panelWidth: 400,
        viewportHeight: 500,
        viewportLeft: 30,
        viewportTop: 200,
        viewportWidth: 320
      })
    ).toEqual({
      left: 42,
      maxHeight: 376,
      maxWidth: 296,
      origin: 'bottom right',
      placement: 'top',
      top: 288
    });
  });
});
