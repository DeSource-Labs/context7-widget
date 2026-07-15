import {
  createContext7Widget,
  setContext7WidgetAttributes,
  type Context7Position,
  type Context7Theme,
  type Context7WidgetElement,
  type Context7WidgetEventDetail,
  type Context7WidgetOptions
} from "@desource/context7-widget";
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType
} from "vue";
import { compactWidgetOptions } from "./options";
import { context7WidgetEvents, vueEventNames } from "./events";

export type Context7WidgetVueEvent = CustomEvent<Context7WidgetEventDetail>;

export interface Context7WidgetExpose {
  readonly element: Context7WidgetElement | null;
  cancel: () => void;
  close: () => void;
  isOpen: () => boolean;
  open: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
}

export const Context7Widget = defineComponent({
  name: "Context7Widget",
  inheritAttrs: false,
  props: {
    apiUrl: String,
    color: String,
    customTrigger: String,
    hideDefaultButton: Boolean,
    initialMessage: String,
    library: {
      required: true,
      type: String
    },
    placeholder: String,
    position: String as PropType<Context7Position>,
    theme: String as PropType<Context7Theme>,
    title: String,
    widgetId: String
  },
  emits: [
    "answer",
    "answer-complete",
    "close",
    "error",
    "first-token",
    "open",
    "question",
    "ready",
    "tool-call",
    "tool-result"
  ],
  setup(props, { attrs, emit, expose }) {
    const host = ref<HTMLElement | null>(null);
    const widget = ref<Context7WidgetElement | null>(null);

    const widgetOptions = computed(() =>
      compactWidgetOptions({
        apiUrl: props.apiUrl,
        color: props.color,
        customTrigger: props.customTrigger,
        hideDefaultButton: props.hideDefaultButton,
        initialMessage: props.initialMessage,
        library: props.library,
        placeholder: props.placeholder,
        position: props.position,
        theme: props.theme,
        title: props.title,
        widgetId: props.widgetId
      }) as Context7WidgetOptions
    );

    const listeners = context7WidgetEvents.map((eventName) => {
      const listener = (event: Event) => {
        const customEvent = event as Context7WidgetVueEvent;
        emit(vueEventNames[eventName], customEvent.detail, customEvent);
      };

      return [eventName, listener] as const;
    });

    const mount = () => {
      if (!host.value || widget.value) return;

      const element = createContext7Widget(widgetOptions.value);
      for (const [eventName, listener] of listeners) {
        element.addEventListener(eventName, listener);
      }

      widget.value = element;
      host.value.append(element);
    };

    const unmount = () => {
      if (!widget.value) return;

      for (const [eventName, listener] of listeners) {
        widget.value.removeEventListener(eventName, listener);
      }

      widget.value.remove();
      widget.value = null;
    };

    watch(
      widgetOptions,
      (nextOptions) => {
        if (widget.value) {
          setContext7WidgetAttributes(widget.value, nextOptions);
        }
      },
      { deep: true }
    );

    onMounted(mount);
    onBeforeUnmount(unmount);

    expose({
      get element() {
        return widget.value;
      },
      cancel: () => widget.value?.cancel(),
      close: () => widget.value?.close(),
      isOpen: () => widget.value?.isOpen() ?? false,
      open: () => widget.value?.open(),
      send: async (message: string) => {
        await widget.value?.send(message);
      },
      toggle: () => widget.value?.toggle()
    } satisfies Context7WidgetExpose);

    return () =>
      h("span", {
        ...attrs,
        ref: host,
        class: ["context7-widget-host", attrs.class]
      });
  }
});
