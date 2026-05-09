export const widgetStyles = `
  :host {
    --c7-accent: #059669;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: transparent;
    --c7-border-color: #e7e5e4;
    --c7-control-background: #ffffff;
    --c7-control-border: #d6d3d1;
    --c7-control-color: #1c1917;
    --c7-error-background: #fef2f2;
    --c7-error-color: #991b1b;
    --c7-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --c7-footer-background: #fafaf9;
    --c7-focus-ring: color-mix(in srgb, var(--c7-accent) 22%, transparent);
    --c7-header-background: #fafaf9;
    --c7-launcher-background: var(--c7-accent);
    --c7-launcher-color: #ffffff;
    --c7-launcher-radius: 999px;
    --c7-launcher-shadow: 0 10px 28px rgba(15, 23, 42, 0.24);
    --c7-launcher-size: 56px;
    --c7-message-assistant-background: #f5f5f4;
    --c7-message-assistant-color: #1c1917;
    --c7-message-radius: 12px;
    --c7-message-user-background: var(--c7-accent);
    --c7-message-user-color: var(--c7-accent-contrast);
    --c7-muted-color: #78716c;
    --c7-panel-background: #ffffff;
    --c7-panel-color: #1c1917;
    --c7-panel-height: min(600px, calc(100vh - 120px));
    --c7-panel-radius: 16px;
    --c7-panel-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
    --c7-panel-width: min(400px, calc(100vw - 32px));
    --c7-spacing: 16px;
    --c7-z-index: 2147483647;

    all: initial;
    color: var(--c7-panel-color);
    font-family: var(--c7-font-family);
    position: relative;
    z-index: var(--c7-z-index);
  }

  :host([theme="dark"]) {
    --c7-border-color: rgba(255, 255, 255, 0.14);
    --c7-control-background: #0b0b0c;
    --c7-control-border: rgba(255, 255, 255, 0.2);
    --c7-control-color: #f8fafc;
    --c7-error-background: rgba(127, 29, 29, 0.32);
    --c7-error-color: #fecaca;
    --c7-footer-background: #0e0e10;
    --c7-header-background: #0e0e10;
    --c7-message-assistant-background: #171717;
    --c7-message-assistant-color: #f5f5f5;
    --c7-muted-color: #a1a1aa;
    --c7-panel-background: #050505;
    --c7-panel-color: #f8fafc;
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="auto"]) {
      --c7-border-color: rgba(255, 255, 255, 0.14);
      --c7-control-background: #0b0b0c;
      --c7-control-border: rgba(255, 255, 255, 0.2);
      --c7-control-color: #f8fafc;
      --c7-error-background: rgba(127, 29, 29, 0.32);
      --c7-error-color: #fecaca;
      --c7-footer-background: #0e0e10;
      --c7-header-background: #0e0e10;
      --c7-message-assistant-background: #171717;
      --c7-message-assistant-color: #f5f5f5;
      --c7-muted-color: #a1a1aa;
      --c7-panel-background: #050505;
      --c7-panel-color: #f8fafc;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  button, input {
    font: inherit;
  }

  .c7-backdrop {
    background: var(--c7-backdrop);
    inset: 0;
    pointer-events: none;
    position: fixed;
    z-index: var(--c7-z-index);
  }

  .c7-launcher {
    align-items: center;
    background: var(--c7-launcher-background);
    border: 0;
    border-radius: var(--c7-launcher-radius);
    bottom: 20px;
    box-shadow: var(--c7-launcher-shadow);
    color: var(--c7-launcher-color);
    cursor: pointer;
    display: flex;
    height: var(--c7-launcher-size);
    justify-content: center;
    padding: 0;
    position: fixed;
    right: 20px;
    transition: box-shadow 160ms ease, opacity 160ms ease, transform 160ms ease;
    width: var(--c7-launcher-size);
    z-index: calc(var(--c7-z-index) + 1);
  }

  .c7-launcher:hover {
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.3);
    transform: translateY(-1px);
  }

  .c7-launcher:focus-visible,
  .c7-close:focus-visible,
  .c7-send:focus-visible,
  .c7-input:focus-visible,
  .c7-tool-toggle:focus-visible {
    outline: 2px solid var(--c7-accent);
    outline-offset: 2px;
  }

  .c7-launcher svg {
    height: calc(var(--c7-launcher-size) * 0.5);
    width: calc(var(--c7-launcher-size) * 0.5);
  }

  :host([position="bottom-left"]) .c7-launcher,
  :host([data-position="bottom-left"]) .c7-launcher {
    left: 20px;
    right: auto;
  }

  :host([position="top-right"]) .c7-launcher,
  :host([data-position="top-right"]) .c7-launcher {
    bottom: auto;
    top: 20px;
  }

  :host([position="top-left"]) .c7-launcher,
  :host([data-position="top-left"]) .c7-launcher {
    bottom: auto;
    left: 20px;
    right: auto;
    top: 20px;
  }

  :host([hide-default-button]) .c7-launcher,
  :host([data-hide-default-button="true"]) .c7-launcher {
    display: none;
  }

  .c7-panel {
    background: var(--c7-panel-background);
    border: 1px solid var(--c7-border-color);
    border-radius: var(--c7-panel-radius);
    bottom: calc(20px + var(--c7-launcher-size) + 14px);
    box-shadow: var(--c7-panel-shadow);
    color: var(--c7-panel-color);
    display: flex;
    flex-direction: column;
    height: var(--c7-panel-height);
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: fixed;
    right: 20px;
    transform: translateY(12px) scale(0.98);
    transform-origin: bottom right;
    transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
    visibility: hidden;
    width: var(--c7-panel-width);
    z-index: calc(var(--c7-z-index) + 2);
  }

  :host([open]) .c7-panel {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
    visibility: visible;
  }

  :host([position="bottom-left"]) .c7-panel,
  :host([data-position="bottom-left"]) .c7-panel {
    left: 20px;
    right: auto;
    transform-origin: bottom left;
  }

  :host([position="top-right"]) .c7-panel,
  :host([data-position="top-right"]) .c7-panel {
    bottom: auto;
    top: calc(20px + var(--c7-launcher-size) + 14px);
    transform-origin: top right;
  }

  :host([position="top-left"]) .c7-panel,
  :host([data-position="top-left"]) .c7-panel {
    bottom: auto;
    left: 20px;
    right: auto;
    top: calc(20px + var(--c7-launcher-size) + 14px);
    transform-origin: top left;
  }

  .c7-header {
    align-items: center;
    background: var(--c7-header-background);
    border-bottom: 1px solid var(--c7-border-color);
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 14px 16px;
  }

  .c7-title {
    color: var(--c7-panel-color);
    font-size: 15px;
    font-weight: 650;
    line-height: 1.2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c7-close {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: var(--c7-muted-color);
    cursor: pointer;
    display: flex;
    height: 32px;
    justify-content: center;
    padding: 0;
    transition: background 120ms ease, color 120ms ease;
    width: 32px;
  }

  .c7-close:hover {
    background: color-mix(in srgb, var(--c7-muted-color) 12%, transparent);
    color: var(--c7-panel-color);
  }

  .c7-messages {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding: var(--c7-spacing);
    scrollbar-color: var(--c7-muted-color) transparent;
  }

  .c7-message {
    border-radius: var(--c7-message-radius);
    font-size: 14px;
    line-height: 1.5;
    max-width: 86%;
    overflow-wrap: anywhere;
    padding: 10px 13px;
  }

  .c7-message p {
    margin: 0 0 8px;
  }

  .c7-message p:last-child {
    margin-bottom: 0;
  }

  .c7-message ul,
  .c7-message ol {
    margin: 6px 0;
    padding-left: 20px;
  }

  .c7-message li {
    margin: 2px 0;
  }

  .c7-message code {
    background: color-mix(in srgb, var(--c7-muted-color) 18%, transparent);
    border-radius: 4px;
    font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 0.92em;
    padding: 1px 5px;
  }

  .c7-message pre {
    background: #111827;
    border-radius: 8px;
    color: #e5e7eb;
    font-size: 12px;
    margin: 8px 0;
    overflow-x: auto;
    padding: 10px;
  }

  .c7-message pre code {
    background: transparent;
    padding: 0;
  }

  .c7-message a {
    color: var(--c7-accent);
  }

  .c7-message--assistant {
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    color: var(--c7-message-assistant-color);
    border-bottom-left-radius: 4px;
  }

  .c7-message--user {
    align-self: flex-end;
    background: var(--c7-message-user-background);
    color: var(--c7-message-user-color);
    border-bottom-right-radius: 4px;
  }

  .c7-message--error {
    align-self: center;
    background: var(--c7-error-background);
    color: var(--c7-error-color);
    font-size: 13px;
    max-width: 92%;
  }

  .c7-tool-call {
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    border-bottom-left-radius: 4px;
    border-radius: var(--c7-message-radius);
    color: var(--c7-message-assistant-color);
    font-size: 13px;
    max-width: 92%;
    padding: 10px 13px;
  }

  .c7-tool-header {
    align-items: center;
    color: var(--c7-muted-color);
    display: flex;
    gap: 8px;
  }

  .c7-tool-header svg {
    flex: none;
    height: 14px;
    width: 14px;
  }

  .c7-spinner {
    animation: c7-spin 1s linear infinite;
  }

  .c7-tool-result {
    border-top: 1px solid var(--c7-border-color);
    margin-top: 8px;
    padding-top: 8px;
  }

  .c7-tool-toggle {
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--c7-accent);
    cursor: pointer;
    display: flex;
    gap: 4px;
    padding: 0;
  }

  .c7-tool-toggle svg {
    height: 14px;
    transition: transform 160ms ease;
    width: 14px;
  }

  .c7-tool-toggle[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }

  .c7-tool-content {
    margin-top: 8px;
  }

  .c7-tool-content pre {
    background: #111827;
    border-radius: 8px;
    color: #e5e7eb;
    font-size: 11px;
    line-height: 1.45;
    margin: 0;
    max-height: 220px;
    overflow: auto;
    padding: 10px;
    white-space: pre-wrap;
  }

  .c7-typing {
    align-items: center;
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    border-bottom-left-radius: 4px;
    border-radius: var(--c7-message-radius);
    display: flex;
    gap: 4px;
    padding: 12px 13px;
  }

  .c7-typing span {
    animation: c7-bounce 1.4s infinite ease-in-out both;
    background: var(--c7-muted-color);
    border-radius: 50%;
    height: 6px;
    width: 6px;
  }

  .c7-typing span:nth-child(1) { animation-delay: -0.32s; }
  .c7-typing span:nth-child(2) { animation-delay: -0.16s; }

  .c7-composer {
    align-items: center;
    background: var(--c7-footer-background);
    border-top: 1px solid var(--c7-border-color);
    display: flex;
    gap: 8px;
    padding: 12px;
  }

  .c7-input {
    background: var(--c7-control-background);
    border: 1px solid var(--c7-control-border);
    border-radius: 10px;
    color: var(--c7-control-color);
    flex: 1;
    font-size: 16px;
    min-width: 0;
    outline: none;
    padding: 10px 12px;
  }

  .c7-input:focus {
    border-color: var(--c7-accent);
    box-shadow: 0 0 0 3px var(--c7-focus-ring);
  }

  .c7-input::placeholder {
    color: var(--c7-muted-color);
  }

  .c7-send {
    background: var(--c7-accent);
    border: 0;
    border-radius: 10px;
    color: var(--c7-accent-contrast);
    cursor: pointer;
    flex: none;
    font-size: 14px;
    font-weight: 650;
    min-height: 42px;
    padding: 0 16px;
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .c7-send:hover {
    transform: translateY(-1px);
  }

  .c7-send:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
  }

  .c7-footer {
    align-items: center;
    background: var(--c7-footer-background);
    border-top: 1px solid var(--c7-border-color);
    display: flex;
    justify-content: center;
    min-height: 44px;
    padding: 8px 12px;
  }

  .c7-powered {
    align-items: center;
    color: var(--c7-muted-color);
    display: inline-flex;
    gap: 6px;
    font-size: 12px;
    text-decoration: none;
  }

  .c7-powered:hover {
    color: var(--c7-accent);
  }

  .c7-mark {
    align-items: center;
    background: var(--c7-panel-color);
    border-radius: 4px;
    color: var(--c7-panel-background);
    display: inline-flex;
    font-size: 10px;
    font-weight: 800;
    height: 20px;
    justify-content: center;
    line-height: 1;
    width: 20px;
  }

  @keyframes c7-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes c7-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .c7-launcher,
    .c7-panel,
    .c7-close,
    .c7-send,
    .c7-spinner,
    .c7-typing span {
      animation: none;
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .c7-panel {
      border-bottom: 0;
      border-left: 0;
      border-radius: var(--c7-panel-radius) var(--c7-panel-radius) 0 0;
      border-right: 0;
      bottom: 0;
      height: min(82vh, 720px);
      left: 0;
      max-height: calc(100vh - 12px);
      right: 0;
      top: auto;
      transform: translateY(100%);
      transform-origin: bottom center;
      width: 100vw;
    }

    :host([open]) .c7-panel {
      transform: translateY(0);
    }

    :host([position]) .c7-panel {
      left: 0;
      right: 0;
      top: auto;
    }

    .c7-launcher {
      bottom: 16px;
      right: 16px;
    }

    :host([position="bottom-left"]) .c7-launcher,
    :host([position="top-left"]) .c7-launcher,
    :host([data-position="bottom-left"]) .c7-launcher,
    :host([data-position="top-left"]) .c7-launcher {
      left: 16px;
      right: auto;
    }

    :host([position="top-right"]) .c7-launcher,
    :host([position="top-left"]) .c7-launcher,
    :host([data-position="top-right"]) .c7-launcher,
    :host([data-position="top-left"]) .c7-launcher {
      bottom: auto;
      top: 16px;
    }
  }
`;
