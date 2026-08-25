import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { describe, expect, it } from 'vitest';
import { Context7Widget } from '../../src/components/context7-widget';

@Component({
  selector: 'context7-ssr-host',
  standalone: true,
  imports: [Context7Widget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<context7-widget library="/owner/repo" position="center" />'
})
class Context7SsrHost {}

describe('Angular server rendering', () => {
  it('renders the native widget without executing browser-only lifecycle work', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(Context7SsrHost, { providers: [] }, context),
      {
        allowedHosts: ['example.test'],
        document: '<!doctype html><html><body><context7-ssr-host></context7-ssr-host></body></html>',
        url: 'https://example.test/docs'
      }
    );

    expect(html).toContain('<context7-widget');
    expect(html).toContain('class="context7-widget"');
    expect(html).toContain('role="dialog"');
    expect(html).not.toContain('context7-widget-panel-');
  });
});
