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
