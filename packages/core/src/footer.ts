import { CONTEXT7_URL, DESOURCE_LABS_URL, context7LogoPath, deSourceLabsLogoUrl } from './config.js';

export function renderWidgetFooter(): string {
  return `
    <footer class="c7-footer" data-c7-footer part="footer">
      <span class="c7-branding" data-c7-branding part="powered-by">
        <a
          class="c7-brand-link"
          data-c7-context7-attribution
          href="${CONTEXT7_URL}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="c7-brand-prefix" data-c7-powered-by></span>
          <svg class="c7-brand-logo c7-brand-logo--context7" aria-hidden="true" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="4" fill="currentColor"></rect>
            <path d="${context7LogoPath}" fill="var(--c7-footer-background, #000)"></path>
          </svg>
        </a>
        <span class="c7-brand-separator" aria-hidden="true">·</span>
        <a
          class="c7-brand-link"
          data-c7-desource-attribution
          href="${DESOURCE_LABS_URL}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="c7-brand-prefix" data-c7-enhanced-by></span>
          <img class="c7-brand-logo c7-brand-logo--desource" src="${deSourceLabsLogoUrl}" alt="" />
        </a>
      </span>
    </footer>
  `;
}
