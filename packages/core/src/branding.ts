import context7LogoSource from './logos/context7.svg?raw';
import deSourceLabsLogoSource from './logos/desourcelabs.png?inline';

export const CONTEXT7_URL = 'https://context7.com';
export const DESOURCE_LABS_URL = 'https://desource-labs.org';

export const context7LogoSvg = context7LogoSource;

export const deSourceLabsLogoUrl = deSourceLabsLogoSource;

export function renderWidgetBranding(): string {
  return `
    <a
      class="c7-brand-link"
      href="${CONTEXT7_URL}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by Context7"
      title="Powered by Context7"
    >
      <span class="c7-brand-prefix">Powered by</span>
      ${context7LogoSvg}
    </a>
    <span class="c7-brand-separator" aria-hidden="true">·</span>
    <a
      class="c7-brand-link"
      href="${DESOURCE_LABS_URL}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enhanced by DeSource Labs"
      title="Enhanced by DeSource Labs"
    >
      <span class="c7-brand-prefix">Enhanced by</span>
      <img class="c7-brand-logo c7-brand-logo--desource" src="${deSourceLabsLogoUrl}" alt="" />
    </a>
  `;
}
