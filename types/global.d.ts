/**
 * Global type declarations for browser APIs and third-party scripts
 */

declare global {
    interface Window {
        /**
         * Google reCAPTCHA v3 API
         * @see https://developers.google.com/recaptcha/docs/v3
         */
        grecaptcha?: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };

        /**
         * Nostr NIP-07 browser extension API
         * @see https://github.com/nostr-protocol/nips/blob/master/07.md
         */
        nostr?: {
            getPublicKey: () => Promise<string>;
            signEvent: (event: object) => Promise<object>;
            nip04?: {
                encrypt: (pubkey: string, plaintext: string) => Promise<string>;
                decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
            };
        };
    }

    /**
     * Google reCAPTCHA global variable (loaded via script tag)
     */
    const grecaptcha: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
    } | undefined;
}

export {};
