import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/services/auth", () => ({
  validateAuthToken: vi.fn(),
}));

vi.mock("@/lib/db/services/admin", () => ({
  isAdmin: vi.fn(),
}));

const { validateAuthToken } = await import("@/lib/db/services/auth");
const { isAdmin } = await import("@/lib/db/services/admin");
const { requireAuth, requireAdmin } = await import("@/lib/middleware/adminAuth");

const mockValidateAuthToken = validateAuthToken as ReturnType<typeof vi.fn>;
const mockIsAdmin = isAdmin as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) headers.set("Authorization", authHeader);
  return new NextRequest("https://example.com/api/test", { headers });
}

// ── requireAuth ─────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  it("returns 401 when no Authorization header", async () => {
    const result = await requireAuth(makeRequest());
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error).toContain("Authentication required");
    }
  });

  it("returns 401 when token format is wrong (not Bearer)", async () => {
    const result = await requireAuth(makeRequest("Basic abc123"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 401 when token is invalid", async () => {
    mockValidateAuthToken.mockResolvedValue(null);
    const result = await requireAuth(makeRequest("Bearer invalid-token"));
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error).toContain("Invalid or expired");
    }
  });

  it("returns success with pubkey when token is valid", async () => {
    const pubkey = "aa".repeat(32);
    mockValidateAuthToken.mockResolvedValue(pubkey);
    const result = await requireAuth(makeRequest("Bearer valid-token"));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pubkey).toBe(pubkey);
    }
  });
});

// ── requireAdmin ────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  it("returns 401 when no Authorization header", async () => {
    const result = await requireAdmin(makeRequest());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 401 when token is invalid", async () => {
    mockValidateAuthToken.mockResolvedValue(null);
    const result = await requireAdmin(makeRequest("Bearer bad-token"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when user is not an admin", async () => {
    const pubkey = "bb".repeat(32);
    mockValidateAuthToken.mockResolvedValue(pubkey);
    mockIsAdmin.mockResolvedValue(false);

    const result = await requireAdmin(makeRequest("Bearer valid-token"));
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error).toContain("Admin access required");
    }
  });

  it("returns success when user is admin", async () => {
    const pubkey = "cc".repeat(32);
    mockValidateAuthToken.mockResolvedValue(pubkey);
    mockIsAdmin.mockResolvedValue(true);

    const result = await requireAdmin(makeRequest("Bearer admin-token"));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pubkey).toBe(pubkey);
    }
  });
});
