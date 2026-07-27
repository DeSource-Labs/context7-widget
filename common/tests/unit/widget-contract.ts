import { expect } from 'vitest';

export function expectAlwaysVisibleBranding(container: ParentNode): void {
  const context7 = container.querySelector<HTMLAnchorElement>('[aria-label="Powered by Context7"]');
  const deSourceLabs = container.querySelector<HTMLAnchorElement>('[aria-label="Enhanced by DeSource Labs"]');
  const branding = context7?.parentElement;
  const context7Logo = context7?.querySelector('svg.c7-brand-logo--context7');
  const deSourceLabsLogo = deSourceLabs?.querySelector('img.c7-brand-logo--desource');

  expect(context7?.href).toBe('https://context7.com/');
  expect(context7?.querySelector('.c7-brand-prefix')?.textContent).toBe('Powered by');
  expect(context7Logo?.parentElement).toBe(context7);
  expect(deSourceLabs?.href).toBe('https://desource-labs.org/');
  expect(deSourceLabs?.querySelector('.c7-brand-prefix')?.textContent).toBe('Enhanced by');
  expect(deSourceLabsLogo?.parentElement).toBe(deSourceLabs);
  expect(branding?.classList.contains('c7-branding')).toBe(true);
  expect(deSourceLabs?.parentElement).toBe(branding);
  expect(context7?.closest('[part~="footer"]')).toBe(deSourceLabs?.closest('[part~="footer"]'));
}
