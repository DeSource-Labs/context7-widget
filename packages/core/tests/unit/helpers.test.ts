import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildContext7WidgetScriptTag,
  createContext7Widget,
  getContext7Widget,
  getContext7WidgetApi,
  mountContext7Widget,
  setContext7WidgetAttributes,
  toContext7WidgetAttributes
} from '@src/index';
import type { Context7WidgetOptions } from '@src/index';
import { context7WidgetOptionKeys } from '@src/kit';

const everySerializableOption = {
  backdrop: true,
  closeOnOutsideClick: false,
  color: '#111827',
  customTrigger: '#docs-chat',
  defaultOpen: true,
  initialMessage: 'Welcome',
  launcherLabel: 'Open docs',
  launcherVariant: 'pill',
  library: '/vercel/next.js',
  linkBaseUrl: 'https://nextjs.org/docs/',
  panelHeight: '36rem',
  panelWidth: '24rem',
  placeholder: 'Ask docs',
  position: 'bottom-left',
  preset: 'glass',
  theme: 'dark',
  title: 'Docs assistant',
  widgetId: 'docs'
} as const satisfies Context7WidgetOptions;

const everyElementAttribute = {
  backdrop: 'true',
  'close-on-outside-click': 'false',
  color: '#111827',
  'custom-trigger': '#docs-chat',
  'default-open': 'true',
  'initial-message': 'Welcome',
  'launcher-label': 'Open docs',
  'launcher-variant': 'pill',
  library: '/vercel/next.js',
  'link-base-url': 'https://nextjs.org/docs/',
  'panel-height': '36rem',
  'panel-width': '24rem',
  placeholder: 'Ask docs',
  position: 'bottom-left',
  preset: 'glass',
  theme: 'dark',
  'dialog-title': 'Docs assistant',
  'widget-id': 'docs'
} as const;

describe('core helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('maps JavaScript options to widget attributes', () => {
    expect(
      toContext7WidgetAttributes({
        color: '#111827',
        customTrigger: '#docs-chat',
        library: '/vercel/next.js',
        placeholder: 'Ask docs',
        theme: 'dark'
      })
    ).toEqual({
      color: '#111827',
      'custom-trigger': '#docs-chat',
      library: '/vercel/next.js',
      placeholder: 'Ask docs',
      theme: 'dark'
    });
  });

  it('keeps every serializable option aligned across helpers and script tags', () => {
    expectTypeOf<(typeof context7WidgetOptionKeys)[number]>().toEqualTypeOf<keyof Context7WidgetOptions>();
    expect([...context7WidgetOptionKeys].sort()).toEqual([...Object.keys(everySerializableOption), 'labels'].sort());
    expect(toContext7WidgetAttributes(everySerializableOption)).toEqual(everyElementAttribute);

    const template = document.createElement('template');
    template.innerHTML = buildContext7WidgetScriptTag({ async: false, ...everySerializableOption });
    const script = template.content.firstElementChild as HTMLScriptElement;

    expect(script.dataset).toMatchObject({
      backdrop: 'true',
      closeOnOutsideClick: 'false',
      color: '#111827',
      customTrigger: '#docs-chat',
      defaultOpen: 'true',
      initialMessage: 'Welcome',
      launcherLabel: 'Open docs',
      launcherVariant: 'pill',
      library: '/vercel/next.js',
      linkBaseUrl: 'https://nextjs.org/docs/',
      panelHeight: '36rem',
      panelWidth: '24rem',
      placeholder: 'Ask docs',
      position: 'bottom-left',
      preset: 'glass',
      theme: 'dark',
      title: 'Docs assistant',
      widgetId: 'docs'
    });
  });

  it('binds Element custom trigger options without serializing them as attributes', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);

    expect(
      toContext7WidgetAttributes({
        customTrigger: trigger,
        library: '/vercel/next.js'
      })
    ).toEqual({
      library: '/vercel/next.js'
    });

    const widget = mountContext7Widget({
      customTrigger: trigger,
      library: '/vercel/next.js'
    });

    expect(widget.customTrigger).toBe(trigger);
    expect(widget.hasAttribute('custom-trigger')).toBe(false);
  });

  it('mounts a widget into a target', () => {
    const target = document.createElement('div');
    target.id = 'widget-root';
    document.body.append(target);

    const widget = mountContext7Widget(
      {
        library: '/desource-labs/context7-widget',
        title: 'Docs assistant',
        widgetId: 'docs'
      },
      '#widget-root'
    );

    expect(target.firstElementChild).toBe(widget);
    expect(widget.getAttribute('library')).toBe('/desource-labs/context7-widget');
    expect(widget.getAttribute('dialog-title')).toBe('Docs assistant');
    expect(widget.hasAttribute('title')).toBe(false);
    expect(widget.getAttribute('widget-id')).toBe('docs');
  });

  it('creates disconnected widgets and mounts to the document body by default', () => {
    const disconnected = createContext7Widget({
      backdrop: true,
      defaultOpen: false,
      library: '/desource-labs/context7-widget'
    });

    expect(disconnected.isConnected).toBe(false);
    expect(disconnected.getAttribute('backdrop')).toBe('true');
    expect(disconnected.getAttribute('default-open')).toBe('false');

    const mounted = mountContext7Widget({
      library: '/desource-labs/context7-widget',
      widgetId: 'body-widget'
    });

    expect(mounted.parentElement).toBe(document.body);
    expect(getContext7WidgetApi()).toBe(window.Context7Widget);
    expect(getContext7Widget('body-widget')).toBe(mounted);
  });

  it('returns no global API during server-side rendering', () => {
    vi.stubGlobal('window', undefined);

    expect(getContext7WidgetApi()).toBeUndefined();
    expect(getContext7Widget()).toBeUndefined();
  });

  it('clears missing managed attributes when requested', () => {
    const widget = document.createElement('context7-widget');

    setContext7WidgetAttributes(widget, {
      customTrigger: '#docs-chat',
      library: '/desource-labs/context7-widget'
    });
    setContext7WidgetAttributes(widget, { library: '/desource-labs/context7-widget' }, true);

    expect(widget.hasAttribute('custom-trigger')).toBe(false);
    expect(widget.getAttribute('library')).toBe('/desource-labs/context7-widget');
  });

  it('serializes boolean options and removes explicitly empty attributes', () => {
    const widget = document.createElement('context7-widget');
    widget.setAttribute('dialog-title', 'Old title');

    setContext7WidgetAttributes(widget, {
      backdrop: false,
      defaultOpen: true,
      title: ''
    });

    expect(widget.getAttribute('backdrop')).toBe('false');
    expect(widget.getAttribute('default-open')).toBe('true');
    expect(widget.hasAttribute('dialog-title')).toBe(false);
    expect(toContext7WidgetAttributes({ backdrop: false, library: '', title: '' })).toEqual({
      backdrop: 'false'
    });
  });

  it('throws when the target selector cannot be resolved', () => {
    expect(() =>
      mountContext7Widget(
        {
          library: '/desource-labs/context7-widget'
        },
        '#missing-root'
      )
    ).toThrow('Context7 widget target was not found: #missing-root');
  });

  it('builds safe script tags for copy-paste installs', () => {
    expect(
      buildContext7WidgetScriptTag({
        color: '#16a34a',
        customTrigger: '#docs-chat',
        library: '/desource-labs/context7-widget',
        placeholder: 'Ask "docs"'
      })
    ).toBe(
      '<script src="https://context7.desourcelabs.com/widget.js" async data-color="#16a34a" data-custom-trigger="#docs-chat" data-library="/desource-labs/context7-widget" data-placeholder="Ask &quot;docs&quot;"></script>'
    );
  });

  it('serializes script options and escapes unsafe attributes', () => {
    expect(
      buildContext7WidgetScriptTag({
        async: false,
        defer: true,
        id: 'docs-script',
        library: '/owner/<repo>',
        nonce: 'abc"123',
        src: '/widget.js',
        title: 'Docs <Assistant>'
      })
    ).toBe(
      '<script src="/widget.js" defer id="docs-script" nonce="abc&quot;123" data-library="/owner/&lt;repo&gt;" data-title="Docs &lt;Assistant&gt;"></script>'
    );
  });

  it('escapes every HTML-sensitive script attribute character', () => {
    expect(
      buildContext7WidgetScriptTag({
        async: false,
        library: '/owner/repo?a=1&b=2',
        title: 'A "quoted" <title> & more'
      })
    ).toContain('data-title="A &quot;quoted&quot; &lt;title&gt; &amp; more"');
  });

  it('serializes explicit boolean widget options in script tags', () => {
    expect(
      buildContext7WidgetScriptTag({
        async: false,
        backdrop: false,
        defaultOpen: true,
        library: '/owner/repo'
      })
    ).toBe(
      '<script src="https://context7.desourcelabs.com/widget.js" data-backdrop="false" data-default-open="true" data-library="/owner/repo"></script>'
    );
  });

  it('omits non-serializable triggers and supports plain custom-element fallbacks', () => {
    const trigger = document.createElement('button');
    const plainWidget = document.createElement('div');

    expect(
      buildContext7WidgetScriptTag({
        async: false,
        customTrigger: trigger as unknown as string,
        library: '/owner/repo'
      })
    ).toBe('<script src="https://context7.desourcelabs.com/widget.js" data-library="/owner/repo"></script>');

    setContext7WidgetAttributes(plainWidget, { customTrigger: '#docs' });
    expect(plainWidget.getAttribute('custom-trigger')).toBe('#docs');
    setContext7WidgetAttributes(plainWidget, { customTrigger: trigger });
    expect(plainWidget.hasAttribute('custom-trigger')).toBe(false);
    setContext7WidgetAttributes(plainWidget, {}, false);
    expect(plainWidget.hasAttribute('custom-trigger')).toBe(false);
  });
});
