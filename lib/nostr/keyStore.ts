/**
 * In-memory key store for sensitive Nostr credentials.
 *
 * Private keys and bunker session data are stored ONLY in JavaScript memory,
 * never persisted to sessionStorage/localStorage. This prevents XSS attacks
 * from accessing private keys via the Storage API.
 *
 * Trade-off: Keys are lost on page refresh (user must re-login).
 * This is intentional — security over convenience for private key material.
 */

interface BunkerSessionData {
    clientPrivateKey: string;
    clientPubkey: string;
    remotePubkey: string;
    relay: string;
    secret?: string;
}

interface ConnectSessionData {
    clientPrivateKey: string;
    clientPubkey: string;
    remotePubkey: string;
    relay: string;
}

// Module-scoped variables — only accessible via exported functions
let _privateKey: string | null = null;
let _bunkerUrl: string | null = null;
let _bunkerSession: BunkerSessionData | null = null;
let _connectSession: ConnectSessionData | null = null;

// ── Private key (nsec) ──────────────────────────────────────────────

export function setPrivateKey(key: string): void {
    _privateKey = key;
}

export function getPrivateKey(): string | null {
    return _privateKey;
}

export function clearPrivateKey(): void {
    _privateKey = null;
}

// ── Bunker URL ──────────────────────────────────────────────────────

export function setBunkerUrl(url: string): void {
    _bunkerUrl = url;
}

export function getBunkerUrl(): string | null {
    return _bunkerUrl;
}

export function clearBunkerUrl(): void {
    _bunkerUrl = null;
}

// ── Bunker session ──────────────────────────────────────────────────

export function setBunkerSession(session: BunkerSessionData): void {
    _bunkerSession = { ...session };
}

export function getBunkerSession(): BunkerSessionData | null {
    return _bunkerSession ? { ..._bunkerSession } : null;
}

export function clearBunkerSession(): void {
    _bunkerSession = null;
}

// ── Connect session (NIP-46) ────────────────────────────────────────

export function setConnectSession(session: ConnectSessionData): void {
    _connectSession = { ...session };
}

export function getConnectSession(): ConnectSessionData | null {
    return _connectSession ? { ..._connectSession } : null;
}

export function clearConnectSession(): void {
    _connectSession = null;
}

export function hasConnectSession(): boolean {
    return _connectSession !== null;
}

// ── Clear all ───────────────────────────────────────────────────────

export function clearAll(): void {
    _privateKey = null;
    _bunkerUrl = null;
    _bunkerSession = null;
    _connectSession = null;
}
