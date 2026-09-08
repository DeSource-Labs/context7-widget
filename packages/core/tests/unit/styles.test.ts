import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeShadowHostSelectors } from '@src/styles';

const widgetStylesSource = readFileSync(resolve(process.cwd(), '../../common/styles/_widget.scss'), 'utf8');

describe('core shadow stylesheet', () => {
  it('uses functional host selectors for every attribute-dependent state', () => {
    const styles = normalizeShadowHostSelectors(`
      :host[open] .c7-panel {}
      :host[theme='dark'][preset='minimal'] {}
      :host .c7-panel {}
    `);

    expect(styles).toContain(':host([open]) .c7-panel');
    expect(styles).toContain(":host([theme='dark'][preset='minimal'])");
    expect(styles).toContain(':host .c7-panel');
    expect(styles).not.toMatch(/:host\[[^\]]+]/);
  });

  it('keeps light-theme accent presets readable with white foreground text', () => {
    const defaultAccent = '#047857';
    const glassAccent = '#0f766e';

    expect(widgetStylesSource).toMatch(/--c7-accent:\s*#047857/);
    expect(contrastRatio(defaultAccent, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(glassAccent, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(widgetStylesSource).toMatch(/preset=(?:'glass'|glass)[\s\S]*?--c7-accent:\s*#0f766e/);
    expect(widgetStylesSource).toMatch(
      /preset=(?:'glass'|glass)[\s\S]*?--c7-launcher-background:\s*var\(--c7-accent\)/
    );
  });
});

function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red = 0, green = 0, blue = 0] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}
