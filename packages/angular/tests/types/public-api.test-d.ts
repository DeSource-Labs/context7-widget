import type { EnvironmentProviders, Signal } from '@angular/core';
import { ElementRef } from '@angular/core';
import {
  Context7Widget,
  Context7WidgetService,
  Context7WidgetTrigger,
  provideContext7Widget,
  type Context7AngularCustomTrigger,
  type Context7WidgetAnswerCompleteEventDetail,
  type Context7WidgetAngularOptions,
  type Context7WidgetHandle,
  type Context7WidgetMountOptions,
  type Context7WidgetSendResult
} from '@src/public-api';

const providers: EnvironmentProviders = provideContext7Widget({
  launcherLabel: 'Ask docs',
  preset: 'glass',
  theme: 'auto'
});

const triggerElement = document.createElement('button');
const triggerRef = new ElementRef(triggerElement);
const triggers: Context7AngularCustomTrigger[] = [true, 'docs-trigger', triggerElement, triggerRef];
const options: Context7WidgetAngularOptions = {
  customTrigger: triggers[0],
  library: '/owner/repo',
  open: true
};
const mountOptions: Context7WidgetMountOptions = { ...options, library: options.library };

declare const widget: Context7Widget;
declare const service: Context7WidgetService;
const handle: Context7WidgetHandle = widget;
const componentOpenSignal: Signal<boolean> = widget.isOpen;
const componentBusySignal: Signal<boolean> = widget.busy;
const openSignal: Signal<boolean> = service.isOpen;
const sendResult: Promise<Context7WidgetSendResult> = widget.send('Question');
widget.answerComplete.subscribe((detail: Context7WidgetAnswerCompleteEventDetail) => detail.answer);

void Context7WidgetTrigger;
void providers;
void mountOptions;
void handle;
void componentOpenSignal;
void componentBusySignal;
void openSignal;
void sendResult;

// @ts-expect-error component state signals are readonly public views
widget.isOpen.set(true);
// @ts-expect-error controlled open state is not an application default
provideContext7Widget({ open: true });
