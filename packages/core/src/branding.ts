import context7LogoSource from './logos/context7.svg?raw';
import deSourceLabsLogoSource from './logos/desourcelabs.png?inline';

export const CONTEXT7_URL = 'https://context7.com';
export const DESOURCE_LABS_URL = 'https://desource-labs.org';

export const context7LogoSvg = context7LogoSource
  .replace('viewBox="0 0 116 28"', 'viewBox="0 0 28 28"')
  .replace('<svg ', '<svg class="c7-brand-logo c7-brand-logo--context7" aria-hidden="true" ');

export const deSourceLabsLogoUrl = deSourceLabsLogoSource;

export function renderWidgetBranding(): string {
  return `
    <span class="c7-brand-prefix">Powered by</span>
    <a
      class="c7-brand-link"
      href="${CONTEXT7_URL}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by Context7"
      title="Powered by Context7"
    >
      ${context7LogoSvg}
    </a>
    <span class="c7-brand-separator" aria-hidden="true">·</span>
    <span class="c7-brand-prefix">Enhanced by</span>
    <a
      class="c7-brand-link"
      href="${DESOURCE_LABS_URL}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enhanced by DeSource Labs"
      title="Enhanced by DeSource Labs"
    >
      <img class="c7-brand-logo c7-brand-logo--desource" src="${deSourceLabsLogoUrl}" alt="" />
    </a>
  `;
}
