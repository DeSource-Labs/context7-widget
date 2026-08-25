import { describe, expect, it } from 'vitest';

describe('public entry', () => {
  it('imports without browser globals and exposes only intended runtime API', async () => {
    const entry = await import('../../src/index.js');
    expect(Object.keys(entry).sort()).toEqual(['Context7Widget', 'createContext7Widget']);
  });
});
