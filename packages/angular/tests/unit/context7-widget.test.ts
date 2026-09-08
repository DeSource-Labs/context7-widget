import { Component, ElementRef, provideZonelessChangeDetection, type ComponentRef } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { expectAlwaysVisibleBranding } from '@common/tests/unit/widget-contract';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget } from '../../src/components/context7-widget';
import { Context7WidgetTrigger } from '../../src/directives/context7-widget-trigger';
import { provideContext7Widget } from '@src/provider';
import type { Context7WidgetState } from '@src/types';
import { TestResizeObserver } from '../setup';

const CHAT_ENDPOINT = 'https://context7.com/api/v2/widget/chat';

@Component({
  standalone: true,
  imports: [Context7Widget, Context7WidgetTrigger],
  template: `
    <context7-widget [customTrigger]="true" library="/owner/repo">
      <span context7WidgetTrigger>Projected trigger</span>
    </context7-widget>
  `
})
class ProjectedTriggerHost {}

describe('Context7Widget', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse())
    );
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders native Angular DOM, public attributes, branding, and ready detail', async () => {
    const fixture = createWidget({
      backdrop: true,
      closeOnOutsideClick: false,
      color: '#ff6f91',
      initialMessage: 'Hello **{library}**. Ask about {library}.',
      launcherLabel: 'Ask docs',
      launcherVariant: 'pill',
      library: '/owner/repo',
      linkBaseUrl: 'https://docs.example.com/',
      panelHeight: '500px',
      panelWidth: '520px',
      placeholder: 'Search docs',
      position: 'top-left',
      preset: 'terminal',
      theme: 'dark',
      title: 'Product docs',
      widgetId: 'docs'
    });
    const ready = vi.fn();
    fixture.componentInstance.ready.subscribe(ready);

    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.matches('context7-widget')).toBe(false);
    expect(host.classList).toContain('context7-widget');
    expect(host.getAttribute('library')).toBe('/owner/repo');
    expect(host.getAttribute('theme')).toBe('dark');
    expect(host.getAttribute('preset')).toBe('terminal');
    expect(host.getAttribute('position')).toBe('top-left');
    expect(host.getAttribute('color')).toBe('#ff6f91');
    expect(host.getAttribute('panel-width')).toBe('520px');
    expect(host.getAttribute('panel-height')).toBe('500px');
    expect(host.getAttribute('backdrop-active')).toBe('');
    expect(host.querySelector('.c7-title')?.textContent).toBe('Product docs');
    expect(host.querySelector('textarea')?.placeholder).toBe('Search docs');
    expect(host.querySelector('.c7-message--assistant strong')?.textContent).toBe('/owner/repo');
    expect(host.querySelector('.c7-message--assistant')?.textContent).toContain(
      'Hello /owner/repo. Ask about /owner/repo.'
    );
    expectAlwaysVisibleBranding(host);
    expect(ready).toHaveBeenCalledWith({ library: '/owner/repo', widget: host, widgetId: 'docs' });
  });

  it('supports built-in and Angular-managed trigger modes with focus restoration', async () => {
    const fixture = createWidget({ customTrigger: true, launcherLabel: 'Ask docs', library: '/owner/repo' });
    const opened = vi.fn();
    const closed = vi.fn();
    const openChange = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.openChange.subscribe(openChange);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('.context7-widget-trigger') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    await fixture.whenStable();
    await nextTask();

    expect(fixture.componentInstance.isOpen()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toMatch(/^context7-widget-panel-/);
    expect(fixture.nativeElement.querySelector('textarea')).toBe(document.activeElement);
    expect(opened).toHaveBeenCalledOnce();
    expect(openChange).toHaveBeenCalledWith(true);

    fixture.componentInstance.toggle();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(trigger).toBe(document.activeElement);
    expect(closed).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('customTrigger', undefined);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.context7-widget-trigger')).toBeNull();
    const launcher = fixture.nativeElement.querySelector('.c7-launcher') as HTMLButtonElement;
    launcher.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    (fixture.nativeElement.querySelector('.c7-close') as HTMLButtonElement).click();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('projects Angular-managed trigger content', async () => {
    const fixture = TestBed.createComponent(ProjectedTriggerHost);
    if (!fixture.nativeElement.isConnected) document.body.append(fixture.nativeElement);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('.context7-widget-trigger') as HTMLButtonElement;
    expect(trigger.textContent).toContain('Projected trigger');
    trigger.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('context7-widget')?.hasAttribute('open')).toBe(true);
  });

  it('honors controlled open state and relinquishes control', async () => {
    const fixture = createWidget({ library: '/owner/repo', open: false });
    const openChange = vi.fn();
    fixture.componentInstance.openChange.subscribe(openChange);
    await fixture.whenStable();

    fixture.componentInstance.open();
    expect(openChange).toHaveBeenCalledWith(true);
    expect(fixture.componentInstance.isOpen()).toBe(false);

    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);

    fixture.componentInstance.close();
    expect(openChange).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance.isOpen()).toBe(true);

    fixture.componentRef.setInput('open', undefined);
    await fixture.whenStable();
    fixture.componentInstance.close();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('binds selector, Element, and ElementRef triggers and restores authored ARIA', async () => {
    const external = document.createElement('button');
    external.id = 'docs-help';
    external.setAttribute('aria-expanded', 'mixed');
    document.body.append(external);
    const fixture = createWidget({ customTrigger: 'docs-help', library: '/owner/repo', position: 'anchor' });
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('custom-trigger')).toBe('#docs-help');
    expect(fixture.nativeElement.querySelector('.c7-launcher')).toBeNull();
    expect(external.getAttribute('aria-haspopup')).toBe('dialog');
    external.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    external.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    expect(fixture.componentInstance.isOpen()).toBe(true);

    const second = document.createElement('button');
    second.className = 'second-help';
    document.body.append(second);
    fixture.componentRef.setInput('customTrigger', new ElementRef(second));
    await fixture.whenStable();
    expect(external.getAttribute('aria-expanded')).toBe('mixed');
    expect(external.hasAttribute('aria-controls')).toBe(false);
    second.click();
    expect(fixture.componentInstance.isOpen()).toBe(false);

    fixture.componentRef.setInput('customTrigger', second);
    await fixture.whenStable();
    expect(second.getAttribute('aria-controls')).toMatch(/^context7-widget-panel-/);
  });

  it('keeps launcher visible for missing triggers and binds late DOM', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = createWidget({ customTrigger: '.late-trigger', library: '/owner/repo' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.c7-launcher')).not.toBeNull();
    expect(warning).toHaveBeenCalledOnce();

    fixture.componentInstance.open();
    await fixture.whenStable();

    const late = document.createElement('button');
    late.className = 'late-trigger';
    document.body.append(late);
    await nextTask();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.c7-launcher')).toBeNull();

    fixture.componentRef.setInput('customTrigger', '[');
    await fixture.whenStable();
    expect(warning).toHaveBeenCalledTimes(2);

    fixture.componentRef.setInput('customTrigger', document.createElement('button'));
    await fixture.whenStable();
    expect(warning).toHaveBeenCalledTimes(3);

    fixture.componentRef.setInput('customTrigger', '   ');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.c7-launcher')).not.toBeNull();
  });

  it('streams shared transport events, tool UI, markdown, copies, and public state', async () => {
    const fixture = createWidget({ library: '/owner/repo' });
    const events = {
      answer: vi.fn(),
      answerComplete: vi.fn(),
      firstToken: vi.fn(),
      question: vi.fn(),
      toolCall: vi.fn(),
      toolResult: vi.fn()
    };
    fixture.componentInstance.answer.subscribe(events.answer);
    fixture.componentInstance.answerComplete.subscribe(events.answerComplete);
    fixture.componentInstance.firstToken.subscribe(events.firstToken);
    fixture.componentInstance.question.subscribe(events.question);
    fixture.componentInstance.toolCall.subscribe(events.toolCall);
    fixture.componentInstance.toolResult.subscribe(events.toolResult);
    const states: Context7WidgetState[] = [];
    const unsubscribe = fixture.componentInstance.subscribe((state) => states.push(state));
    await fixture.whenStable();

    const result = await fixture.componentInstance.send('How do I install?');
    await fixture.whenStable();

    expect(result.status).toBe('complete');
    expect(events.question).toHaveBeenCalledOnce();
    expect(events.firstToken).toHaveBeenCalledOnce();
    expect(events.answer).toHaveBeenCalledTimes(2);
    expect(events.answerComplete).toHaveBeenCalledOnce();
    expect(events.toolCall).toHaveBeenCalledOnce();
    expect(events.toolResult).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Mocked Context7 answer.');
    expect(fixture.nativeElement.querySelector('.c7-code-block code')?.textContent).toBe('const ready = true;');
    expect(fixture.nativeElement.querySelector('.c7-tool-toggle')).not.toBeNull();
    (fixture.nativeElement.querySelector('.c7-tool-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.c7-tool-content')?.hasAttribute('hidden')).toBe(false);
    expect(states.some((state) => state.busy)).toBe(true);
    expect(states.at(-1)?.busy).toBe(false);

    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const answerCopies = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.c7-copy-answer');
    answerCopies[answerCopies.length - 1]?.click();
    await nextTask();
    expect(writeText).toHaveBeenCalledWith('Mocked Context7 answer.\n\n```ts\nconst ready = true;\n```');

    (fixture.nativeElement.querySelector('[data-c7-copy-code]') as HTMLButtonElement).click();
    await nextTask();
    expect(writeText).toHaveBeenCalledWith('const ready = true;');
    unsubscribe();
  });

  it('submits composer, handles Enter and Shift+Enter, Stop, Escape, and backdrop', async () => {
    let rejectRequest: ((reason: DOMException) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            rejectRequest = reject;
            init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          })
      )
    );
    const fixture = createWidget({
      backdrop: true,
      closeOnOutsideClick: true,
      library: '/owner/repo',
      position: 'center'
    });
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    await fixture.whenStable();
    fixture.componentInstance.open();
    await fixture.whenStable();
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));

    const input = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    input.value = 'Question';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', shiftKey: true }));
    expect(fixture.componentInstance.isBusy()).toBe(false);
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.isBusy()).toBe(true);
    const stop = fixture.nativeElement.querySelector('.c7-send') as HTMLButtonElement;
    expect(stop.textContent).toContain('Stop');
    stop.click();
    await fixture.whenStable();
    expect(cancelled).toHaveBeenCalledOnce();
    rejectRequest?.(new DOMException('Aborted', 'AbortError'));

    fixture.componentInstance.open();
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    expect(fixture.componentInstance.isOpen()).toBe(false);
    fixture.componentInstance.open();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.c7-backdrop') as HTMLElement).click();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('updates position, listeners, registry ownership, and outside-click behavior', async () => {
    const fixture = createWidget({
      closeOnOutsideClick: false,
      library: '/owner/repo',
      position: 'bottom-right',
      widgetId: 'first'
    });
    await fixture.whenStable();

    fixture.componentRef.setInput('position', 'top-right');
    await fixture.whenStable();
    fixture.componentInstance.open();
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.c7-backdrop') as HTMLElement).click();
    expect(fixture.componentInstance.isOpen()).toBe(true);

    setInputs(fixture.componentRef, {
      closeOnOutsideClick: true,
      defaultOpen: true,
      position: 'anchor',
      widgetId: 'second'
    });
    await fixture.whenStable();

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    TestResizeObserver.instances.at(-1)?.trigger();
    await nextTask();
    fixture.nativeElement.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
    fixture.nativeElement.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    expect(fixture.componentInstance.isOpen()).toBe(true);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    expect(fixture.componentInstance.isOpen()).toBe(false);

    const detachedFocus = document.createElement('button');
    document.body.append(detachedFocus);
    detachedFocus.focus();
    fixture.componentInstance.open();
    detachedFocus.remove();
    fixture.componentInstance.close();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('submits the composer button while idle', async () => {
    const fixture = createWidget({ library: '/owner/repo' });
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    input.value = 'Button question';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    (fixture.nativeElement.querySelector('.c7-send') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mocked Context7 answer.');
  });

  it('renders missing-library and transport errors with retry', async () => {
    const fixture = createWidget({ library: '' });
    const error = vi.fn();
    fixture.componentInstance.error.subscribe(error);
    await fixture.whenStable();

    const missing = await fixture.componentInstance.send('Question');
    await fixture.whenStable();
    expect(missing.status).toBe('error');
    expect(error).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Missing library');

    fixture.componentRef.setInput('library', '/owner/repo');
    await fixture.whenStable();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('failure', { status: 500 }))
    );
    await fixture.componentInstance.send('Question');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.c7-retry')).not.toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse())
    );
    (fixture.nativeElement.querySelector('.c7-retry') as HTMLButtonElement).click();
    await nextTask();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mocked Context7 answer.');
  });

  it('resets messages, isolates throwing subscribers, and supports empty controls', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const subscriberError = new Error('subscriber failed');
    const fixture = createWidget({ library: '/owner/repo' });
    await fixture.whenStable();
    const healthy = vi.fn();
    fixture.componentInstance.subscribe(() => {
      throw subscriberError;
    });
    fixture.componentInstance.subscribe(healthy);
    fixture.componentInstance.reset();
    expect(healthy).toHaveBeenCalled();
    expect(fixture.componentInstance.getMessages()).toEqual([]);
    expect((await fixture.componentInstance.send('   ')).status).toBe('empty');
    expect((await fixture.componentInstance.retry()).status).toBe('empty');
    fixture.componentInstance.cancel();
    expect(reportError).toHaveBeenCalledTimes(3);
    for (const call of reportError.mock.calls) expect(call).toEqual([subscriberError]);
  });

  it('keeps streaming autoscroll disabled while reader remains above bottom', async () => {
    const fixture = createWidget({ library: '/owner/repo' });
    await fixture.whenStable();
    await nextTask();
    const messages = fixture.nativeElement.querySelector('.c7-messages') as HTMLElement;
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 500 }
    });
    messages.scrollTop = 100;
    messages.dispatchEvent(new Event('scroll'));
    await fixture.componentInstance.send('Question');
    await fixture.whenStable();
    expect(messages.scrollTop).toBe(100);

    messages.scrollTop = 400;
    messages.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(messages.scrollTop).toBe(500));
  });

  it('applies provider defaults and supports default-open updates', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideContext7Widget({ library: '/defaults/repo', preset: 'glass', theme: 'dark' })
      ]
    });
    const fixture = createWidget({ defaultOpen: true });
    await fixture.whenStable();
    expect(fixture.nativeElement.getAttribute('library')).toBe('/defaults/repo');
    expect(fixture.nativeElement.getAttribute('preset')).toBe('glass');
    expect(fixture.componentInstance.isOpen()).toBe(true);

    fixture.componentInstance.close();
    fixture.componentRef.setInput('defaultOpen', false);
    await fixture.whenStable();
    fixture.componentRef.setInput('defaultOpen', true);
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });

  it('exports the trigger marker as a standalone directive', () => {
    expect(Context7WidgetTrigger).toBeTypeOf('function');
  });
});

function createWidget(inputs: Record<string, unknown>): ComponentFixture<Context7Widget> {
  const fixture = TestBed.createComponent(Context7Widget);
  if (!fixture.nativeElement.isConnected) document.body.append(fixture.nativeElement);
  setInputs(fixture.componentRef, inputs);
  return fixture;
}

function setInputs(component: ComponentRef<Context7Widget>, inputs: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(inputs)) component.setInput(name, value);
}

function streamResponse(): Response {
  return new Response(
    [
      'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"demo"}}\n',
      'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"ok":true}}\n',
      'data: {"type":"text-delta","delta":"Mocked "}\n',
      'data: {"type":"text-delta","delta":"Context7 answer.\\n\\n```ts\\nconst ready = true;\\n```"}\n',
      'data: [DONE]\n'
    ].join(''),
    { headers: { 'content-type': 'text/event-stream' }, status: 200 }
  );
}

async function nextTask(): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

it('uses the production chat endpoint', async () => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL) => streamResponse());
  vi.stubGlobal('fetch', fetchMock);
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = createWidget({ library: '/owner/repo' });
  await fixture.whenStable();
  await fixture.componentInstance.send('Question');
  expect(fetchMock.mock.calls[0]?.[0]).toBe(CHAT_ENDPOINT);
  fixture.destroy();
  TestBed.resetTestingModule();
  vi.unstubAllGlobals();
});
