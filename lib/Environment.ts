/**
 * Centralized environment configuration with validation
 *
 * All environment variables should be accessed through this module
 * to ensure type safety and validation.
 */

// =============================================================================
// Environment Detection
// =============================================================================

const NODE_ENV = process.env.NODE_ENV || "development";

export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

// =============================================================================
// Validation Helpers
// =============================================================================

function required(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function requiredInProduction(name: string, value: string | undefined): string | undefined {
    if (isProduction && !value) {
        throw new Error(`Missing required environment variable in production: ${name}`);
    }
    return value;
}

function optional(value: string | undefined, defaultValue: string): string {
    return value || defaultValue;
}

// =============================================================================
// Public Environment Variables (Available in Browser)
// =============================================================================

export const publicEnv = {
    /**
     * Base site URL
     * Used for generating absolute URLs, canonical links, etc.
     */
    siteUrl: optional(
        process.env.NEXT_PUBLIC_SITE_URL,
        isDevelopment ? "http://localhost:3000" : "https://mappingbitcoin.com"
    ),

    /**
     * Google reCAPTCHA v3 site key (public)
     * Used on client-side for bot protection
     */
    recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,

    /**
     * Google Analytics Measurement ID
     * For tracking site analytics
     */
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,

    /**
     * Google Maps API key for photos
     * Used for Place Photos API on client side
     */
    googleMapsPhotoKey: process.env.NEXT_PUBLIC_MAP_API_KEY_PHOTO,
} as const;

// =============================================================================
// Server-side Environment Variables (Never exposed to browser)
// =============================================================================

export const serverEnv = {
    /**
     * Session secret for JWT signing
     * REQUIRED in production
     */
    get sessionSecret(): string {
        const value = process.env.SESSION_SECRET;
        if (isProduction && !value) {
            throw new Error("SESSION_SECRET is required in production");
        }
        return value || "dev-secret-change-in-production";
    },

    /**
     * Database connection URL
     * REQUIRED for database operations
     */
    get databaseUrl(): string {
        return required("DATABASE_URL", process.env.DATABASE_URL);
    },

    /**
     * Resend API key for sending emails
     * REQUIRED in production for email functionality
     */
    get resendApiKey(): string | undefined {
        return requiredInProduction("RESEND_API_KEY", process.env.RESEND_API_KEY);
    },

    /**
     * Google reCAPTCHA v3 secret key (server-side)
     * Used for verifying reCAPTCHA tokens
     */
    get recaptchaSecretKey(): string | undefined {
        return requiredInProduction("RECAPTCHA_SECRET_KEY", process.env.RECAPTCHA_SECRET_KEY);
    },

    /**
     * Google Maps API key for backend
     * Used for server-side Google Maps API calls
     */
    get googleMapsApiKey(): string | undefined {
        return process.env.GOOGLE_MAPS_APIKEY_BE;
    },

    /**
     * Initial admin pubkey for seeding first admin
     */
    get initialAdminPubkey(): string | undefined {
        return process.env.INITIAL_ADMIN_PUBKEY;
    },

    /**
     * Mapping Bitcoin Bot private key for posting Nostr events
     * Used for automated announcements (new venues, verifications)
     */
    get nostrBotPrivateKey(): string | undefined {
        return process.env.MAPPING_BITCOIN_BOT_PRIVATE_KEY;
    },

    // -------------------------------------------------------------------------
    // OpenStreetMap OAuth Configuration
    // -------------------------------------------------------------------------

    osm: {
        get clientId(): string {
            return required("OSM_CLIENT_ID", process.env.OSM_CLIENT_ID);
        },
        get clientSecret(): string {
            return required("OSM_CLIENT_SECRET", process.env.OSM_CLIENT_SECRET);
        },
        get redirectUri(): string {
            return required("OSM_REDIRECT_URI", process.env.OSM_REDIRECT_URI);
        },
    },

    // -------------------------------------------------------------------------
    // Hetzner Object Storage Configuration
    // -------------------------------------------------------------------------

    hetzner: {
        get isConfigured(): boolean {
            return !!(
                process.env.HETZNER_STORAGE_ENDPOINT &&
                process.env.HETZNER_STORAGE_REGION &&
                process.env.HETZNER_STORAGE_BUCKET &&
                process.env.HETZNER_STORAGE_ACCESS_KEY &&
                process.env.HETZNER_STORAGE_SECRET_KEY
            );
        },
        get endpoint(): string | undefined {
            return process.env.HETZNER_STORAGE_ENDPOINT;
        },
        get region(): string | undefined {
            return process.env.HETZNER_STORAGE_REGION;
        },
        get bucket(): string | undefined {
            return process.env.HETZNER_STORAGE_BUCKET;
        },
        get accessKey(): string | undefined {
            return process.env.HETZNER_STORAGE_ACCESS_KEY;
        },
        get secretKey(): string | undefined {
            return process.env.HETZNER_STORAGE_SECRET_KEY;
        },
    },

    // -------------------------------------------------------------------------
    // DigitalOcean Spaces Configuration (Legacy)
    // -------------------------------------------------------------------------

    digitalOcean: {
        get isConfigured(): boolean {
            return !!(
                process.env.DO_SPACES_ENDPOINT &&
                process.env.DO_SPACES_BUCKET_NAME &&
                process.env.DO_SPACES_SECRET &&
                process.env.DO_SPACES_KEY &&
                process.env.DO_SPACES_REGION
            );
        },
        get endpoint(): string | undefined {
            return process.env.DO_SPACES_ENDPOINT;
        },
        get bucket(): string {
            return process.env.DO_SPACES_BUCKET_NAME || "";
        },
        get accessKey(): string {
            return process.env.DO_SPACES_KEY || "";
        },
        get secretKey(): string {
            return process.env.DO_SPACES_SECRET || "";
        },
        get region(): string | undefined {
            return process.env.DO_SPACES_REGION;
        },
    },
} as const;

// =============================================================================
// Legacy Export (for backwards compatibility)
// =============================================================================

export const env = {
    siteUrl: publicEnv.siteUrl,
} as const;

// =============================================================================
// Type Exports
// =============================================================================

export type PublicEnv = typeof publicEnv;
export type ServerEnv = typeof serverEnv;
