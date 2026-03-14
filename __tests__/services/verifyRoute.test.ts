import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

// Configure secp256k1 (must match the route)
secp256k1.hashes.sha256 = sha256;

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/services/auth", () => ({
  atomicVerifyAndConsume: vi.fn(),
  createAuthToken: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000, limit: 10 }),
  getClientIP: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimiters: { auth: { maxRequests: 10, windowMs: 60000 } },
}));

vi.mock("nostr-tools", () => ({
  verifyEvent: vi.fn(),
}));

const { atomicVerifyAndConsume, createAuthToken } = await import("@/lib/db/services/auth");
const { checkRateLimit } = await import("@/lib/rateLimit");
const { verifyEvent } = await import("nostr-tools");
const { POST } = await import("@/app/api/auth/nostr/verify/route");

const mockAtomicVerifyAndConsume = atomicVerifyAndConsume as ReturnType<typeof vi.fn>;
const mockCreateAuthToken = createAuthToken as ReturnType<typeof vi.fn>;
const mockCheckRateLimit = checkRateLimit as ReturnType<typeof vi.fn>;
const mockVerifyEvent = verifyEvent as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000, limit: 10 });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("https://example.com/api/auth/nostr/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Generate a real secp256k1 keypair for test signing
function generateTestKeypair() {
  const privKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const privKeyHex = bytesToHex(privKeyBytes);
  const pubKeyHex = bytesToHex(secp256k1.schnorr.getPublicKey(privKeyBytes));
  return { privKeyHex, privKeyBytes, pubKeyHex };
}

function randomHex(len: number): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(len)));
}

const validChallenge = "a".repeat(64);
const validPubkey = "b".repeat(64);

// ── Rate limiting ───────────────────────────────────────────────────────────

describe("POST /api/auth/nostr/verify - rate limiting", () => {
  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
      limit: 10,
    });

    const res = await POST(makeRequest({ pubkey: validPubkey, challenge: validChallenge, signature: "c".repeat(128) }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });
});

// ── Input validation ────────────────────────────────────────────────────────

describe("POST /api/auth/nostr/verify - input validation", () => {
  it("rejects invalid pubkey format", async () => {
    const res = await POST(makeRequest({ pubkey: "short", challenge: validChallenge, signature: "c".repeat(128) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid pubkey");
  });

  it("rejects missing pubkey", async () => {
    const res = await POST(makeRequest({ challenge: validChallenge, signature: "c".repeat(128) }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid challenge length", async () => {
    const res = await POST(makeRequest({ pubkey: validPubkey, challenge: "tooshort", signature: "c".repeat(128) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid challenge");
  });

  it("rejects invalid signature format", async () => {
    const res = await POST(makeRequest({ pubkey: validPubkey, challenge: validChallenge, signature: "not-hex" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid signature");
  });

  it("rejects when neither signature nor signedEvent provided", async () => {
    const res = await POST(makeRequest({ pubkey: validPubkey, challenge: validChallenge }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("required");
  });
});

// ── Challenge verification (atomic) ────────────────────────────────────────

describe("POST /api/auth/nostr/verify - challenge verification", () => {
  it("returns 401 when challenge is invalid or expired (after valid signature)", async () => {
    // With the new flow, signature is verified first, then challenge is atomically consumed.
    // We need a valid signature so the code reaches the challenge check.
    const { privKeyBytes, pubKeyHex } = generateTestKeypair();
    const challenge = randomHex(32);

    const messageHash = sha256(new TextEncoder().encode(challenge));
    const signature = await secp256k1.schnorr.sign(messageHash, privKeyBytes);
    const sigHex = bytesToHex(signature);

    // Challenge verification fails (returns null)
    mockAtomicVerifyAndConsume.mockResolvedValue(null);

    const res = await POST(makeRequest({
      pubkey: pubKeyHex,
      challenge,
      signature: sigHex,
    }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired challenge");
  });
});

// ── Direct Schnorr signature (nsec flow) ────────────────────────────────────

describe("POST /api/auth/nostr/verify - direct signature (nsec)", () => {
  it("authenticates with valid Schnorr signature", async () => {
    const { privKeyBytes, pubKeyHex } = generateTestKeypair();
    const challenge = randomHex(32);

    // Create a real signature
    const messageHash = sha256(new TextEncoder().encode(challenge));
    const signature = await secp256k1.schnorr.sign(messageHash, privKeyBytes);
    const sigHex = bytesToHex(signature);

    mockAtomicVerifyAndConsume.mockResolvedValue({ id: "ch-1" });
    mockCreateAuthToken.mockResolvedValue("jwt-token-123");

    const res = await POST(makeRequest({
      pubkey: pubKeyHex,
      challenge,
      signature: sigHex,
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("jwt-token-123");
    expect(body.pubkey).toBe(pubKeyHex);
    // Verify atomicVerifyAndConsume was called with normalized (lowercase) pubkey
    expect(mockAtomicVerifyAndConsume).toHaveBeenCalledWith(challenge, pubKeyHex.toLowerCase());
  });

  it("returns 401 for invalid signature (wrong key)", async () => {
    const { pubKeyHex } = generateTestKeypair();
    const { privKeyBytes: wrongKey } = generateTestKeypair();
    const challenge = randomHex(32);

    const messageHash = sha256(new TextEncoder().encode(challenge));
    const signature = await secp256k1.schnorr.sign(messageHash, wrongKey);
    const sigHex = bytesToHex(signature);

    const res = await POST(makeRequest({
      pubkey: pubKeyHex,
      challenge,
      signature: sigHex,
    }));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid signature");
    // Challenge should NOT be consumed on failure (atomicVerifyAndConsume not called)
    expect(mockAtomicVerifyAndConsume).not.toHaveBeenCalled();
  });
});

// ── Nostr event signature (extension/bunker flow) ───────────────────────────

describe("POST /api/auth/nostr/verify - event signature (extension/bunker)", () => {
  it("authenticates with valid signed event", async () => {
    const now = Math.floor(Date.now() / 1000);
    const signedEvent = {
      id: "event-id",
      pubkey: validPubkey,
      created_at: now,
      kind: 22242,
      tags: [],
      content: validChallenge,
      sig: "d".repeat(128),
    };

    mockVerifyEvent.mockReturnValue(true);
    mockAtomicVerifyAndConsume.mockResolvedValue({ id: "ch-1" });
    mockCreateAuthToken.mockResolvedValue("jwt-event-token");

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("jwt-event-token");
    expect(mockVerifyEvent).toHaveBeenCalled();
  });

  it("rejects when event pubkey doesn't match", async () => {
    const now = Math.floor(Date.now() / 1000);
    const signedEvent = {
      id: "event-id",
      pubkey: "e".repeat(64), // different pubkey
      created_at: now,
      kind: 22242,
      tags: [],
      content: validChallenge,
      sig: "d".repeat(128),
    };

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(401);
  });

  it("rejects when event content doesn't match challenge", async () => {
    const now = Math.floor(Date.now() / 1000);
    const signedEvent = {
      id: "event-id",
      pubkey: validPubkey,
      created_at: now,
      kind: 22242,
      tags: [],
      content: "wrong-challenge",
      sig: "d".repeat(128),
    };

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(401);
  });

  it("rejects when event timestamp is too old", async () => {
    const signedEvent = {
      id: "event-id",
      pubkey: validPubkey,
      created_at: Math.floor(Date.now() / 1000) - 600, // 10 min ago
      kind: 22242,
      tags: [],
      content: validChallenge,
      sig: "d".repeat(128),
    };

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(401);
  });

  it("rejects when event kind is wrong", async () => {
    const now = Math.floor(Date.now() / 1000);
    const signedEvent = {
      id: "event-id",
      pubkey: validPubkey,
      created_at: now,
      kind: 1, // wrong kind
      tags: [],
      content: validChallenge,
      sig: "d".repeat(128),
    };

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(401);
  });

  it("rejects when nostr-tools verifyEvent returns false", async () => {
    const now = Math.floor(Date.now() / 1000);
    const signedEvent = {
      id: "event-id",
      pubkey: validPubkey,
      created_at: now,
      kind: 22242,
      tags: [],
      content: validChallenge,
      sig: "d".repeat(128),
    };

    mockVerifyEvent.mockReturnValue(false);

    const res = await POST(makeRequest({
      pubkey: validPubkey,
      challenge: validChallenge,
      signedEvent,
    }));

    expect(res.status).toBe(401);
    expect(mockAtomicVerifyAndConsume).not.toHaveBeenCalled();
  });
});
