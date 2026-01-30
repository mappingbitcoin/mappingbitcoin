import React from "react";
import {
    LightningIcon,
    LightningContactlessIcon,
    OnchainIcon,
    CardIcon,
    ContactlessIcon
} from "@/assets/icons/payment";

export const PAYMENT_METHODS: Record<
    string,
    { icon: React.ReactNode; label: string }
> = {
    lightning_contactless: { icon: <LightningContactlessIcon className="w-4 h-4" />, label: "Lightning Contactless" },
    lightning: { icon: <LightningIcon className="w-4 h-4" />, label: "Lightning" },
    onchain: { icon: <OnchainIcon className="w-4 h-4" />, label: "On-chain" },
    debit_cards: { icon: <CardIcon className="w-4 h-4" />, label: "Debit Cards" },
    credit_cards: { icon: <CardIcon className="w-4 h-4" />, label: "Credit Cards" },
    contactless: { icon: <ContactlessIcon className="w-4 h-4" />, label: "Contactless" },
};
