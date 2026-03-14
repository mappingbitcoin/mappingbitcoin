import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrismaClient, type MockPrismaClient } from "../helpers/prisma";

// ── Mocks (hoisted before imports) ──────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => {
  const mock = createMockPrismaClient();
  return { default: mock, prisma: mock };
});

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: vi.fn().mockResolvedValue({ id: "email-1" }) };
  },
}));

vi.mock("dns/promises", () => ({
  default: { resolveTxt: vi.fn() },
  resolveTxt: vi.fn(),
}));

vi.mock("@/lib/email/templates", () => ({
  createVerificationCodeEmail: vi.fn().mockReturnValue({
    html: "<p>Code: 123456</p>",
    text: "Code: 123456",
  }),
}));

vi.mock("@/lib/nostr/bot", () => ({
  announceVerification: vi.fn().mockResolvedValue({ success: true, eventId: "nostr-ev-1" }),
  extractNumericId: vi.fn((id: string) => id.replace(/^(node|way|relation):/, "")),
}));

vi.mock("@/app/api/cache/VenueCache", () => ({
  getVenueCache: vi.fn().mockResolvedValue([]),
  getVenueIndexMap: vi.fn().mockResolvedValue({}),
}));

// ── Imports (after mocks) ───────────────────────────────────────────────────

const prismaMod = await import("@/lib/db/prisma");
const prisma = prismaMod.default as unknown as MockPrismaClient;

const dnsMod = await import("dns/promises");
const mockResolveTxt = dnsMod.default.resolveTxt as ReturnType<typeof vi.fn>;

const {
  hashEmail,
  initiateEmailVerification,
  verifyEmailCode,
  checkAndRevokeIfEmailChanged,
  getVerificationStatus,
  initiateDomainVerification,
  checkDomainVerification,
  expirePendingClaims,
} = await import("@/lib/db/services/verification");

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("hashEmail", () => {
  it("produces a hex SHA-256 hash", async () => {
    const hash = await hashEmail("test@example.com");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normalizes to lowercase before hashing", async () => {
    const h1 = await hashEmail("Test@Example.COM");
    const h2 = await hashEmail("test@example.com");
    expect(h1).toBe(h2);
  });

  it("trims whitespace before hashing", async () => {
    const h1 = await hashEmail("  test@example.com  ");
    const h2 = await hashEmail("test@example.com");
    expect(h1).toBe(h2);
  });

  it("different emails produce different hashes", async () => {
    const h1 = await hashEmail("alice@example.com");
    const h2 = await hashEmail("bob@example.com");
    expect(h1).not.toBe(h2);
  });
});

describe("initiateEmailVerification", () => {
  it("creates a claim and returns claimId + expiresAt", async () => {
    prisma.user.upsert.mockResolvedValue({ pubkey: "pk1" });
    prisma.venue.upsert.mockResolvedValue({ id: "node:100" });
    prisma.claim.findFirst.mockResolvedValue(null); // no existing claim
    prisma.claim.create.mockResolvedValue({
      id: "claim-new",
      expiresAt: new Date("2025-01-01"),
    });

    const result = await initiateEmailVerification("node:100", "pk1", "owner@shop.com", "My Shop");

    expect(result.claimId).toBe("claim-new");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(prisma.claim.create).toHaveBeenCalledOnce();
  });

  it("updates existing pending EMAIL claim instead of creating new one", async () => {
    prisma.user.upsert.mockResolvedValue({ pubkey: "pk1" });
    prisma.venue.upsert.mockResolvedValue({ id: "node:100" });
    prisma.claim.findFirst.mockResolvedValue({ id: "existing-claim" });
    prisma.claim.update.mockResolvedValue({
      id: "existing-claim",
      expiresAt: new Date("2025-01-01"),
    });

    const result = await initiateEmailVerification("node:100", "pk1", "owner@shop.com");

    expect(result.claimId).toBe("existing-claim");
    expect(prisma.claim.update).toHaveBeenCalledOnce();
    expect(prisma.claim.create).not.toHaveBeenCalled();
  });
});

describe("verifyEmailCode", () => {
  it("returns error when claim not found", async () => {
    prisma.claim.findUnique.mockResolvedValue(null);
    const result = await verifyEmailCode("bad-id", "123456", "a@b.com");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns error when claim is not pending", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      status: "VERIFIED",
      verificationAttempts: 0,
    });
    const result = await verifyEmailCode("c1", "123456", "a@b.com");
    expect(result.success).toBe(false);
    expect(result.error).toContain("no longer pending");
  });

  it("returns error when max attempts exceeded", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      verificationAttempts: 5,
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await verifyEmailCode("c1", "123456", "a@b.com");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Maximum verification attempts");
  });

  it("returns error when code expired", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      verificationAttempts: 0,
      expiresAt: new Date(Date.now() - 60000), // expired
    });
    const result = await verifyEmailCode("c1", "123456", "a@b.com");
    expect(result.success).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("returns error for wrong code and decrements remaining", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      verificationCode: "999999",
      verificationAttempts: 1,
      expiresAt: new Date(Date.now() + 60000),
    });
    prisma.claim.update.mockResolvedValue({});

    const result = await verifyEmailCode("c1", "000000", "a@b.com");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid code");
    expect(result.error).toContain("attempts remaining");
  });

  it("succeeds with correct code", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      verificationCode: "123456",
      verificationAttempts: 0,
      expiresAt: new Date(Date.now() + 60000),
    });
    prisma.claim.update.mockResolvedValue({
      id: "c1",
      status: "VERIFIED",
      venue: { id: "node:100" },
      claimerPubkey: "pk1",
    });

    const result = await verifyEmailCode("c1", "123456", "owner@shop.com");

    expect(result.success).toBe(true);
    // Called 3 times: increment attempts, VERIFIED update, and nostrEventId update (from announceVerification .then())
    // Wait for the async announceVerification callback
    await new Promise((r) => setTimeout(r, 10));
    expect(prisma.claim.update).toHaveBeenCalledTimes(3);
  });
});

describe("checkAndRevokeIfEmailChanged", () => {
  it("returns revoked: false when venue not found", async () => {
    prisma.venue.findUnique.mockResolvedValue(null);
    const result = await checkAndRevokeIfEmailChanged("node:999", "a@b.com");
    expect(result.revoked).toBe(false);
  });

  it("returns revoked: false when no verified claims", async () => {
    prisma.venue.findUnique.mockResolvedValue({ id: "node:1", claims: [] });
    const result = await checkAndRevokeIfEmailChanged("node:1", "a@b.com");
    expect(result.revoked).toBe(false);
  });

  it("returns revoked: false when no emailHash on claim", async () => {
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [{ id: "c1", verifiedEmailHash: null }],
    });
    const result = await checkAndRevokeIfEmailChanged("node:1", "a@b.com");
    expect(result.revoked).toBe(false);
  });

  it("returns revoked: false when email hash matches", async () => {
    const currentHash = await hashEmail("owner@shop.com");
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [{ id: "c1", verifiedEmailHash: currentHash }],
    });

    const result = await checkAndRevokeIfEmailChanged("node:1", "owner@shop.com");
    expect(result.revoked).toBe(false);
  });

  it("revokes when email hash does not match", async () => {
    const oldHash = await hashEmail("old@shop.com");
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [{ id: "c1", verifiedEmailHash: oldHash }],
    });
    prisma.claim.update.mockResolvedValue({});

    const result = await checkAndRevokeIfEmailChanged("node:1", "new@shop.com");
    expect(result.revoked).toBe(true);
    expect(result.claimId).toBe("c1");
    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: {
        status: "EXPIRED",
        revokedAt: expect.any(Date),
        revokedReason: "email_changed",
      },
    });
  });
});

describe("getVerificationStatus", () => {
  it("returns isVerified: false when venue not found", async () => {
    prisma.venue.findUnique.mockResolvedValue(null);
    const result = await getVerificationStatus("node:999");
    expect(result.isVerified).toBe(false);
  });

  it("returns isVerified: false when no verified claims", async () => {
    prisma.venue.findUnique.mockResolvedValue({ id: "node:1", claims: [] });
    const result = await getVerificationStatus("node:1");
    expect(result.isVerified).toBe(false);
  });

  it("returns verification details when verified", async () => {
    const verifiedAt = new Date("2024-06-01");
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [
        {
          method: "EMAIL",
          verifiedAt,
          claimerPubkey: "pk1",
          domainToVerify: null,
          claimer: { pubkey: "pk1" },
        },
      ],
    });

    const result = await getVerificationStatus("node:1");
    expect(result.isVerified).toBe(true);
    expect(result.ownerPubkey).toBe("pk1");
    expect(result.methods).toHaveLength(1);
    expect(result.methods![0].method).toBe("EMAIL");
  });

  it("includes domain detail for DOMAIN method", async () => {
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [
        {
          method: "DOMAIN",
          verifiedAt: new Date(),
          claimerPubkey: "pk1",
          domainToVerify: "myshop.com",
          claimer: { pubkey: "pk1" },
        },
      ],
    });

    const result = await getVerificationStatus("node:1");
    expect(result.methods![0].detail).toBe("myshop.com");
  });
});

describe("initiateDomainVerification", () => {
  it("creates a domain claim with TXT record value", async () => {
    prisma.user.upsert.mockResolvedValue({ pubkey: "pk1" });
    prisma.venue.upsert.mockResolvedValue({ id: "node:200" });
    prisma.claim.findFirst.mockResolvedValue(null);
    prisma.claim.create.mockResolvedValue({
      id: "domain-claim-1",
      txtRecordValue: "mappingbitcoin-verify=abc123",
      expiresAt: new Date("2025-01-02"),
    });

    const result = await initiateDomainVerification("node:200", "pk1", "myshop.com");

    expect(result.claimId).toBe("domain-claim-1");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(prisma.claim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: "DOMAIN",
          domainToVerify: "myshop.com",
        }),
      })
    );
  });

  it("updates existing pending domain claim", async () => {
    prisma.user.upsert.mockResolvedValue({ pubkey: "pk1" });
    prisma.venue.upsert.mockResolvedValue({ id: "node:200" });
    prisma.claim.findFirst.mockResolvedValue({ id: "old-claim" });
    prisma.claim.update.mockResolvedValue({
      id: "old-claim",
      txtRecordValue: "mappingbitcoin-verify=new",
      expiresAt: new Date("2025-01-02"),
    });

    const result = await initiateDomainVerification("node:200", "pk1", "myshop.com");
    expect(result.claimId).toBe("old-claim");
    expect(prisma.claim.update).toHaveBeenCalledOnce();
  });
});

describe("checkDomainVerification", () => {
  it("returns error when claim not found", async () => {
    prisma.claim.findUnique.mockResolvedValue(null);
    const result = await checkDomainVerification("bad-id", "pk1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns error when pubkey doesn't match", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk-other",
      status: "PENDING",
      method: "DOMAIN",
    });
    const result = await checkDomainVerification("c1", "pk-wrong");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Not authorized");
  });

  it("returns error when not pending", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "VERIFIED",
      method: "DOMAIN",
    });
    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("no longer pending");
  });

  it("returns error when not a domain method", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "EMAIL",
    });
    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not a domain verification");
  });

  it("expires claim when past expiresAt", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "DOMAIN",
      expiresAt: new Date(Date.now() - 60000),
    });
    prisma.claim.update.mockResolvedValue({});

    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("respects rate limiting (nextCheckAt in future)", async () => {
    const futureDate = new Date(Date.now() + 30000);
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "DOMAIN",
      expiresAt: new Date(Date.now() + 86400000),
      nextCheckAt: futureDate,
      checkCount: 1,
      domainToVerify: "test.com",
      txtRecordValue: "mappingbitcoin-verify=abc",
    });

    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("wait");
    expect(result.cooldownSeconds).toBeGreaterThan(0);
  });

  it("verifies when TXT record matches", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "DOMAIN",
      expiresAt: new Date(Date.now() + 86400000),
      nextCheckAt: null,
      checkCount: 0,
      domainToVerify: "myshop.com",
      txtRecordValue: "mappingbitcoin-verify=abc123",
    });
    prisma.claim.update.mockResolvedValue({
      id: "c1",
      status: "VERIFIED",
      venue: { id: "node:200" },
      claimerPubkey: "pk1",
    });

    mockResolveTxt.mockResolvedValue([["mappingbitcoin-verify=abc123"]]);

    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
  });

  it("returns verified: false when TXT record not found", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "DOMAIN",
      expiresAt: new Date(Date.now() + 86400000),
      nextCheckAt: null,
      checkCount: 0,
      domainToVerify: "myshop.com",
      txtRecordValue: "mappingbitcoin-verify=abc123",
    });
    prisma.claim.update.mockResolvedValue({});

    mockResolveTxt.mockResolvedValue([["v=spf1 include:_spf.google.com"]]);

    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(true);
    expect(result.verified).toBe(false);
  });

  it("handles DNS lookup failure gracefully", async () => {
    prisma.claim.findUnique.mockResolvedValue({
      id: "c1",
      claimerPubkey: "pk1",
      status: "PENDING",
      method: "DOMAIN",
      expiresAt: new Date(Date.now() + 86400000),
      nextCheckAt: null,
      checkCount: 0,
      domainToVerify: "nonexistent.example",
      txtRecordValue: "mappingbitcoin-verify=abc123",
    });
    prisma.claim.update.mockResolvedValue({});

    mockResolveTxt.mockRejectedValue(new Error("NXDOMAIN"));

    const result = await checkDomainVerification("c1", "pk1");
    expect(result.success).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.error).toContain("Could not find TXT records");
  });
});

describe("expirePendingClaims", () => {
  it("updates expired pending claims to EXPIRED status", async () => {
    prisma.claim.updateMany.mockResolvedValue({ count: 3 });
    const count = await expirePendingClaims();

    expect(count).toBe(3);
    expect(prisma.claim.updateMany).toHaveBeenCalledWith({
      where: {
        status: "PENDING",
        expiresAt: { lt: expect.any(Date) },
      },
      data: { status: "EXPIRED" },
    });
  });

  it("returns 0 when no claims to expire", async () => {
    prisma.claim.updateMany.mockResolvedValue({ count: 0 });
    const count = await expirePendingClaims();
    expect(count).toBe(0);
  });
});
