import { expect } from 'vitest';

export function expectAlwaysVisibleBranding(container: ParentNode): void {
  const context7 = container.querySelector<HTMLAnchorElement>('[aria-label="Powered by Context7"]');
  const deSourceLabs = container.querySelector<HTMLAnchorElement>('[aria-label="Enhanced by DeSource Labs"]');

  expect(context7?.href).toBe('https://context7.com/');
  expect(context7?.querySelector('svg')).toBeTruthy();
  expect(deSourceLabs?.href).toBe('https://desource-labs.org/');
  expect(deSourceLabs?.querySelector('img')).toBeTruthy();
  expect(context7?.closest('[part~="footer"]')).toBe(deSourceLabs?.closest('[part~="footer"]'));
}
