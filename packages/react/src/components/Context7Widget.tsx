import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject
} from 'react';

import {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  compactContext7WidgetOptions,
  deSourceLabsLogoUrl,
  isContext7WidgetTriggerElement,
  normalizeContext7WidgetTrigger,
  resolveContext7WidgetConfig,
  useContext7Session,
  type Context7Message,
  type Context7Session,
  type Context7SessionEvent,
  type Context7WidgetAnswerCompleteEventDetail,
  type Context7WidgetAnswerEventDetail,
  type Context7WidgetCancelEventDetail,
  type Context7WidgetController,
  type Context7WidgetErrorEventDetail,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetOptions,
  type Context7WidgetQuestionEventDetail,
  type Context7WidgetToolCallEventDetail,
  type Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';

export type Context7ReactCustomTrigger = boolean | Element | RefObject<Element | null> | string;

export interface Context7WidgetState {
  readonly busy: boolean;
  readonly messages: readonly Context7Message[];
  readonly open: boolean;
}

export type Context7WidgetStateListener = (state: Context7WidgetState) => void;

export interface Context7WidgetHandle extends Context7WidgetController {
  readonly element: HTMLElement | null;

  subscribe(listener: Context7WidgetStateListener): () => void;
}

export interface Context7WidgetProps extends Omit<Context7WidgetOptions, 'customTrigger'> {
  customTrigger?: Context7ReactCustomTrigger;

  children?: ReactNode;

  /**
   * Content for React's managed trigger when customTrigger === true.
   */
  trigger?: ReactNode | ((options: { readonly label: string; readonly triggerId: string }) => ReactNode);

  rootProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

  onAnswer?(detail: Context7WidgetAnswerEventDetail): void;

  onAnswerComplete?(detail: Context7WidgetAnswerCompleteEventDetail): void;

  onCancel?(detail: Context7WidgetCancelEventDetail): void;

  onClose?(detail: Context7WidgetLifecycleEventDetail): void;

  onError?(detail: Context7WidgetErrorEventDetail): void;

  onFirstToken?(detail: Context7WidgetAnswerEventDetail): void;

  onOpen?(detail: Context7WidgetLifecycleEventDetail): void;

  onQuestion?(detail: Context7WidgetQuestionEventDetail): void;

  onReady?(detail: Context7WidgetLifecycleEventDetail): void;

  onToolCall?(detail: Context7WidgetToolCallEventDetail): void;

  onToolResult?(detail: Context7WidgetToolResultEventDetail): void;
}

export const Context7Widget = forwardRef<Context7WidgetHandle, Context7WidgetProps>(
  function Context7Widget(props, forwardedRef) {
    const {
      backdrop,
      children,
      closeOnOutsideClick,
      color,
      customTrigger,
      defaultOpen,
      initialMessage,
      launcherLabel,
      launcherVariant,
      library,
      panelHeight,
      panelWidth,
      placeholder,
      position,
      preset,
      rootProps,
      theme,
      title,
      trigger,
      widgetId
    } = props;

    const resolvedConfig = useMemo(
      () =>
        resolveContext7WidgetConfig(
          compactContext7WidgetOptions({
            backdrop,
            closeOnOutsideClick,
            color,
            defaultOpen,
            initialMessage,
            launcherLabel,
            launcherVariant,
            library,
            panelHeight,
            panelWidth,
            placeholder,
            position,
            preset,
            theme,
            title,
            widgetId
          })
        ),

      [
        backdrop,
        closeOnOutsideClick,
        color,
        defaultOpen,
        initialMessage,
        launcherLabel,
        launcherVariant,
        library,
        panelHeight,
        panelWidth,
        placeholder,
        position,
        preset,
        theme,
        title,
        widgetId
      ]
    );

    const rootRef = useRef<HTMLDivElement>(null);

    const panelRef = useRef<HTMLElement>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    const launcherRef = useRef<HTMLButtonElement>(null);

    const managedTriggerRef = useRef<HTMLButtonElement>(null);

    const messagesRef = useRef<HTMLDivElement>(null);

    const [draft, setDraft] = useState('');

    const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '-');

    const managedTriggerId = `context7-widget-trigger-${reactId}`;

    const panelId = `context7-widget-panel-${reactId}`;

    const configRef = useRef(resolvedConfig);

    configRef.current = resolvedConfig;

    const propsRef = useRef(props);

    propsRef.current = props;

    function baseDetail(): Context7WidgetLifecycleEventDetail {
      return {
        library: configRef.current.library,

        widget: rootRef.current as HTMLElement,

        widgetId: configRef.current.widgetId
      };
    }

    function onSessionEvent(event: Context7SessionEvent): void {
      const callbacks = propsRef.current;

      switch (event.type) {
        case 'open':
          callbacks.onOpen?.(baseDetail());

          return;

        case 'close':
          callbacks.onClose?.(baseDetail());

          return;

        case 'question':
          setDraft('');

          callbacks.onQuestion?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'first-token':
          callbacks.onFirstToken?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'answer':
          callbacks.onAnswer?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'answer-complete':
          callbacks.onAnswerComplete?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'cancel':
          callbacks.onCancel?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'tool-call':
          callbacks.onToolCall?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'tool-result':
          callbacks.onToolResult?.({
            ...baseDetail(),
            ...event.detail
          });

          return;

        case 'error':
          callbacks.onError?.({
            ...baseDetail(),
            ...event.detail
          });
      }
    }

    const sessionRef = useRef<Context7Session | null>(null);

    if (!sessionRef.current) {
      sessionRef.current =
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useContext7Session({
          elements: {
            input: () => inputRef.current,

            launcher: () => launcherRef.current,

            messages: () => messagesRef.current,

            panel: () => panelRef.current,

            root: () => rootRef.current
          },

          getConfig: () => ({
            closeOnOutsideClick: configRef.current.closeOnOutsideClick,

            initialMessage: configRef.current.initialMessage,

            library: configRef.current.library,

            position: configRef.current.position
          }),

          getCustomTrigger: () => {
            const value = propsRef.current.customTrigger;

            if (value === true) {
              return managedTriggerRef.current;
            }

            if (typeof value === 'string') {
              return normalizeContext7WidgetTrigger(value) || null;
            }

            if (isContext7WidgetTriggerElement(value)) {
              return value;
            }

            const current = value && typeof value === 'object' && 'current' in value ? value.current : null;

            return isContext7WidgetTriggerElement(current) ? current : null;
          },

          missingLibraryMessage: 'Missing library prop.',

          onEvent: onSessionEvent,

          panelId
        });

      /*
       * Internal-only state mutation; no DOM side effect.
       * Gives SSR its initial welcome message.
       */
      sessionRef.current.reset();
    }

    const session = sessionRef.current;

    const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

    const previousContentConfig = useRef({
      initialMessage: resolvedConfig.initialMessage,

      library: resolvedConfig.library
    });

    useEffect(() => {
      const previous = previousContentConfig.current;

      if (previous.library !== resolvedConfig.library || previous.initialMessage !== resolvedConfig.initialMessage) {
        previousContentConfig.current = {
          initialMessage: resolvedConfig.initialMessage,

          library: resolvedConfig.library
        };

        session.reset();
      }
    }, [resolvedConfig.initialMessage, resolvedConfig.library, session]);

    const previousCustomTrigger = useRef(customTrigger);

    useEffect(() => {
      if (previousCustomTrigger.current === customTrigger) {
        return;
      }

      previousCustomTrigger.current = customTrigger;

      session.refreshTrigger();
    }, [customTrigger, session]);

    const previousLayout = useRef({
      closeOnOutsideClick: resolvedConfig.closeOnOutsideClick,

      position: resolvedConfig.position
    });

    useEffect(() => {
      const previous = previousLayout.current;

      if (
        previous.position === resolvedConfig.position &&
        previous.closeOnOutsideClick === resolvedConfig.closeOnOutsideClick
      ) {
        return;
      }

      previousLayout.current = {
        closeOnOutsideClick: resolvedConfig.closeOnOutsideClick,

        position: resolvedConfig.position
      };

      session.refreshLayout();
    }, [resolvedConfig.closeOnOutsideClick, resolvedConfig.position, session]);

    const previousDefaultOpen = useRef(resolvedConfig.defaultOpen);

    useEffect(() => {
      if (previousDefaultOpen.current === resolvedConfig.defaultOpen) {
        return;
      }

      previousDefaultOpen.current = resolvedConfig.defaultOpen;

      if (resolvedConfig.defaultOpen) {
        session.open();
      }
    }, [resolvedConfig.defaultOpen, session]);

    useEffect(() => {
      session.mount();

      propsRef.current.onReady?.(baseDetail());

      if (configRef.current.defaultOpen) {
        session.open();
      }

      return () => {
        session.destroy();
      };
    }, [session]);

    useImperativeHandle(
      forwardedRef,

      (): Context7WidgetHandle => ({
        get element() {
          return rootRef.current;
        },

        cancel() {
          session.cancel();
        },

        close() {
          session.close();
        },

        getMessages() {
          return session.getMessages();
        },

        isBusy() {
          return session.isBusy();
        },

        isOpen() {
          return session.isOpen();
        },

        open() {
          session.open();
        },

        reset() {
          session.reset();
        },

        send(message: string) {
          return session.send(message);
        },

        subscribe(listener) {
          return subscribeToPublicState(session, listener);
        },

        toggle() {
          session.toggle();
        }
      }),

      [session]
    );

    const rendersManagedTrigger = customTrigger === true;

    const hasCustomTrigger = rendersManagedTrigger || snapshot.customTriggerBound;

    const customTriggerSelector = rendersManagedTrigger
      ? `#${managedTriggerId}`
      : typeof customTrigger === 'string'
        ? normalizeContext7WidgetTrigger(customTrigger)
        : undefined;

    const className = ['context7-widget', rootProps?.className].filter(Boolean).join(' ');

    const widgetStyle = {
      ...rootProps?.style,

      '--c7-accent': resolvedConfig.color || undefined,

      '--c7-panel-height': resolvedConfig.panelHeight || undefined,

      '--c7-panel-width': resolvedConfig.panelWidth || undefined
    } as CSSProperties & Record<string, string | number | undefined>;

    const hostAttributes: Record<string, string | undefined> = {
      'backdrop-active': resolvedConfig.backdrop ? '' : undefined,

      'close-on-outside-click': String(resolvedConfig.closeOnOutsideClick),

      color: resolvedConfig.color || undefined,

      'custom-trigger': customTriggerSelector,

      'custom-trigger-active': hasCustomTrigger ? '' : undefined,

      'default-open': String(resolvedConfig.defaultOpen),

      'launcher-variant': resolvedConfig.launcherVariant,

      library: resolvedConfig.library,

      open: snapshot.open ? '' : undefined,

      'panel-height': resolvedConfig.panelHeight || undefined,

      'panel-width': resolvedConfig.panelWidth || undefined,

      position: resolvedConfig.position,

      preset: resolvedConfig.preset,

      theme: resolvedConfig.theme,

      'widget-id': resolvedConfig.widgetId
    };

    function onSubmit(
      event: // eslint-disable-next-line no-undef
      React.SubmitEvent<HTMLFormElement>
    ): void {
      event.preventDefault();

      if (snapshot.busy) {
        session.cancel();
        return;
      }

      void session.send(draft);
    }

    return (
      <div
        {...rootProps}
        {...hostAttributes}
        ref={rootRef}
        className={className}
        style={widgetStyle}
        onKeyDown={(event) => {
          session.handleKeyDown(event.nativeEvent);

          rootProps?.onKeyDown?.(event);
        }}
      >
        <div
          className="c7-backdrop"
          data-c7-backdrop
          part="backdrop"
          aria-hidden="true"
          onClick={() => session.backdropClick()}
        />

        {rendersManagedTrigger && (
          <button
            id={managedTriggerId}
            ref={managedTriggerRef}
            className="context7-widget-trigger"
            type="button"
            aria-controls={panelId}
            aria-expanded={snapshot.open}
            aria-haspopup="dialog"
            data-preset={resolvedConfig.preset}
            data-theme={resolvedConfig.theme}
          >
            {typeof trigger === 'function'
              ? trigger({
                  label: resolvedConfig.launcherLabel,

                  triggerId: managedTriggerId
                })
              : (trigger ?? resolvedConfig.launcherLabel)}
          </button>
        )}

        <section
          id={panelId}
          ref={panelRef}
          aria-label={resolvedConfig.title}
          aria-busy={snapshot.busy}
          aria-modal={resolvedConfig.position === 'center'}
          className="c7-panel"
          part="panel"
          role="dialog"
        >
          <header className="c7-header" part="header">
            <div className="c7-title" part="title">
              {resolvedConfig.title}
            </div>

            <button
              className="c7-close"
              part="close-button"
              type="button"
              aria-label="Close chat"
              onClick={() => session.close()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>

          <div
            ref={messagesRef}
            aria-label="Documentation chat conversation"
            aria-live="polite"
            aria-relevant="additions text"
            className="c7-messages"
            part="messages"
            role="log"
          >
            {snapshot.items.map((item) => {
              if (item.kind === 'message') {
                if (item.role === 'assistant') {
                  return (
                    <div
                      key={item.id}
                      className="c7-message c7-message--assistant"
                      part="message assistant-message"
                      dangerouslySetInnerHTML={{
                        __html: item.html
                      }}
                    />
                  );
                }

                return (
                  <div key={item.id} className="c7-message c7-message--user" part="message user-message">
                    {item.content}
                  </div>
                );
              }

              if (item.kind === 'error') {
                return (
                  <div key={item.id} className="c7-message c7-message--error" part="message error-message" role="alert">
                    {item.message}

                    {item.adminUrl && (
                      <>
                        <br />
                        <br />

                        {'If you are the library owner, check your '}

                        <a href={item.adminUrl} target="_blank" rel="noopener noreferrer">
                          widget settings
                        </a>

                        {' on Context7.'}
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.id} className="c7-tool-call" part="tool-call">
                  <div className="c7-tool-header">
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />

                      <path d="m21 21-4.35-4.35" />
                    </svg>

                    <span>Searching: {item.query}</span>

                    {!item.hasResult && (
                      <svg
                        className="c7-spinner"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                  </div>

                  {item.hasResult && (
                    <div className="c7-tool-result">
                      <button
                        className="c7-tool-toggle"
                        part="tool-toggle"
                        type="button"
                        aria-controls={item.contentId}
                        aria-expanded={item.expanded}
                        onClick={() => session.toggleTool(item.id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>

                        <span>{item.expanded ? 'Hide results' : 'View results'}</span>
                      </button>

                      <div
                        id={item.contentId}
                        aria-label="Documentation search results"
                        className="c7-tool-content"
                        role="region"
                        hidden={!item.expanded}
                      >
                        <pre>{item.result}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {snapshot.typing && (
              <div aria-label="Context7 is responding" className="c7-typing" part="typing" role="status">
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </div>
            )}
          </div>

          <form className="c7-composer" part="composer" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={draft}
              aria-label="Ask a documentation question"
              className="c7-input"
              part="input"
              type="text"
              autoComplete="off"
              disabled={snapshot.busy}
              placeholder={resolvedConfig.placeholder}
              onChange={(event) => setDraft(event.currentTarget.value)}
            />

            <button
              aria-label={snapshot.busy ? 'Stop response' : 'Send question'}
              className="c7-send"
              part="send-button"
              type="submit"
            >
              {snapshot.busy ? 'Stop' : 'Send'}
            </button>
          </form>

          <footer className="c7-footer" part="footer">
            <span className="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
              <a
                className="c7-brand-link"
                href={CONTEXT7_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Powered by Context7"
                title="Powered by Context7"
              >
                <span className="c7-brand-prefix">Powered by</span>
                <svg
                  className="c7-brand-logo c7-brand-logo--context7"
                  aria-hidden="true"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="28" height="28" rx="4" fill="currentColor" />
                  <path
                    d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z"
                    fill="var(--c7-footer-background, #000000)"
                  />
                  <path
                    d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z"
                    fill="var(--c7-footer-background, #000000)"
                  />
                  <path
                    d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z"
                    fill="var(--c7-footer-background, #000000)"
                  />
                  <path
                    d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0445 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z"
                    fill="var(--c7-footer-background, #000000)"
                  />
                </svg>
              </a>
              <span className="c7-brand-separator" aria-hidden="true">
                ·
              </span>
              <a
                className="c7-brand-link"
                href={DESOURCE_LABS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enhanced by DeSource Labs"
                title="Enhanced by DeSource Labs"
              >
                <span className="c7-brand-prefix">Enhanced by</span>
                <img className="c7-brand-logo c7-brand-logo--desource" src={deSourceLabsLogoUrl} alt="" />
              </a>
            </span>
          </footer>
        </section>

        {!hasCustomTrigger && (
          <button
            ref={launcherRef}
            className="c7-launcher"
            part="launcher"
            type="button"
            aria-controls={panelId}
            aria-expanded={snapshot.open}
            aria-label={resolvedConfig.launcherLabel}
            aria-haspopup="dialog"
            onClick={(event) => session.openFrom(event.currentTarget)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 9h8" />
              <path d="M8 13h6" />

              <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
            </svg>

            <span className="c7-launcher-label">{resolvedConfig.launcherLabel}</span>
          </button>
        )}

        {children}
      </div>
    );
  }
);

function subscribeToPublicState(session: Context7Session, listener: Context7WidgetStateListener): () => void {
  let initialized = false;

  let previousBusy = false;
  let previousOpen = false;

  let previousMessages: readonly Context7Message[] | undefined;

  return session.subscribe((snapshot) => {
    if (
      initialized &&
      previousBusy === snapshot.busy &&
      previousOpen === snapshot.open &&
      previousMessages === snapshot.messages
    ) {
      return;
    }

    initialized = true;

    previousBusy = snapshot.busy;
    previousOpen = snapshot.open;
    previousMessages = snapshot.messages;

    listener({
      busy: snapshot.busy,
      messages: snapshot.messages,
      open: snapshot.open
    });
  });
}
