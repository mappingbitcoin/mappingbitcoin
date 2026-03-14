import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIP } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  const config = { maxRequests: 3, windowMs: 60000 };

  it("allows requests under the limit", () => {
    const id = `test-under-${Date.now()}`;
    const r1 = checkRateLimit(id, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.limit).toBe(3);
  });

  it("tracks remaining requests correctly", () => {
    const id = `test-track-${Date.now()}`;
    checkRateLimit(id, config);
    const r2 = checkRateLimit(id, config);
    expect(r2.remaining).toBe(1);
    const r3 = checkRateLimit(id, config);
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const id = `test-over-${Date.now()}`;
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const r4 = checkRateLimit(id, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("different identifiers have independent limits", () => {
    const id1 = `test-a-${Date.now()}`;
    const id2 = `test-b-${Date.now()}`;
    checkRateLimit(id1, config);
    checkRateLimit(id1, config);
    checkRateLimit(id1, config);

    const r = checkRateLimit(id2, config);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("includes resetAt timestamp in the future", () => {
    const id = `test-reset-${Date.now()}`;
    const r = checkRateLimit(id, config);
    expect(r.resetAt).toBeGreaterThan(Date.now());
  });
});

describe("getClientIP", () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request("https://example.com", {
      headers: new Headers(headers),
    });
  }

  it("prefers cf-connecting-ip (Cloudflare)", () => {
    const req = makeRequest({
      "cf-connecting-ip": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
      "x-forwarded-for": "9.10.11.12",
    });
    expect(getClientIP(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = makeRequest({
      "x-real-ip": "5.6.7.8",
      "x-forwarded-for": "9.10.11.12",
    });
    expect(getClientIP(req)).toBe("5.6.7.8");
  });

  it("uses last IP from x-forwarded-for (rightmost = trusted proxy)", () => {
    const req = makeRequest({
      "x-forwarded-for": "spoofed.ip, 10.0.0.1, 192.168.1.1",
    });
    expect(getClientIP(req)).toBe("192.168.1.1");
  });

  it("returns 'unknown' when no headers present", () => {
    const req = makeRequest({});
    expect(getClientIP(req)).toBe("unknown");
  });

  it("trims whitespace from IPs", () => {
    const req = makeRequest({ "cf-connecting-ip": "  1.2.3.4  " });
    expect(getClientIP(req)).toBe("1.2.3.4");
  });
});
