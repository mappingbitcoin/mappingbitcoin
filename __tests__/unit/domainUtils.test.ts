import { describe, it, expect } from "vitest";
import {
  extractDomainFromUrl,
  extractDomainFromEmail,
  isBlockedEmailDomain,
  getVerifiableDomains,
  hasVerifiableDomain,
  canVerifyVenue,
} from "@/lib/verification/domainUtils";

describe("extractDomainFromUrl", () => {
  it("extracts domain from https URL", () => {
    expect(extractDomainFromUrl("https://example.com/path")).toBe("example.com");
  });

  it("extracts domain from http URL", () => {
    expect(extractDomainFromUrl("http://shop.example.com")).toBe("shop.example.com");
  });

  it("strips www prefix", () => {
    expect(extractDomainFromUrl("https://www.example.com")).toBe("example.com");
  });

  it("adds https:// when missing", () => {
    expect(extractDomainFromUrl("example.com")).toBe("example.com");
  });

  it("handles whitespace", () => {
    expect(extractDomainFromUrl("  https://example.com  ")).toBe("example.com");
  });

  it("returns null for invalid URL", () => {
    expect(extractDomainFromUrl("not a url at all!!!")).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(extractDomainFromUrl("")).toBe(null);
  });
});

describe("extractDomainFromEmail", () => {
  it("extracts custom domain from email", () => {
    expect(extractDomainFromEmail("owner@mybusiness.com")).toBe("mybusiness.com");
  });

  it("returns null for blocked provider (gmail)", () => {
    expect(extractDomainFromEmail("user@gmail.com")).toBe(null);
  });

  it("returns null for blocked provider (protonmail)", () => {
    expect(extractDomainFromEmail("user@protonmail.com")).toBe(null);
  });

  it("normalizes to lowercase", () => {
    expect(extractDomainFromEmail("User@MyBusiness.COM")).toBe("mybusiness.com");
  });

  it("trims whitespace", () => {
    expect(extractDomainFromEmail("  user@mybusiness.com  ")).toBe("mybusiness.com");
  });

  it("returns null for missing @ sign", () => {
    expect(extractDomainFromEmail("nodomain")).toBe(null);
  });

  it("returns null when @ is last character", () => {
    expect(extractDomainFromEmail("user@")).toBe(null);
  });

  it("uses last @ for edge case emails", () => {
    expect(extractDomainFromEmail("weird@name@mybusiness.com")).toBe("mybusiness.com");
  });
});

describe("isBlockedEmailDomain", () => {
  it("returns true for gmail", () => {
    expect(isBlockedEmailDomain("user@gmail.com")).toBe(true);
  });

  it("returns true for outlook", () => {
    expect(isBlockedEmailDomain("user@outlook.com")).toBe(true);
  });

  it("returns true for yahoo", () => {
    expect(isBlockedEmailDomain("user@yahoo.com")).toBe(true);
  });

  it("returns false for custom domain", () => {
    expect(isBlockedEmailDomain("owner@mybusiness.com")).toBe(false);
  });

  it("returns true for invalid email (no @)", () => {
    expect(isBlockedEmailDomain("nodomain")).toBe(true);
  });

  it("returns true for email ending with @", () => {
    expect(isBlockedEmailDomain("user@")).toBe(true);
  });
});

describe("getVerifiableDomains", () => {
  it("returns empty array for undefined tags", () => {
    expect(getVerifiableDomains(undefined)).toEqual([]);
  });

  it("returns empty array for tags with no website/email", () => {
    expect(getVerifiableDomains({ name: "Test" })).toEqual([]);
  });

  it("extracts domain from website tag", () => {
    const result = getVerifiableDomains({ website: "https://example.com" });
    expect(result).toEqual([{ domain: "example.com", source: "website" }]);
  });

  it("extracts domain from contact:website tag", () => {
    const result = getVerifiableDomains({ "contact:website": "https://shop.example.com" });
    expect(result).toEqual([{ domain: "shop.example.com", source: "website" }]);
  });

  it("extracts domain from custom email", () => {
    const result = getVerifiableDomains({ email: "info@mybusiness.com" });
    expect(result).toEqual([{ domain: "mybusiness.com", source: "email" }]);
  });

  it("ignores blocked email domains", () => {
    const result = getVerifiableDomains({ email: "info@gmail.com" });
    expect(result).toEqual([]);
  });

  it("deduplicates when website and email share domain", () => {
    const result = getVerifiableDomains({
      website: "https://mybusiness.com",
      email: "info@mybusiness.com",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ domain: "mybusiness.com", source: "website" });
  });

  it("returns both when website and email have different domains", () => {
    const result = getVerifiableDomains({
      website: "https://website.com",
      email: "info@emaildomain.com",
    });
    expect(result).toHaveLength(2);
  });
});

describe("hasVerifiableDomain", () => {
  it("returns false for undefined tags", () => {
    expect(hasVerifiableDomain(undefined)).toBe(false);
  });

  it("returns true when website is present", () => {
    expect(hasVerifiableDomain({ website: "https://example.com" })).toBe(true);
  });

  it("returns false when only blocked email present", () => {
    expect(hasVerifiableDomain({ email: "user@gmail.com" })).toBe(false);
  });
});

describe("canVerifyVenue", () => {
  it("returns false for undefined tags", () => {
    expect(canVerifyVenue(undefined)).toBe(false);
  });

  it("returns true when email tag is present (even blocked domain)", () => {
    // canVerifyVenue returns true for ANY email because email code verification
    // works regardless of domain (sends code to that email)
    expect(canVerifyVenue({ email: "user@gmail.com" })).toBe(true);
  });

  it("returns true when contact:email is present", () => {
    expect(canVerifyVenue({ "contact:email": "user@gmail.com" })).toBe(true);
  });

  it("returns true when website has verifiable domain", () => {
    expect(canVerifyVenue({ website: "https://example.com" })).toBe(true);
  });

  it("returns false when no email or website", () => {
    expect(canVerifyVenue({ name: "Test", phone: "555-0100" })).toBe(false);
  });
});
