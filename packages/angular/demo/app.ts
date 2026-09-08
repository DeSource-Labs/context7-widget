import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { Context7Widget } from '@desource/context7-widget-angular';
import type { Context7Position, Context7Theme, Context7WidgetPreset } from '@desource/context7-widget/kit';

type TriggerMode = 'managed' | 'external' | 'built-in';
type EventStats = {
  readonly answerComplete: number;
  readonly cancel: number;
  readonly close: number;
  readonly error: number;
  readonly firstToken: number;
  readonly open: number;
  readonly question: number;
  readonly toolCall: number;
  readonly toolResult: number;
};

@Component({
  selector: 'demo-app',
  standalone: true,
  imports: [Context7Widget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main data-testid="context7-demo" class="demo-shell">
      <section class="demo-controls" aria-label="Widget demo controls">
        <label
          >Theme
          <select data-testid="theme" [value]="theme()" (change)="setTheme($event)">
            <option value="auto">auto</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label
          >Preset
          <select data-testid="preset" [value]="preset()" (change)="setPreset($event)">
            <option value="default">default</option>
            <option value="minimal">minimal</option>
            <option value="glass">glass</option>
            <option value="neo">neo</option>
            <option value="terminal">terminal</option>
            <option value="brutalist">brutalist</option>
          </select>
        </label>
        <label
          >Position
          <select data-testid="position" [value]="position()" (change)="setPosition($event)">
            <option value="bottom-right">bottom-right</option>
            <option value="bottom-left">bottom-left</option>
            <option value="top-right">top-right</option>
            <option value="top-left">top-left</option>
            <option value="center">center</option>
            <option value="anchor">anchor</option>
          </select>
        </label>
        <label
          >Trigger
          <select data-testid="trigger-mode" [value]="triggerMode()" (change)="setTriggerMode($event)">
            <option value="managed">managed</option>
            <option value="external">external</option>
            <option value="built-in">built-in</option>
          </select>
        </label>
        <label
          >Panel width
          <input
            data-testid="panel-width"
            type="text"
            [value]="panelWidth()"
            (input)="panelWidth.set(inputValue($event))"
          />
        </label>
        <label
          >Panel height
          <input
            data-testid="panel-height"
            type="text"
            [value]="panelHeight()"
            (input)="panelHeight.set(inputValue($event))"
          />
        </label>
        <label
          >Accent
          <input data-testid="accent" type="text" [value]="color()" (input)="color.set(inputValue($event))" />
        </label>
        <label class="checkbox-control">
          <input
            data-testid="backdrop"
            type="checkbox"
            [checked]="backdrop()"
            (change)="backdrop.set(checkedValue($event))"
          />
          Backdrop
        </label>
        <label class="checkbox-control">
          <input
            data-testid="close-outside"
            type="checkbox"
            [checked]="closeOnOutsideClick()"
            (change)="closeOnOutsideClick.set(checkedValue($event))"
          />
          Close outside
        </label>
      </section>

      <section class="demo-stage">
        @if (triggerMode() === 'external') {
          <button id="demo-external-trigger" data-testid="external-trigger" type="button">External docs trigger</button>
        }
        <button data-testid="programmatic-send" type="button" (click)="sendPrompt()">Programmatic send</button>
        <div data-testid="event-log" class="event-log">
          open:{{ stats().open }} close:{{ stats().close }} cancel:{{ stats().cancel }} question:{{
            stats().question
          }}
          firstToken:{{ stats().firstToken }} answerComplete:{{ stats().answerComplete }} toolCall:{{
            stats().toolCall
          }}
          toolResult:{{ stats().toolResult }} error:{{ stats().error }}
        </div>

        <context7-widget
          library="/desource-labs/context7-widget"
          initialMessage="Hello from the Angular demo for **{library}**."
          launcherLabel="Ask docs"
          launcherVariant="pill"
          placeholder="Ask docs..."
          title="Demo Docs"
          widgetId="demo-widget"
          [backdrop]="backdrop()"
          [closeOnOutsideClick]="closeOnOutsideClick()"
          [color]="color() || undefined"
          [customTrigger]="customTrigger()"
          [panelHeight]="panelHeight()"
          [panelWidth]="panelWidth()"
          [position]="position()"
          [preset]="preset()"
          [theme]="theme()"
          (answerComplete)="increment('answerComplete')"
          (cancelled)="increment('cancel')"
          (closed)="increment('close')"
          (error)="increment('error')"
          (firstToken)="increment('firstToken')"
          (opened)="increment('open')"
          (question)="increment('question')"
          (toolCall)="increment('toolCall')"
          (toolResult)="increment('toolResult')"
        />
      </section>
    </main>
  `
})
export class DemoApp {
  protected readonly theme = signal<Context7Theme>('auto');
  protected readonly preset = signal<Context7WidgetPreset>('glass');
  protected readonly position = signal<Context7Position>('anchor');
  protected readonly triggerMode = signal<TriggerMode>('managed');
  protected readonly panelWidth = signal('420px');
  protected readonly panelHeight = signal('460px');
  protected readonly color = signal('');
  protected readonly backdrop = signal(false);
  protected readonly closeOnOutsideClick = signal(true);
  protected readonly stats = signal<EventStats>({
    answerComplete: 0,
    cancel: 0,
    close: 0,
    error: 0,
    firstToken: 0,
    open: 0,
    question: 0,
    toolCall: 0,
    toolResult: 0
  });
  protected readonly customTrigger = computed(() => {
    if (this.triggerMode() === 'managed') return true;
    if (this.triggerMode() === 'external') return 'demo-external-trigger';
    return undefined;
  });
  private readonly widget = viewChild(Context7Widget);

  protected setTheme(event: Event): void {
    this.theme.set(this.inputValue(event) as Context7Theme);
  }

  protected setPreset(event: Event): void {
    this.preset.set(this.inputValue(event) as Context7WidgetPreset);
  }

  protected setPosition(event: Event): void {
    this.position.set(this.inputValue(event) as Context7Position);
  }

  protected setTriggerMode(event: Event): void {
    this.triggerMode.set(this.inputValue(event) as TriggerMode);
  }

  protected inputValue(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement).value;
  }

  protected checkedValue(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
  }

  protected increment(key: keyof EventStats): void {
    this.stats.update((stats) => ({ ...stats, [key]: stats[key] + 1 }));
  }

  protected sendPrompt(): void {
    void this.widget()?.send('Show me Context7 Widget setup.');
  }
}
