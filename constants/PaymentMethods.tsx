import React from "react";

// Lightning bolt icon
const LightningIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
);

// Lightning contactless icon
const LightningContactlessIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 2L4 12h6l-1 6 7-8h-5l1-8z" />
        <path d="M17 8c1.5 1.5 2.5 3.5 2.5 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19.5 5.5c2 2 3.5 5 3.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Bitcoin icon for on-chain
const BitcoinIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h1c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-3v1h4v2h-2v2h-2v-2h-1c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3v-1h-4V9h2V7z" />
    </svg>
);

// Card icon for debit/credit
const CardIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);

// Contactless icon
const ContactlessIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8.5 14.5c1.5-1.5 1.5-4 0-5.5" />
        <path d="M12 18c3-3 3-8 0-11" />
        <path d="M15.5 21.5c4.5-4.5 4.5-12 0-16.5" />
    </svg>
);

export const PAYMENT_METHODS: Record<
    string,
    { icon: React.ReactNode; label: string }
> = {
    lightning_contactless: { icon: <LightningContactlessIcon />, label: "Lightning Contactless" },
    lightning: { icon: <LightningIcon />, label: "Lightning" },
    onchain: { icon: <BitcoinIcon />, label: "On-chain" },
    debit_cards: { icon: <CardIcon />, label: "Debit Cards" },
    credit_cards: { icon: <CardIcon />, label: "Credit Cards" },
    contactless: { icon: <ContactlessIcon />, label: "Contactless" },
};
