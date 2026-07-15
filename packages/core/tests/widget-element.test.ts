import { afterEach, describe, expect, it, vi } from "vitest";
import { defineContext7Widget } from "../src";

describe("Context7WidgetElement", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("registers a global API and sends questions", async () => {
    defineContext7Widget();

    vi.stubGlobal("fetch", vi.fn(async () => new Response(stream([
      'data: {"type":"text-delta","delta":"Use the app router."}\n'
    ]))));

    const questions: string[] = [];
    document.addEventListener("c7:question", (event) => {
      questions.push((event as CustomEvent).detail.question);
    });

    const widget = document.createElement("context7-widget");
    widget.setAttribute("library", "/vercel/next.js");
    document.body.append(widget);

    await window.Context7Widget?.send("How do layouts work?");

    expect(questions).toEqual(["How do layouts work?"]);
    expect(window.Context7Widget?.isOpen()).toBe(true);
    expect(widget.shadowRoot?.textContent).toContain("Use the app router.");
  });

  it("supports custom trigger clicks", () => {
    defineContext7Widget();

    const trigger = document.createElement("button");
    trigger.id = "ask";
    document.body.append(trigger);

    const widget = document.createElement("context7-widget");
    widget.setAttribute("library", "/vercel/next.js");
    widget.setAttribute("custom-trigger", "#ask");
    document.body.append(widget);

    trigger.click();

    expect(widget.hasAttribute("open")).toBe(true);
  });

  it("closes when clicking outside by default", () => {
    defineContext7Widget();

    const widget = document.createElement("context7-widget");
    widget.setAttribute("library", "/vercel/next.js");
    document.body.append(widget);

    (widget as HTMLElement & { open: () => void }).open();
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, composed: true }));

    expect(widget.hasAttribute("open")).toBe(false);
  });

  it("supports modal backdrop and preset attributes", () => {
    defineContext7Widget();

    const widget = document.createElement("context7-widget");
    widget.setAttribute("library", "/vercel/next.js");
    widget.setAttribute("position", "center");
    widget.setAttribute("preset", "glass");
    document.body.append(widget);

    (widget as HTMLElement & { open: () => void }).open();

    expect(widget.getAttribute("position")).toBe("center");
    expect(widget.getAttribute("preset")).toBe("glass");
    expect(widget.hasAttribute("backdrop-active")).toBe(true);

    widget.shadowRoot?.querySelector<HTMLElement>("[data-c7-backdrop]")?.click();

    expect(widget.hasAttribute("open")).toBe(false);
  });

  it("lets presets own the accent color when no color is provided", () => {
    defineContext7Widget();

    const widget = document.createElement("context7-widget");
    widget.setAttribute("library", "/vercel/next.js");
    widget.setAttribute("preset", "neo");
    document.body.append(widget);

    expect(widget.style.getPropertyValue("--c7-accent")).toBe("");

    widget.setAttribute("color", "#123456");
    expect(widget.style.getPropertyValue("--c7-accent")).toBe("#123456");

    widget.removeAttribute("color");
    expect(widget.style.getPropertyValue("--c7-accent")).toBe("");
  });
});

function stream(values: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const value of values) {
        controller.enqueue(encoder.encode(value));
      }
      controller.close();
    }
  });
}
