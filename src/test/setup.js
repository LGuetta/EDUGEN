import React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
} else {
  vi.spyOn(globalThis.URL, "createObjectURL").mockImplementation(() => "blob:mock-url");
}

if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = vi.fn();
} else {
  vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => {});
}

Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("framer-motion", () => {
  const createComponent = (tag) =>
    React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(tag, { ref, ...props }, children),
    );

  return {
    motion: new Proxy(
      {},
      {
        get: (_, key) => createComponent(key),
      },
    ),
  };
});
