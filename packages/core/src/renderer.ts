import type { Context7ConversationEvent, Context7ToolCall } from './types.js';

type AnswerDoneEvent = Context7ConversationEvent<'c7:answer-complete' | 'c7:cancel'>;

export interface Context7ConversationRenderBridgeOptions<AnswerRender> {
  clearAnswer(render: AnswerRender): void;
  discardAnswer(render: AnswerRender): void;
  emit(event: Context7ConversationEvent): void;
  flushAnswer(render: AnswerRender, event: AnswerDoneEvent): void;
  onAnswer(event: Context7ConversationEvent<'c7:answer'>, render: AnswerRender): void;
  onError(event: Context7ConversationEvent<'c7:error'>): void;
  onQuestion(event: Context7ConversationEvent<'c7:question'>): AnswerRender | null | undefined;
  onToolCall(event: Context7ConversationEvent<'c7:tool-call'>, render: AnswerRender | null): void;
  onToolResult(event: Context7ConversationEvent<'c7:tool-result'>): void;
}

export class Context7ConversationRenderBridge<AnswerRender> {
  private activeAnswer: { readonly render: AnswerRender; readonly requestId: number } | null = null;
  private readonly options: Context7ConversationRenderBridgeOptions<AnswerRender>;

  constructor(options: Context7ConversationRenderBridgeOptions<AnswerRender>) {
    this.options = options;
  }

  clearActiveAnswer(): void {
    const activeAnswer = this.activeAnswer;
    if (!activeAnswer) return;
    this.options.clearAnswer(activeAnswer.render);
    this.activeAnswer = null;
  }

  discardActiveAnswer(): void {
    const activeAnswer = this.activeAnswer;
    if (!activeAnswer) return;
    this.options.discardAnswer(activeAnswer.render);
    this.activeAnswer = null;
  }

  handleEvent(event: Context7ConversationEvent): void {
    switch (event.type) {
      case 'c7:question': {
        this.clearActiveAnswer();
        const render = this.options.onQuestion(event);
        if (event.request && render) {
          this.activeAnswer = { render, requestId: event.request.id };
        }
        break;
      }
      case 'c7:first-token':
        break;
      case 'c7:answer': {
        const render = this.getActiveAnswer(event);
        if (render) this.options.onAnswer(event, render);
        break;
      }
      case 'c7:answer-complete':
      case 'c7:cancel': {
        const render = this.getActiveAnswer(event);
        if (render) {
          this.options.flushAnswer(render, event);
          this.options.clearAnswer(render);
          this.activeAnswer = null;
        }
        break;
      }
      case 'c7:tool-call': {
        this.options.onToolCall(event, this.getActiveAnswer(event));
        break;
      }
      case 'c7:tool-result':
        this.options.onToolResult(event);
        break;
      case 'c7:error':
        this.discardActiveAnswer();
        this.options.onError(event);
        break;
    }
    this.options.emit(event);
  }

  private getActiveAnswer(event: Context7ConversationEvent): AnswerRender | null {
    if (!event.request || this.activeAnswer?.requestId !== event.request.id) return null;
    return this.activeAnswer.render;
  }
}

export function createContext7ConversationRenderBridge<AnswerRender>(
  options: Context7ConversationRenderBridgeOptions<AnswerRender>
): Context7ConversationRenderBridge<AnswerRender> {
  return new Context7ConversationRenderBridge(options);
}

export function formatContext7ToolResult(result: unknown): string {
  return typeof result === 'string' ? result : (JSON.stringify(result, null, 2) ?? String(result ?? ''));
}

export function getContext7ToolQuery(toolCall: Pick<Context7ToolCall, 'args'>): string {
  return typeof toolCall.args.query === 'string' ? toolCall.args.query : 'documentation';
}
