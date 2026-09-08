import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  DestroyRef,
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  computed,
  createComponent,
  effect,
  inject,
  signal,
  type ComponentRef
} from '@angular/core';
import {
  context7WidgetOptionKeys,
  type Context7Message,
  type Context7WidgetTarget,
  type Context7WidgetSendResult
} from '@desource/context7-widget/kit';
import { Context7Widget } from './components/context7-widget';
import { context7AngularRegistryVersion, getAngularContext7Widget } from './internal/registry';
import type { Context7WidgetHandle, Context7WidgetMountOptions, Context7WidgetState } from './types';

type OwnedWidget = {
  readonly component: ComponentRef<Context7Widget>;
  readonly host: HTMLElement;
};

const EMPTY_STATE: Context7WidgetState = { busy: false, messages: [], open: false };

/** Injectable controls for rendered and programmatically mounted Angular widgets. */
@Injectable({ providedIn: 'root' })
export class Context7WidgetService {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly selectedWidgetId = signal('default');
  private readonly selectedState = signal<Context7WidgetState>(EMPTY_STATE);
  private readonly ownedWidgets = new Map<string, OwnedWidget>();
  private readonly selectedController = computed(() => {
    context7AngularRegistryVersion();
    return getAngularContext7Widget(this.selectedWidgetId()) ?? null;
  });

  readonly widgetId = this.selectedWidgetId.asReadonly();
  readonly widget = computed(() => this.selectedController()?.element ?? null);
  readonly isOpen = computed(() => this.selectedState().open);
  readonly isBusy = computed(() => this.selectedState().busy);
  readonly messages = computed(() => this.selectedState().messages);

  constructor() {
    effect((onCleanup) => {
      const controller = this.selectedController();
      if (!controller) {
        this.selectedState.set(EMPTY_STATE);
        return;
      }
      const unsubscribe = controller.subscribe((state) => this.selectedState.set(state));
      onCleanup(unsubscribe);
    });
    inject(DestroyRef).onDestroy(() => {
      for (const widgetId of this.ownedWidgets.keys()) this.unmount(widgetId);
    });
  }

  /** Selects the widget exposed by the reactive state signals and default controls. */
  select(widgetId = 'default'): void {
    this.selectedWidgetId.set(normalizeWidgetId(widgetId));
  }

  get(widgetId = this.selectedWidgetId()): Context7WidgetHandle | undefined {
    context7AngularRegistryVersion();
    return getAngularContext7Widget(normalizeWidgetId(widgetId));
  }

  /** Mounts or updates a widget owned by this service. Browser only. */
  mount(options: Context7WidgetMountOptions): Context7Widget {
    if (!this.browser) throw new Error('Context7WidgetService.mount() is only available in a browser.');
    if (!options.library?.trim()) throw new Error('Context7WidgetService mount requires a library option.');
    const widgetId = normalizeWidgetId(options.widgetId);
    let owned = this.ownedWidgets.get(widgetId);

    if (!owned) {
      const host = this.document.createElement('context7-widget');
      resolveAngularTarget(options.target ?? this.document.body, this.document).append(host);
      const component = createComponent(Context7Widget, {
        environmentInjector: this.environmentInjector,
        hostElement: host
      });
      this.applicationRef.attachView(component.hostView);
      owned = { component, host };
      this.ownedWidgets.set(widgetId, owned);
    } else {
      const target = resolveAngularTarget(options.target ?? this.document.body, this.document);
      if (owned.host.parentNode !== target) target.append(owned.host);
    }

    this.setInputs(owned.component, { ...options, widgetId });
    owned.component.changeDetectorRef.detectChanges();
    this.select(widgetId);
    return owned.component.instance;
  }

  /** Destroys a widget created by mount(). Rendered template widgets are never removed. */
  unmount(widgetId = this.selectedWidgetId()): void {
    const normalizedId = normalizeWidgetId(widgetId);
    const owned = this.ownedWidgets.get(normalizedId);
    if (!owned) return;
    this.ownedWidgets.delete(normalizedId);
    this.applicationRef.detachView(owned.component.hostView);
    owned.component.destroy();
    owned.host.remove();
  }

  open(widgetId?: string): void {
    this.resolve(widgetId)?.open();
  }

  close(widgetId?: string): void {
    this.resolve(widgetId)?.close();
  }

  toggle(widgetId?: string): void {
    this.resolve(widgetId)?.toggle();
  }

  cancel(widgetId?: string): void {
    this.resolve(widgetId)?.cancel();
  }

  reset(widgetId?: string): void {
    this.resolve(widgetId)?.reset();
  }

  getMessages(widgetId?: string): readonly Context7Message[] {
    return this.resolve(widgetId)?.getMessages() ?? [];
  }

  async send(message: string, widgetId?: string): Promise<Context7WidgetSendResult | undefined> {
    return await this.resolve(widgetId)?.send(message);
  }

  async retry(widgetId?: string): Promise<Context7WidgetSendResult | undefined> {
    return await this.resolve(widgetId)?.retry();
  }

  private resolve(widgetId?: string): Context7WidgetHandle | undefined {
    return this.get(widgetId ?? this.selectedWidgetId());
  }

  private setInputs(component: ComponentRef<Context7Widget>, options: Context7WidgetMountOptions): void {
    for (const key of context7WidgetOptionKeys) {
      if (key !== 'customTrigger') component.setInput(key, options[key]);
    }
    component.setInput('customTrigger', options.customTrigger);
    component.setInput('open', options.open);
  }
}

function normalizeWidgetId(widgetId?: string): string {
  return widgetId?.trim() || 'default';
}

function resolveAngularTarget(target: Context7WidgetTarget, document: Document): Element | DocumentFragment {
  if (typeof target !== 'string') return target;
  const element = document.querySelector(target);
  if (!element) throw new Error(`Context7 widget target was not found: ${target}`);
  return element;
}
