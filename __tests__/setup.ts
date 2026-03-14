/**
 * Vitest setup file
 *
 * Stubs required environment variables so modules like Environment.ts
 * and prisma.ts don't throw at import time.
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET = "test-secret-key-for-testing-only";
process.env.RESEND_API_KEY = "re_test_key";
process.env.OSM_CLIENT_ID = "test-osm-client-id";
process.env.OSM_CLIENT_SECRET = "test-osm-client-secret";
process.env.OSM_REDIRECT_URI = "http://localhost:3000/api/auth/osm/callback";
