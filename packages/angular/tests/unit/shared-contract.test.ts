import { provideZonelessChangeDetection, type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  testContext7WidgetContract,
  type Context7WidgetContractAdapter,
  type Context7WidgetContractProps
} from '@common/tests/unit/context7-widget';
import { Context7Widget } from '../../src/components/context7-widget';

let testBedConfigured = false;

const adapter: Context7WidgetContractAdapter = {
  suiteName: 'Angular component',
  async mount(props) {
    if (!testBedConfigured) {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      testBedConfigured = true;
    }

    const fixture = TestBed.createComponent(Context7Widget);
    document.body.append(fixture.nativeElement);
    setInputs(fixture.componentRef, props);
    TestBed.tick();
    const nativeController = fixture.componentInstance;

    return {
      controller: {
        cancel() {
          nativeController.cancel();
          TestBed.tick();
        },
        close() {
          nativeController.close();
          TestBed.tick();
        },
        getMessages: () => nativeController.getMessages(),
        isBusy: () => nativeController.isBusy(),
        isOpen: () => nativeController.isOpen(),
        open() {
          nativeController.open();
          TestBed.tick();
        },
        reset() {
          nativeController.reset();
          TestBed.tick();
        },
        retry: async () => {
          const result = await nativeController.retry();
          TestBed.tick();
          return result;
        },
        send: async (message) => {
          const result = await nativeController.send(message);
          TestBed.tick();
          return result;
        },
        toggle() {
          nativeController.toggle();
          TestBed.tick();
        }
      },
      flush: async () => {
        TestBed.tick();
        await Promise.resolve();
        TestBed.tick();
      },
      interact: async (action) => {
        action();
        TestBed.tick();
        await Promise.resolve();
        TestBed.tick();
      },
      unmount: () => fixture.destroy(),
      view: fixture.nativeElement
    };
  }
};

testContext7WidgetContract(adapter);

function setInputs(component: ComponentRef<Context7Widget>, inputs: Readonly<Context7WidgetContractProps>): void {
  for (const [name, value] of Object.entries(inputs)) component.setInput(name, value);
}
