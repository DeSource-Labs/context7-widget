import { afterEach, describe, expect, it } from "vitest";
import {
  buildContext7WidgetScriptTag,
  mountContext7Widget,
  toContext7WidgetAttributes
} from "../src";

describe("core helpers", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("maps JavaScript options to widget attributes", () => {
    expect(
      toContext7WidgetAttributes({
        color: "#111827",
        hideDefaultButton: true,
        library: "/vercel/next.js",
        placeholder: "Ask docs",
        theme: "dark"
      })
    ).toEqual({
      color: "#111827",
      "hide-default-button": "",
      library: "/vercel/next.js",
      placeholder: "Ask docs",
      theme: "dark"
    });
  });

  it("mounts a widget into a target", () => {
    const target = document.createElement("div");
    target.id = "widget-root";
    document.body.append(target);

    const widget = mountContext7Widget(
      {
        library: "/desource-labs/context7-widget",
        title: "Docs assistant",
        widgetId: "docs"
      },
      "#widget-root"
    );

    expect(target.firstElementChild).toBe(widget);
    expect(widget.getAttribute("library")).toBe("/desource-labs/context7-widget");
    expect(widget.getAttribute("title")).toBe("Docs assistant");
    expect(widget.getAttribute("widget-id")).toBe("docs");
  });

  it("builds safe script tags for copy-paste installs", () => {
    expect(
      buildContext7WidgetScriptTag({
        color: "#16a34a",
        hideDefaultButton: true,
        library: "/desource-labs/context7-widget",
        placeholder: "Ask \"docs\""
      })
    ).toBe(
      '<script src="https://context7.desource-labs.org/widget.js" async data-color="#16a34a" data-library="/desource-labs/context7-widget" data-placeholder="Ask &quot;docs&quot;" data-hide-default-button="true"></script>'
    );
  });
});
