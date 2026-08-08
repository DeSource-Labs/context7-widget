import { CONTEXT7_URL, DESOURCE_LABS_URL, deSourceLabsLogoUrl } from '../shared/consts.js';

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
      <svg class="c7-brand-logo c7-brand-logo--context7" aria-hidden="true" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="4" fill="currentColor"></rect>
        <path d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z" fill="var(--c7-footer-background, #000000)"></path>
        <path d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z" fill="var(--c7-footer-background, #000000)"></path>
        <path d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z" fill="var(--c7-footer-background, #000000)"></path>
        <path d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0445 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z" fill="var(--c7-footer-background, #000000)"></path>
      </svg>
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
