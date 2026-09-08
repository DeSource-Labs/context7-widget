/// <reference types="vite/client" />

import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Context7Widget,
  type Context7Position,
  type Context7Theme,
  type Context7WidgetHandle,
  type Context7WidgetPreset
} from '../src';
import '../src/styles.scss';
import './styles.css';

type TriggerMode = 'built-in' | 'external' | 'managed';
type EventStats = Record<
  'answerComplete' | 'cancel' | 'close' | 'error' | 'firstToken' | 'open' | 'question' | 'toolCall' | 'toolResult',
  number
>;

const initialStats: EventStats = {
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

function Demo() {
  const [theme, setTheme] = useState<Context7Theme>('auto');
  const [preset, setPreset] = useState<Context7WidgetPreset>('glass');
  const [position, setPosition] = useState<Context7Position>('anchor');
  const [triggerMode, setTriggerMode] = useState<TriggerMode>('managed');
  const [panelWidth, setPanelWidth] = useState('420px');
  const [panelHeight, setPanelHeight] = useState('460px');
  const [color, setColor] = useState('');
  const [backdrop, setBackdrop] = useState(false);
  const [closeOutside, setCloseOutside] = useState(true);
  const [stats, setStats] = useState(initialStats);
  const widget = useRef<Context7WidgetHandle>(null);
  const count = (name: keyof EventStats) => setStats((current) => ({ ...current, [name]: current[name] + 1 }));
  const customTrigger =
    triggerMode === 'managed' ? true : triggerMode === 'external' ? 'demo-external-trigger' : undefined;

  return (
    <main data-testid="context7-demo" className="demo-shell">
      <section className="demo-controls" aria-label="Widget demo controls">
        <label>
          Theme
          <select data-testid="theme" value={theme} onChange={(event) => setTheme(event.target.value as Context7Theme)}>
            <option>auto</option>
            <option>light</option>
            <option>dark</option>
          </select>
        </label>
        <label>
          Preset
          <select
            data-testid="preset"
            value={preset}
            onChange={(event) => setPreset(event.target.value as Context7WidgetPreset)}
          >
            {['default', 'minimal', 'glass', 'neo', 'terminal', 'brutalist'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Position
          <select
            data-testid="position"
            value={position}
            onChange={(event) => setPosition(event.target.value as Context7Position)}
          >
            {['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center', 'anchor'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Trigger
          <select
            data-testid="trigger-mode"
            value={triggerMode}
            onChange={(event) => setTriggerMode(event.target.value as TriggerMode)}
          >
            <option value="managed">managed</option>
            <option value="external">external</option>
            <option value="built-in">built-in</option>
          </select>
        </label>
        <label>
          Panel width
          <input data-testid="panel-width" value={panelWidth} onChange={(event) => setPanelWidth(event.target.value)} />
        </label>
        <label>
          Panel height
          <input
            data-testid="panel-height"
            value={panelHeight}
            onChange={(event) => setPanelHeight(event.target.value)}
          />
        </label>
        <label>
          Accent
          <input data-testid="accent" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <label className="checkbox-control">
          <input
            data-testid="backdrop"
            type="checkbox"
            checked={backdrop}
            onChange={(event) => setBackdrop(event.target.checked)}
          />
          Backdrop
        </label>
        <label className="checkbox-control">
          <input
            data-testid="close-outside"
            type="checkbox"
            checked={closeOutside}
            onChange={(event) => setCloseOutside(event.target.checked)}
          />
          Close outside
        </label>
      </section>

      <section className="demo-stage">
        {triggerMode === 'external' ? (
          <button id="demo-external-trigger" data-testid="external-trigger" type="button">
            External docs trigger
          </button>
        ) : null}
        <button
          data-testid="programmatic-send"
          type="button"
          onClick={() => void widget.current?.send('Show me Context7 Widget setup.')}
        >
          Programmatic send
        </button>
        <div data-testid="event-log" className="event-log">
          open:{stats.open} close:{stats.close} cancel:{stats.cancel} question:{stats.question} firstToken:
          {stats.firstToken} answerComplete:{stats.answerComplete} toolCall:{stats.toolCall} toolResult:
          {stats.toolResult} error:{stats.error}
        </div>
        <Context7Widget
          ref={widget}
          backdrop={backdrop}
          closeOnOutsideClick={closeOutside}
          color={color || undefined}
          customTrigger={customTrigger}
          initialMessage="Hello from the React demo for **{library}**."
          launcherLabel="Ask docs"
          launcherVariant="pill"
          library="/desource-labs/context7-widget"
          panelHeight={panelHeight}
          panelWidth={panelWidth}
          placeholder="Ask docs..."
          position={position}
          preset={preset}
          theme={theme}
          title="Demo Docs"
          widgetId="demo-widget"
          onAnswerComplete={() => count('answerComplete')}
          onCancel={() => count('cancel')}
          onClose={() => count('close')}
          onError={() => count('error')}
          onFirstToken={() => count('firstToken')}
          onOpen={() => count('open')}
          onQuestion={() => count('question')}
          onToolCall={() => count('toolCall')}
          onToolResult={() => count('toolResult')}
        />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>
);
