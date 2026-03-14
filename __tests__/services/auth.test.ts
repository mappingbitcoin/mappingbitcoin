import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrismaClient, type MockPrismaClient } from "../helpers/prisma";

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => {
  const mock = createMockPrismaClient();
  // Add authChallenge model to the mock
  const authChallenge = {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  (mock as Record<string, unknown>).authChallenge = authChallenge;
  // $transaction passes the same mock (with authChallenge) to the callback
  (mock as Record<string, unknown>).$transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn(mock);
  });
  return { default: mock, prisma: mock };
});

const prismaMod = await import("@/lib/db/prisma");
const prisma = prismaMod.default as unknown as MockPrismaClient & {
  authChallenge: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const {
  createChallenge,
  verifyChallenge,
  consumeChallenge,
  verifyAndConsumeChallenge,
  atomicVerifyAndConsume,
  createAuthToken,
  validateAuthToken,
  cleanupExpiredChallenges,
} = await import("@/lib/db/services/auth");

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createChallenge ─────────────────────────────────────────────────────────

describe("createChallenge", () => {
  it("cleans up unused challenges for the pubkey first", async () => {
    prisma.authChallenge.deleteMany.mockResolvedValue({ count: 0 });
    prisma.authChallenge.create.mockResolvedValue({
      challenge: "abc",
      expiresAt: new Date(),
    });

    await createChallenge("deadbeef".repeat(8));

    expect(prisma.authChallenge.deleteMany).toHaveBeenCalledWith({
      where: { pubkey: "deadbeef".repeat(8), usedAt: null },
    });
  });

  it("returns a 64-char hex challenge with future expiresAt", async () => {
    prisma.authChallenge.deleteMany.mockResolvedValue({ count: 0 });
    prisma.authChallenge.create.mockImplementation(async ({ data }: { data: { challenge: string; expiresAt: Date } }) => data);

    const result = await createChallenge("deadbeef".repeat(8));

    expect(result.challenge).toMatch(/^[0-9a-f]{64}$/);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("stores the challenge in the database", async () => {
    prisma.authChallenge.deleteMany.mockResolvedValue({ count: 0 });
    prisma.authChallenge.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => data);

    await createChallenge("aabbcc".padEnd(64, "0"));

    expect(prisma.authChallenge.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pubkey: "aabbcc".padEnd(64, "0"),
        challenge: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });
});

// ── verifyChallenge ─────────────────────────────────────────────────────────

describe("verifyChallenge", () => {
  const pubkey = "aa".repeat(32);

  it("returns null when challenge not found", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue(null);
    const result = await verifyChallenge("nonexistent", pubkey);
    expect(result).toBeNull();
  });

  it("returns null when pubkey doesn't match", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey: "bb".repeat(32),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await verifyChallenge("some-challenge", pubkey);
    expect(result).toBeNull();
  });

  it("returns null when challenge already used", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await verifyChallenge("some-challenge", pubkey);
    expect(result).toBeNull();
  });

  it("returns null and deletes expired challenge", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey,
      usedAt: null,
      expiresAt: new Date(Date.now() - 60000), // expired
    });
    prisma.authChallenge.delete = vi.fn().mockResolvedValue({});

    const result = await verifyChallenge("some-challenge", pubkey);
    expect(result).toBeNull();
    expect(prisma.authChallenge.delete).toHaveBeenCalledWith({
      where: { id: "ch-1" },
    });
  });

  it("returns { id } when challenge is valid", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-valid",
      pubkey,
      usedAt: null,
      expiresAt: new Date(Date.now() + 300000),
    });
    const result = await verifyChallenge("valid-challenge", pubkey);
    expect(result).toEqual({ id: "ch-valid" });
  });
});

// ── consumeChallenge ────────────────────────────────────────────────────────

describe("consumeChallenge", () => {
  it("marks the challenge as used with current timestamp", async () => {
    prisma.authChallenge.update.mockResolvedValue({});
    await consumeChallenge("ch-1");

    expect(prisma.authChallenge.update).toHaveBeenCalledWith({
      where: { id: "ch-1" },
      data: { usedAt: expect.any(Date) },
    });
  });
});

// ── verifyAndConsumeChallenge ───────────────────────────────────────────────

describe("verifyAndConsumeChallenge", () => {
  const pubkey = "cc".repeat(32);

  it("returns false when challenge is invalid", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue(null);
    const result = await verifyAndConsumeChallenge("bad", pubkey);
    expect(result).toBe(false);
  });

  it("returns true and consumes when valid", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-good",
      pubkey,
      usedAt: null,
      expiresAt: new Date(Date.now() + 300000),
    });
    prisma.authChallenge.update.mockResolvedValue({});

    const result = await verifyAndConsumeChallenge("valid", pubkey);
    expect(result).toBe(true);
    expect(prisma.authChallenge.update).toHaveBeenCalledWith({
      where: { id: "ch-good" },
      data: { usedAt: expect.any(Date) },
    });
  });
});

// ── atomicVerifyAndConsume ──────────────────────────────────────────────────

describe("atomicVerifyAndConsume", () => {
  const pubkey = "dd".repeat(32);

  it("returns null when challenge not found", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue(null);
    const result = await atomicVerifyAndConsume("nonexistent", pubkey);
    expect(result).toBeNull();
  });

  it("returns null when pubkey doesn't match", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey: "ee".repeat(32),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await atomicVerifyAndConsume("some-challenge", pubkey);
    expect(result).toBeNull();
  });

  it("returns null when challenge already used", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await atomicVerifyAndConsume("some-challenge", pubkey);
    expect(result).toBeNull();
  });

  it("returns null and deletes expired challenge", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-1",
      pubkey,
      usedAt: null,
      expiresAt: new Date(Date.now() - 60000),
    });
    prisma.authChallenge.delete.mockResolvedValue({});

    const result = await atomicVerifyAndConsume("some-challenge", pubkey);
    expect(result).toBeNull();
    expect(prisma.authChallenge.delete).toHaveBeenCalledWith({
      where: { id: "ch-1" },
    });
  });

  it("atomically verifies and marks as used when valid", async () => {
    prisma.authChallenge.findUnique.mockResolvedValue({
      id: "ch-atomic",
      pubkey,
      usedAt: null,
      expiresAt: new Date(Date.now() + 300000),
    });
    prisma.authChallenge.update.mockResolvedValue({});

    const result = await atomicVerifyAndConsume("valid-challenge", pubkey);
    expect(result).toEqual({ id: "ch-atomic" });
    expect(prisma.authChallenge.update).toHaveBeenCalledWith({
      where: { id: "ch-atomic" },
      data: { usedAt: expect.any(Date) },
    });
    // Verify it used $transaction
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

// ── createAuthToken / validateAuthToken ─────────────────────────────────────

describe("JWT token lifecycle", () => {
  it("creates a valid JWT that can be validated back to the pubkey", async () => {
    const pubkey = "dd".repeat(32);
    const token = await createAuthToken(pubkey);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature

    const result = await validateAuthToken(token);
    expect(result).toBe(pubkey);
  });

  it("returns null for a garbage token", async () => {
    const result = await validateAuthToken("not.a.jwt");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await validateAuthToken("");
    expect(result).toBeNull();
  });

  it("JWT payload contains correct pubkey subject", async () => {
    const pubkey = "ee".repeat(32);
    const token = await createAuthToken(pubkey);
    const payload = JSON.parse(atob(token.split(".")[1]));

    expect(payload.sub).toBe(pubkey);
    expect(payload.pubkey).toBe(pubkey);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// ── cleanupExpiredChallenges ────────────────────────────────────────────────

describe("cleanupExpiredChallenges", () => {
  it("deletes expired challenges and returns count", async () => {
    prisma.authChallenge.deleteMany.mockResolvedValue({ count: 5 });
    const count = await cleanupExpiredChallenges();

    expect(count).toBe(5);
    expect(prisma.authChallenge.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });
});
