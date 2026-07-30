import { findCurrentWidgetScript, mountContext7WidgetFromScript } from './loader.js';

function boot() {
  mountContext7WidgetFromScript(findCurrentWidgetScript());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
