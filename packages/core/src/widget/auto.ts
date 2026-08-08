import { findCurrentWidgetScript, mountContext7WidgetFromScript } from './loader.js';

// Capture the executing script while document.currentScript still points to it.
// Multiple async widget scripts can otherwise all resolve the last candidate
// after waiting for DOMContentLoaded.
const widgetScript = findCurrentWidgetScript();

function boot() {
  mountContext7WidgetFromScript(widgetScript);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
