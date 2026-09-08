import { defineContext7Widget, type Context7WidgetElement } from '../src/index.js';

defineContext7Widget();

const widget = requireElement<Context7WidgetElement>('context7-widget');
const managedTrigger = requireElement<HTMLButtonElement>('#demo-managed-trigger');
const triggerParent = managedTrigger.parentElement;
const externalTrigger = requireElement<HTMLButtonElement>('[data-testid="external-trigger"]');
const eventLog = requireElement<HTMLElement>('[data-testid="event-log"]');
const stats = {
  answerComplete: 0,
  cancel: 0,
  close: 0,
  error: 0,
  firstToken: 0,
  open: 0,
  question: 0,
  toolCall: 0,
  toolResult: 0
};

bindAttributeControl('theme', 'theme');
bindAttributeControl('preset', 'preset');
bindAttributeControl('position', 'position');
bindAttributeControl('panel-width', 'panel-width');
bindAttributeControl('panel-height', 'panel-height');
bindAttributeControl('accent', 'color');
bindBooleanControl('backdrop', 'backdrop');
bindBooleanControl('close-outside', 'close-on-outside-click');

requireElement<HTMLSelectElement>('[data-testid="trigger-mode"]').addEventListener('change', (event) => {
  const mode = (event.currentTarget as HTMLSelectElement).value;
  managedTrigger.hidden = mode !== 'managed';
  externalTrigger.hidden = mode !== 'external';

  if (mode === 'managed') {
    if (!managedTrigger.isConnected) triggerParent?.prepend(managedTrigger);
    widget.setAttribute('custom-trigger', '#demo-managed-trigger');
  } else {
    managedTrigger.remove();
    if (mode === 'external') widget.setAttribute('custom-trigger', '#demo-external-trigger');
    else widget.removeAttribute('custom-trigger');
  }
});

requireElement<HTMLButtonElement>('[data-testid="programmatic-send"]').addEventListener('click', () => {
  void widget.send('Show me Context7 Widget setup.');
});

for (const [eventName, stat] of [
  ['c7:open', 'open'],
  ['c7:close', 'close'],
  ['c7:cancel', 'cancel'],
  ['c7:question', 'question'],
  ['c7:first-token', 'firstToken'],
  ['c7:answer-complete', 'answerComplete'],
  ['c7:tool-call', 'toolCall'],
  ['c7:tool-result', 'toolResult'],
  ['c7:error', 'error']
] as const) {
  widget.addEventListener(eventName, () => {
    stats[stat] += 1;
    renderStats();
  });
}

renderStats();

function bindAttributeControl(testId: string, attribute: string): void {
  requireElement<HTMLInputElement | HTMLSelectElement>(`[data-testid="${testId}"]`).addEventListener(
    'input',
    (event) => {
      const value = (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
      if (value) widget.setAttribute(attribute, value);
      else widget.removeAttribute(attribute);
    }
  );
}

function bindBooleanControl(testId: string, attribute: string): void {
  requireElement<HTMLInputElement>(`[data-testid="${testId}"]`).addEventListener('change', (event) => {
    widget.setAttribute(attribute, String((event.currentTarget as HTMLInputElement).checked));
  });
}

function renderStats(): void {
  eventLog.textContent = `open:${stats.open} close:${stats.close} cancel:${stats.cancel} question:${stats.question} firstToken:${stats.firstToken} answerComplete:${stats.answerComplete} toolCall:${stats.toolCall} toolResult:${stats.toolResult} error:${stats.error}`;
}

function requireElement<ElementType extends Element>(selector: string): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Core demo is missing ${selector}.`);
  return element;
}
