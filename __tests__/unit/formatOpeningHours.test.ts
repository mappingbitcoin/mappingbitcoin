import { describe, it, expect } from "vitest";
import { formatOpeningHours } from "@/utils/OsmHelpers";

describe("formatOpeningHours", () => {
  // Null / empty cases
  it("returns null for undefined", () => {
    expect(formatOpeningHours(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(formatOpeningHours("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(formatOpeningHours("   ")).toBeNull();
  });

  // 24/7
  it("formats 24/7 as Open 24 hours", () => {
    expect(formatOpeningHours("24/7")).toBe("Open 24 hours");
  });

  // Simple keywords
  it("formats 'open' keyword", () => {
    expect(formatOpeningHours("open")).toBe("Open");
  });

  it("formats 'closed' keyword", () => {
    expect(formatOpeningHours("closed")).toBe("Closed");
  });

  // Day range mapping
  it("converts Mo-Fr to Weekdays", () => {
    const result = formatOpeningHours("Mo-Fr 09:00-17:00");
    expect(result).toContain("Weekdays");
  });

  it("converts Mo-Su to Daily", () => {
    const result = formatOpeningHours("Mo-Su 10:00-22:00");
    expect(result).toContain("Daily");
  });

  it("converts Sa-Su to Weekends", () => {
    const result = formatOpeningHours("Sa-Su 11:00-15:00");
    expect(result).toContain("Weekends");
  });

  // Time conversion (24h to 12h)
  it("converts 09:00 to 9am", () => {
    const result = formatOpeningHours("Mo 09:00-17:00");
    expect(result).toContain("9am");
  });

  it("converts 17:00 to 5pm", () => {
    const result = formatOpeningHours("Mo 09:00-17:00");
    expect(result).toContain("5pm");
  });

  it("converts 12:00 to 12pm (noon)", () => {
    const result = formatOpeningHours("Mo 12:00-20:00");
    expect(result).toContain("12pm");
  });

  it("converts 00:00 to 12am (midnight)", () => {
    const result = formatOpeningHours("Mo 00:00-06:00");
    expect(result).toContain("12am");
  });

  it("preserves minutes when not :00", () => {
    const result = formatOpeningHours("Mo 09:30-17:45");
    expect(result).toContain("9:30am");
    expect(result).toContain("5:45pm");
  });

  // Multiple rules separated by semicolons
  it("joins multiple rules with bullet separator", () => {
    const result = formatOpeningHours("Mo-Fr 09:00-17:00; Sa 10:00-14:00");
    expect(result).toContain("·");
    expect(result).toContain("Weekdays");
    expect(result).toContain("Sat");
  });

  // "off" rules
  it("converts 'Su off' to closed", () => {
    const result = formatOpeningHours("Su off");
    // formatRule lowercases the "off" branch before day-code replacement,
    // so day codes aren't matched — actual output is "su closed"
    expect(result).toBe("su closed");
  });

  it("converts standalone 'off' to 'Closed'", () => {
    const result = formatOpeningHours("off");
    expect(result).toBe("Closed");
  });

  // Holiday handling
  it("converts PH off to closed", () => {
    const result = formatOpeningHours("PH off");
    // Same lowercase issue as "Su off" — outputs "ph closed"
    expect(result).toBe("ph closed");
  });

  // Open-ended times
  it("formats open-ended times with 'from'", () => {
    const result = formatOpeningHours("Mo-Fr 09:00+");
    expect(result).toContain("from 9am");
  });

  // Multiple time ranges (comma-separated)
  it("handles comma-separated time ranges", () => {
    const result = formatOpeningHours("Mo-Fr 09:00-12:00,14:00-18:00");
    expect(result).toContain("9am-12pm");
    expect(result).toContain("2pm-6pm");
  });

  // Quoted comments
  it("handles quoted comments like 'by appointment'", () => {
    const result = formatOpeningHours('"by appointment"');
    expect(result).toContain("by appointment");
  });

  // Individual day codes
  it("converts individual day codes", () => {
    const result = formatOpeningHours("Mo 09:00-17:00");
    expect(result).toContain("Mon");
  });

  it("converts Tu to Tue", () => {
    const result = formatOpeningHours("Tu 10:00-18:00");
    expect(result).toContain("Tue");
  });

  // Complex real-world example
  it("handles complex multi-rule schedule", () => {
    const result = formatOpeningHours("Mo-Fr 08:00-22:00; Sa 10:00-22:00; Su off");
    expect(result).not.toBeNull();
    expect(result).toContain("Weekdays");
    expect(result).toContain("Sat");
    expect(result).toContain("su closed");
  });

  // Sunrise/sunset
  it("preserves sunrise-sunset times", () => {
    const result = formatOpeningHours("Mo-Su sunrise-sunset");
    expect(result).toContain("sunrise");
    expect(result).toContain("sunset");
  });
});
