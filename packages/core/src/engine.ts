import { isAbortError } from './runtime.js';
import { streamContext7Response } from './transport.js';
import type {
  Context7ActiveRequest,
  Context7ConversationEngineOptions,
  Context7ConversationEvent,
  Context7ConversationEventListener,
  Context7ConversationEventName,
  Context7ConversationState,
  Context7ConversationStateListener,
  Context7ConversationTransport,
  Context7Message,
  Context7MessageStatus,
  Context7ToolFrame,
  Context7WidgetConfig,
  Context7WidgetEventPayload,
  Context7WidgetSendResult
} from './types.js';

interface EngineActiveRequest extends Context7ActiveRequest {
  readonly commitCancel: () => Context7WidgetSendResult;
}

interface SendResultOptions {
  readonly answer?: string;
  readonly error?: Error | string;
  readonly message?: Context7Message;
}

const DEFAULT_MISSING_LIBRARY_MESSAGE = 'Missing library prop.';

export class Context7ConversationEngine {
  private activeRequest: EngineActiveRequest | null = null;
  private readonly eventListeners = new Set<Context7ConversationEventListener>();
  private readonly historyLimit: number;
  private readonly missingLibraryMessage: string | (() => string);
  private readonly nextMessageId: () => string;
  private partialAnswer = '';
  private lastFailedQuestion: string | null = null;
  private requestCounter = 0;
  private fallbackMessageCounter = 0;
  private readonly resolveConfig: () => Pick<Context7WidgetConfig, 'library'>;
  private readonly stateListeners = new Set<Context7ConversationStateListener>();
  private readonly toolFrames = new Map<string, Context7ToolFrame>();
  private readonly transport: Context7ConversationTransport;
  private messages: Context7Message[] = [];

  constructor(options: Context7ConversationEngineOptions) {
    this.historyLimit = normalizeHistoryLimit(options.historyLimit);
    this.missingLibraryMessage = options.missingLibraryMessage ?? DEFAULT_MISSING_LIBRARY_MESSAGE;
    this.nextMessageId = options.nextMessageId ?? (() => this.nextFallbackMessageId());
    this.resolveConfig = options.resolveConfig;
    this.transport = options.transport ?? streamContext7Response;
  }

  cancel(): Context7WidgetSendResult | undefined {
    const request = this.activeRequest;
    if (!request) return undefined;

    const result = request.commitCancel();
    this.activeRequest = null;
    request.controller.abort();
    this.partialAnswer = '';
    this.notifyState();
    return result;
  }

  getMessages(): readonly Context7Message[] {
    return [...this.messages];
  }

  getState(): Context7ConversationState {
    return {
      activeRequest: this.activeRequest ? toPublicRequest(this.activeRequest) : null,
      busy: this.isBusy(),
      messages: this.getMessages(),
      partialAnswer: this.partialAnswer,
      toolFrames: [...this.toolFrames.values()]
    };
  }

  isBusy(): boolean {
    return this.activeRequest !== null;
  }

  reset(messages: readonly Context7Message[] = []): void {
    this.cancel();
    this.messages = [...messages];
    this.partialAnswer = '';
    this.lastFailedQuestion = null;
    this.toolFrames.clear();
    this.notifyState();
  }

  async send(rawQuestion: string): Promise<Context7WidgetSendResult> {
    return await this.sendInternal(rawQuestion, false);
  }

  async retry(): Promise<Context7WidgetSendResult> {
    return await this.sendInternal(this.lastFailedQuestion ?? '', true);
  }

  private async sendInternal(rawQuestion: string, retry: boolean): Promise<Context7WidgetSendResult> {
    const question = rawQuestion.trim();
    if (!question) return this.createSendResult('empty', question);
    if (this.activeRequest) return this.createSendResult('busy', question);

    const config = this.resolveConfig();
    if (!config.library) {
      const missingLibraryMessage =
        (typeof this.missingLibraryMessage === 'function'
          ? this.missingLibraryMessage()
          : this.missingLibraryMessage) || DEFAULT_MISSING_LIBRARY_MESSAGE;
      const result = this.createSendResult('error', question, { error: missingLibraryMessage });
      this.lastFailedQuestion = question;
      this.emit('c7:error', { error: missingLibraryMessage, question }, null);
      return result;
    }

    const controller = new AbortController();
    this.lastFailedQuestion = null;
    let answer = '';
    let assistantMessage: Context7Message | undefined;
    let sendResult: Context7WidgetSendResult | undefined;
    let sawFirstToken = false;

    const commitAnswer = (status?: Context7MessageStatus): Context7Message | undefined => {
      if (!answer || assistantMessage) return assistantMessage;
      assistantMessage = {
        content: answer,
        id: this.nextMessageId(),
        role: 'assistant',
        ...(status ? { status } : {})
      };
      this.messages.push(assistantMessage);
      this.partialAnswer = '';
      this.notifyState();
      return assistantMessage;
    };

    const request: EngineActiveRequest = {
      controller,
      id: ++this.requestCounter,
      question,
      signal: controller.signal,
      commitCancel: () => {
        const message = commitAnswer('cancelled');
        const result = this.createSendResult('cancelled', question, {
          answer,
          message
        });
        sendResult = result;
        this.emit('c7:cancel', result, request);
        return result;
      }
    };
    this.activeRequest = request;

    const existingMessage = retry ? this.findRetryMessage(question) : undefined;
    const userMessage: Context7Message = existingMessage ?? {
      content: question,
      id: this.nextMessageId(),
      role: 'user'
    };
    if (!existingMessage) this.messages.push(userMessage);
    this.notifyState();
    this.emit(
      'c7:question',
      {
        message: userMessage,
        messages: this.getMessages(),
        question,
        ...(retry ? { retry: true } : {})
      },
      request
    );

    try {
      await this.transport(
        config,
        this.getTransportMessages(),
        {
          onChunk: (delta) => {
            if (this.activeRequest !== request) return;
            answer += delta;
            this.partialAnswer = answer;
            this.notifyState();

            const detail = { answer, question } as const;
            if (!sawFirstToken) {
              sawFirstToken = true;
              this.emit('c7:first-token', detail, request);
            }
            this.emit('c7:answer', detail, request);
          },
          onToolCall: (toolCall) => {
            if (this.activeRequest !== request) return;
            this.toolFrames.set(toolCall.toolCallId, { toolCall });
            this.notifyState();
            this.emit('c7:tool-call', { question, toolCall }, request);
          },
          onToolResult: (toolResult) => {
            if (this.activeRequest !== request) return;
            const frame = this.toolFrames.get(toolResult.toolCallId);
            if (frame) {
              this.toolFrames.set(toolResult.toolCallId, { ...frame, toolResult });
              this.notifyState();
            }
            this.emit('c7:tool-result', { question, toolResult }, request);
          }
        },
        request.signal
      );

      if (this.activeRequest !== request) {
        return sendResult ?? this.createSendResult('cancelled', question, { answer });
      }

      if (answer) {
        const message = commitAnswer();
        sendResult = this.createSendResult('complete', question, {
          answer,
          message
        });
        this.emit(
          'c7:answer-complete',
          {
            answer,
            message: message as Context7Message,
            messages: this.getMessages(),
            question
          },
          request
        );
        return sendResult;
      }

      sendResult = this.createSendResult('complete', question);
      return sendResult;
    } catch (error) {
      if (this.activeRequest !== request) {
        return sendResult ?? this.createSendResult('cancelled', question, { answer });
      }

      if (!isAbortError(error)) {
        const message = error instanceof Error ? error.message : 'Something went wrong.';
        sendResult = this.createSendResult('error', question, {
          answer,
          error: message
        });
        this.lastFailedQuestion = question;
        this.emit('c7:error', { error: message, question }, request);
        return sendResult;
      }
    } finally {
      if (this.activeRequest === request) {
        this.activeRequest = null;
        this.partialAnswer = '';
        this.notifyState();
      }
    }

    return sendResult ?? this.createSendResult('cancelled', question, { answer });
  }

  subscribe(listener: Context7ConversationStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  subscribeEvents(listener: Context7ConversationEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private createSendResult<Status extends Context7WidgetSendResult['status']>(
    status: Status,
    question: string,
    options: SendResultOptions = {}
  ): Context7WidgetSendResult & { readonly status: Status } {
    return {
      answer: options.answer ?? '',
      error: options.error,
      message: options.message,
      messages: this.getMessages(),
      question,
      status
    };
  }

  private emit<EventName extends Context7ConversationEventName>(
    type: EventName,
    detail: Context7WidgetEventPayload<EventName>,
    request: EngineActiveRequest | null
  ): void {
    if (this.eventListeners.size === 0) return;
    const event = {
      detail,
      request: request ? toPublicRequest(request) : null,
      type
    } as Context7ConversationEvent<EventName>;
    for (const listener of this.eventListeners) listener(event as Context7ConversationEvent);
  }

  private getTransportMessages(): readonly Context7Message[] {
    if (!Number.isFinite(this.historyLimit)) return this.getMessages();
    if (this.historyLimit <= 0) return [];
    return this.messages.slice(-this.historyLimit);
  }

  private findRetryMessage(question: string): Context7Message | undefined {
    for (let index = this.messages.length - 1; index >= 0; index -= 1) {
      const message = this.messages[index];
      if (message?.role === 'user' && message.content === question) return message;
    }
    return undefined;
  }

  private nextFallbackMessageId(): string {
    this.fallbackMessageCounter += 1;
    return `c7m-${this.fallbackMessageCounter}`;
  }

  private notifyState(): void {
    if (this.stateListeners.size === 0) return;
    const state = this.getState();
    for (const listener of this.stateListeners) listener(state);
  }
}

export function createContext7ConversationEngine(
  options: Context7ConversationEngineOptions
): Context7ConversationEngine {
  return new Context7ConversationEngine(options);
}

function normalizeHistoryLimit(value: number | undefined): number {
  if (value === undefined) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor(value));
}

function toPublicRequest(request: EngineActiveRequest): Context7ActiveRequest {
  return {
    controller: request.controller,
    id: request.id,
    question: request.question,
    signal: request.signal
  };
}
