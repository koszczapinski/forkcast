import { describe, expect, it } from "vitest";
import { formatServings } from "./format-servings";

// Test-first example: these cases describe formatServings. Approved tests stay locked.
describe("formatServings", () => {
  it("uses the singular for one serving", () => {
    expect(formatServings(1)).toBe("1 serving");
  });

  it("uses the plural for zero and for many", () => {
    expect(formatServings(0)).toBe("0 servings");
    expect(formatServings(4)).toBe("4 servings");
  });

  it("rejects a value that is not a non-negative integer", () => {
    expect(() => formatServings(-1)).toThrow(/non-negative integer/);
    expect(() => formatServings(1.5)).toThrow(/non-negative integer/);
  });
});
