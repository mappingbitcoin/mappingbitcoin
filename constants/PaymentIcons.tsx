import { ComponentType } from "react";
import { IconProps } from "@/assets/icons";
import {
    LightningIcon,
    LightningContactlessIcon,
    OnchainIcon,
    CardIcon,
    ContactlessIcon,
} from "@/assets/icons/payment";

// Shared payment icon mapping used across the app
export const PAYMENT_ICON_MAP: Record<string, ComponentType<IconProps>> = {
    lightning: LightningIcon,
    lightning_contactless: LightningContactlessIcon,
    onchain: OnchainIcon,
    debit_cards: CardIcon,
    credit_cards: CardIcon,
    contactless: ContactlessIcon,
};

interface PaymentIconProps {
    type: string;
    className?: string;
}

export function PaymentIcon({ type, className = "w-4 h-4" }: PaymentIconProps) {
    const IconComponent = PAYMENT_ICON_MAP[type];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
}
