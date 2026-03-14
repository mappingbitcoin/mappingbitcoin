import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrismaClient, type MockPrismaClient } from "../helpers/prisma";

// Mock prisma before importing the service
vi.mock("@/lib/db/prisma", () => {
  const mock = createMockPrismaClient();
  return { default: mock, prisma: mock };
});

// Must import AFTER vi.mock
const prismaMod = await import("@/lib/db/prisma");
const prisma = prismaMod.default as unknown as MockPrismaClient;

const {
  createClaim,
  updateClaimStatus,
  revokeClaim,
  getActiveVerifiedClaimByOsmId,
  getPendingClaimsByOsmId,
  getVerifiedClaimByOsmId,
  getClaimsByPubkey,
  incrementClaimAttempts,
  setClaimEmailHash,
  getClaimById,
} = await import("@/lib/db/services/claims");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createClaim", () => {
  it("runs inside a transaction", async () => {
    // The $transaction mock calls the callback with a fresh mock client
    prisma.$transaction.mockImplementation(async (fn: (tx: MockPrismaClient) => unknown) => {
      const tx = createMockPrismaClient();
      tx.venue.upsert.mockResolvedValue({ id: "node:123" });
      tx.user.upsert.mockResolvedValue({ pubkey: "abc123" });
      tx.claim.create.mockResolvedValue({
        id: "claim-1",
        venueId: "node:123",
        claimerPubkey: "abc123",
        method: "EMAIL",
      });
      return fn(tx);
    });

    const result = await createClaim({
      osmId: "node:123",
      claimerPubkey: "abc123",
      method: "EMAIL" as const,
      verificationCode: "123456",
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ id: "claim-1", method: "EMAIL" });
  });
});

describe("updateClaimStatus", () => {
  it("sets status and verifiedAt when VERIFIED", async () => {
    prisma.claim.update.mockResolvedValue({
      id: "claim-1",
      status: "VERIFIED",
      verifiedAt: new Date("2024-01-01"),
    });

    await updateClaimStatus("claim-1", "VERIFIED" as const);

    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "claim-1" },
      data: {
        status: "VERIFIED",
        verifiedAt: expect.any(Date),
      },
    });
  });

  it("does not set verifiedAt for non-VERIFIED status", async () => {
    prisma.claim.update.mockResolvedValue({ id: "claim-1", status: "EXPIRED" });

    await updateClaimStatus("claim-1", "EXPIRED" as const);

    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "claim-1" },
      data: {
        status: "EXPIRED",
        verifiedAt: undefined,
      },
    });
  });
});

describe("incrementClaimAttempts", () => {
  it("increments verificationAttempts by 1", async () => {
    prisma.claim.update.mockResolvedValue({ id: "claim-1", verificationAttempts: 2 });

    await incrementClaimAttempts("claim-1");

    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "claim-1" },
      data: { verificationAttempts: { increment: 1 } },
    });
  });
});

describe("revokeClaim", () => {
  it("sets status to EXPIRED with revokedAt and reason", async () => {
    prisma.claim.update.mockResolvedValue({
      id: "claim-1",
      status: "EXPIRED",
      revokedAt: new Date(),
      revokedReason: "email_changed",
    });

    await revokeClaim("claim-1", "email_changed");

    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "claim-1" },
      data: {
        status: "EXPIRED",
        revokedAt: expect.any(Date),
        revokedReason: "email_changed",
      },
    });
  });
});

describe("getActiveVerifiedClaimByOsmId", () => {
  it("returns the verified non-revoked claim", async () => {
    const mockClaim = {
      id: "claim-1",
      status: "VERIFIED",
      revokedAt: null,
      claimer: { pubkey: "abc123" },
    };
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:123",
      claims: [mockClaim],
    });

    const result = await getActiveVerifiedClaimByOsmId("node:123");

    expect(result).toMatchObject({ id: "claim-1" });
    expect(prisma.venue.findUnique).toHaveBeenCalledWith({
      where: { id: "node:123" },
      include: {
        claims: {
          where: { status: "VERIFIED", revokedAt: null },
          include: { claimer: true },
          take: 1,
        },
      },
    });
  });

  it("returns null when venue not found", async () => {
    prisma.venue.findUnique.mockResolvedValue(null);
    const result = await getActiveVerifiedClaimByOsmId("node:999");
    expect(result).toBeNull();
  });

  it("returns null when no verified claims exist", async () => {
    prisma.venue.findUnique.mockResolvedValue({ id: "node:123", claims: [] });
    const result = await getActiveVerifiedClaimByOsmId("node:123");
    expect(result).toBeNull();
  });
});

describe("getPendingClaimsByOsmId", () => {
  it("returns pending claims for a venue", async () => {
    const mockClaims = [
      { id: "c1", status: "PENDING", claimer: { pubkey: "p1" } },
      { id: "c2", status: "PENDING", claimer: { pubkey: "p2" } },
    ];
    prisma.venue.findUnique.mockResolvedValue({ id: "node:1", claims: mockClaims });

    const result = await getPendingClaimsByOsmId("node:1");
    expect(result).toHaveLength(2);
  });

  it("returns empty array when venue not found", async () => {
    prisma.venue.findUnique.mockResolvedValue(null);
    const result = await getPendingClaimsByOsmId("node:999");
    expect(result).toEqual([]);
  });
});

describe("getVerifiedClaimByOsmId", () => {
  it("returns first verified claim", async () => {
    prisma.venue.findUnique.mockResolvedValue({
      id: "node:1",
      claims: [{ id: "c1", status: "VERIFIED" }],
    });
    const result = await getVerifiedClaimByOsmId("node:1");
    expect(result).toMatchObject({ id: "c1" });
  });

  it("returns null when no verified claims", async () => {
    prisma.venue.findUnique.mockResolvedValue({ id: "node:1", claims: [] });
    const result = await getVerifiedClaimByOsmId("node:1");
    expect(result).toBeNull();
  });
});

describe("getClaimsByPubkey", () => {
  it("queries claims by pubkey", async () => {
    prisma.claim.findMany.mockResolvedValue([{ id: "c1", claimerPubkey: "pk1" }]);
    const result = await getClaimsByPubkey("pk1");
    expect(result).toHaveLength(1);
    expect(prisma.claim.findMany).toHaveBeenCalledWith({
      where: { claimerPubkey: "pk1" },
      include: { venue: true },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("setClaimEmailHash", () => {
  it("updates the verifiedEmailHash field", async () => {
    prisma.claim.update.mockResolvedValue({ id: "c1", verifiedEmailHash: "abc" });
    await setClaimEmailHash("c1", "abc");
    expect(prisma.claim.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { verifiedEmailHash: "abc" },
    });
  });
});

describe("getClaimById", () => {
  it("finds claim with claimer and venue included", async () => {
    prisma.claim.findUnique.mockResolvedValue({ id: "c1", claimer: {}, venue: {} });
    await getClaimById("c1");
    expect(prisma.claim.findUnique).toHaveBeenCalledWith({
      where: { id: "c1" },
      include: { claimer: true, venue: true },
    });
  });
});
