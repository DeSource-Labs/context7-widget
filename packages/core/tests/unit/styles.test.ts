import { describe, expect, it } from 'vitest';
import { normalizeShadowHostSelectors } from '../../src/styles';

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
});
