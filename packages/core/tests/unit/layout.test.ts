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
      origin: 'bottom right',
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
      origin: 'top right',
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
      origin: 'bottom right',
      top: 12
    });
  });
});
