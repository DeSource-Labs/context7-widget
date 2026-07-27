declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module '*.png?inline' {
  const source: string;
  export default source;
}

declare module '*.svg?raw' {
  const source: string;
  export default source;
}
