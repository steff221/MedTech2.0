import { describe, it, expect } from "vitest";
import { formatDate, formatTime, initials } from "@/utils/format";

describe("formatDate", () => {
  it("formats a valid ISO date with the default pattern", () => {
    expect(formatDate("2026-05-31")).toBe("May 31, 2026");
  });

  it("accepts a custom pattern", () => {
    expect(formatDate("2026-01-07", "d MMM")).toBe("7 Jan");
  });

  it("returns the original string when the input is invalid", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatTime", () => {
  it("converts 24-h HH:mm to 12-h am/pm", () => {
    expect(formatTime("09:00")).toBe("9:00 AM");
    expect(formatTime("13:30")).toBe("1:30 PM");
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("returns the original string for invalid input", () => {
    expect(formatTime("invalid")).toBe("invalid");
  });
});

describe("initials", () => {
  it("returns uppercase initials from first and last name", () => {
    expect(initials("Stefan", "Perovski")).toBe("SP");
  });

  it("handles empty strings without throwing", () => {
    expect(initials("", "")).toBe("");
    expect(initials("Ana", "")).toBe("A");
  });
});
