import { describe, expect, it } from "vitest";
import {
  cn,
  formatCompact,
  formatDuration,
  titleCase,
  truncate,
} from "./utils";

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("a", "b", false && "c")).toBe("a b");
  });

  it("formats durations", () => {
    expect(formatDuration(500)).toBe("500 ms");
    expect(formatDuration(1500)).toBe("1.5 s");
    expect(formatDuration(90000)).toBe("1m 30s");
  });

  it("compacts numbers", () => {
    expect(formatCompact(1200)).toBe("1.2K");
  });

  it("title-cases and truncates", () => {
    expect(titleCase("hello_world")).toBe("Hello World");
    expect(truncate("abcdef", 4)).toBe("abc…");
  });
});
