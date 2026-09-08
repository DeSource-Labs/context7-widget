import {
  createContext7Widget,
  getContext7Widget,
  type Context7WidgetInstance,
  type Context7WidgetSendResult
} from '@src/index';
import {
  copyText,
  createContext7ConversationEngine,
  createContext7ConversationRenderBridge,
  formatContext7ToolResult,
  getContext7ToolQuery,
  renderMarkdown,
  resolveContext7AnchorLayout,
  type Context7ActiveRequest,
  type Context7ConversationEvent,
  type Context7ConversationState
} from '@src/core';

declare function expectType<Type>(value: Type): void;

expectType<string>(renderMarkdown('**safe**'));
expectType<number>(
  resolveContext7AnchorLayout({
    anchor: { bottom: 20, left: 10, right: 20, top: 10 },
    gap: 8,
    panelHeight: 200,
    panelWidth: 300,
    viewportHeight: 600,
    viewportWidth: 800
  }).left
);
expectType<Promise<boolean>>(copyText('copy me'));

const widget: Context7WidgetInstance | undefined = getContext7Widget('docs');
widget?.cancel();
expectType<Promise<Context7WidgetSendResult | undefined> | undefined>(widget?.send('How do I configure the widget?'));

createContext7Widget({
  customTrigger: document.createElement('button'),
  library: '/desource-labs/context7-widget'
});

document.addEventListener('c7:question', (event) => {
  expectType<string>(event.detail.question);
  expectType<string>(event.detail.message.id);
});

document.addEventListener('c7:cancel', (event) => {
  expectType<'cancelled' | 'complete' | undefined>(event.detail.message?.status);
  expectType<readonly string[]>(event.detail.messages.map((message) => message.content));
});

document.addEventListener('c7:ready', (event) => {
  expectType<string>(event.detail.library);

  // @ts-expect-error Lifecycle events intentionally have no question payload.
  expectType<string>(event.detail.question);
});

const engine = createContext7ConversationEngine({
  resolveConfig: () => ({ library: '/desource-labs/context7-widget' })
});
expectType<Promise<Context7WidgetSendResult>>(engine.send('How does the engine stream?'));

engine.subscribe((state) => {
  expectType<Context7ConversationState>(state);
  expectType<boolean>(state.busy);
  expectType<readonly string[]>(state.messages.map((message) => message.content));
});

engine.subscribeEvents((event) => {
  expectType<Context7ConversationEvent>(event);
  if (event.type === 'c7:tool-call') {
    expectType<string>(event.detail.toolCall.toolCallId);
  }
});

declare const request: Context7ActiveRequest;
expectType<string>(request.question);

// @ts-expect-error Active requests are headless and do not expose renderer DOM nodes.
expectType<HTMLElement>(request.typing);

const bridge = createContext7ConversationRenderBridge({
  clearAnswer: (answer: { readonly id: string }) => {
    expectType<string>(answer.id);
  },
  discardAnswer: (_answer: { readonly id: string }) => undefined,
  emit: (event) => {
    expectType<Context7ConversationEvent>(event);
  },
  flushAnswer: (_answer: { readonly id: string }, event) => {
    expectType<string>(event.detail.answer);
  },
  onAnswer: (_event, _answer: { readonly id: string }) => undefined,
  onError: (event) => {
    expectType<string | Error>(event.detail.error);
  },
  onQuestion: () => ({ id: 'render-1' }),
  onToolCall: (event, _answer) => {
    expectType<string>(getContext7ToolQuery(event.detail.toolCall));
  },
  onToolResult: (event) => {
    expectType<string>(formatContext7ToolResult(event.detail.toolResult.result));
  }
});
bridge.handleEvent({} as Context7ConversationEvent);
