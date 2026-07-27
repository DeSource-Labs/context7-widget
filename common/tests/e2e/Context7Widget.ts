import { expect, test, type Locator, type Page } from '@playwright/test';

type Context7WidgetSelectors = {
  accent: string;
  backdrop: string;
  closeOutside: string;
  eventLog: string;
  externalTrigger: string;
  panelHeight: string;
  panelWidth: string;
  position: string;
  preset: string;
  programmaticSend: string;
  theme: string;
  triggerMode: string;
  widget: string;
};

const CONTEXT7_CHAT_ENDPOINT = 'https://context7.com/api/v2/widget/chat';

export function testContext7WidgetDemo(containerSelector: string, selectors: Context7WidgetSelectors): void {
  test.describe('Context7Widget demo', () => {
    let container: Locator;
    let widget: Locator;

    test.beforeEach(async ({ page }) => {
      await mockContext7Chat(page);
      await page.goto('/');

      container = page.locator(containerSelector);
      widget = container.locator(selectors.widget);
    });

    test('renders managed trigger and opens the anchored panel', async () => {
      const trigger = container.locator('.context7-widget-trigger');

      await expect(trigger).toHaveText(/Ask docs/);
      await trigger.click();

      await expect(panel(widget)).toBeVisible();
      await expect(container.locator(selectors.eventLog)).toContainText('open:1');
    });

    test('updates public attributes from demo controls', async () => {
      await container.locator(selectors.theme).selectOption('dark');
      await container.locator(selectors.preset).selectOption('terminal');
      await container.locator(selectors.position).selectOption('center');
      await container.locator(selectors.panelWidth).fill('520px');
      await container.locator(selectors.panelHeight).fill('500px');
      await container.locator(selectors.accent).fill('#ff6f91');

      await expect(widget).toHaveAttribute('theme', 'dark');
      await expect(widget).toHaveAttribute('preset', 'terminal');
      await expect(widget).toHaveAttribute('position', 'center');
      await expect(widget).toHaveAttribute('panel-width', '520px');
      await expect(widget).toHaveAttribute('panel-height', '500px');
      await expect(widget).toHaveAttribute('color', '#ff6f91');
    });

    test('uses an external trigger id without rendering the managed trigger', async () => {
      await container.locator(selectors.triggerMode).selectOption('external');

      await expect(container.locator('.context7-widget-trigger')).toHaveCount(0);
      await expect(widget).toHaveAttribute('custom-trigger', '#demo-external-trigger');

      await container.locator(selectors.externalTrigger).click();

      await expect(panel(widget)).toBeVisible();
    });

    test('sends questions, renders streamed answer text, and reports events', async () => {
      await container.locator(selectors.programmaticSend).click();

      await expect(panel(widget)).toContainText('Mocked Context7 answer.');
      await expect(container.locator(selectors.eventLog)).toContainText('question:1');
      await expect(container.locator(selectors.eventLog)).toContainText('firstToken:1');
      await expect(container.locator(selectors.eventLog)).toContainText('answerComplete:1');
      await expect(container.locator(selectors.eventLog)).toContainText('toolCall:1');
      await expect(container.locator(selectors.eventLog)).toContainText('toolResult:1');
    });

    test('closes when clicking outside if the option is enabled', async ({ page }) => {
      await container.locator('.context7-widget-trigger').click();
      await expect(panel(widget)).toBeVisible();

      await page.mouse.click(8, 8);

      await expect(panel(widget)).not.toBeVisible();
      await expect(container.locator(selectors.eventLog)).toContainText('close:1');
    });

    test('shows backdrop for centered modal-style usage', async () => {
      await container.locator(selectors.position).selectOption('center');
      await container.locator(selectors.backdrop).check();
      await container.locator('.context7-widget-trigger').click();

      await expect(widget).toHaveAttribute('open', '');
      await expect(widget).toHaveAttribute('backdrop-active', '');
      await expect(panel(widget)).toBeVisible();

      await expect
        .poll(async () =>
          widget.evaluate((element) => {
            const backdrop =
              element.shadowRoot?.querySelector('[part~="backdrop"]') ?? element.querySelector('[part~="backdrop"]');
            if (!(backdrop instanceof HTMLElement)) return false;
            const styles = window.getComputedStyle(backdrop);
            return styles.visibility === 'visible' && styles.pointerEvents === 'auto';
          })
        )
        .toBe(true);
    });
  });
}

async function mockContext7Chat(page: Page): Promise<void> {
  await page.route(CONTEXT7_CHAT_ENDPOINT, async (route) => {
    await route.fulfill({
      body: [
        'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"demo"}}\n',
        'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"ok":true}}\n',
        'data: {"type":"text-delta","delta":"Mocked "}\n',
        'data: {"type":"text-delta","delta":"Context7 answer."}\n',
        'data: [DONE]\n'
      ].join(''),
      contentType: 'text/event-stream',
      status: 200
    });
  });
}

function panel(widget: Locator): Locator {
  return widget.locator('[part~="panel"]');
}
