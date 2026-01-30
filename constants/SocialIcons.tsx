import React, { ComponentType } from "react";
import { IconProps } from "@/assets/icons";
import {
    InstagramIcon,
    FacebookIcon,
    TwitterIcon,
    LinkedInIcon,
    TelegramIcon,
    YouTubeIcon,
    TikTokIcon,
    WhatsAppIcon,
    NostrIcon,
} from "@/assets/icons/social";

export const SOCIAL_ICONS: Record<string, { label: string; Icon: ComponentType<IconProps>; icon: React.ReactNode }> = {
    instagram: {
        label: "Instagram",
        Icon: InstagramIcon,
        icon: <InstagramIcon className="w-5 h-5" />,
    },
    linkedin: {
        label: "LinkedIn",
        Icon: LinkedInIcon,
        icon: <LinkedInIcon className="w-5 h-5" />,
    },
    facebook: {
        label: "Facebook",
        Icon: FacebookIcon,
        icon: <FacebookIcon className="w-5 h-5" />,
    },
    twitter: {
        label: "X (Twitter)",
        Icon: TwitterIcon,
        icon: <TwitterIcon className="w-5 h-5" />,
    },
    telegram: {
        label: "Telegram",
        Icon: TelegramIcon,
        icon: <TelegramIcon className="w-5 h-5" />,
    },
    youtube: {
        label: "YouTube",
        Icon: YouTubeIcon,
        icon: <YouTubeIcon className="w-5 h-5" />,
    },
    tiktok: {
        label: "TikTok",
        Icon: TikTokIcon,
        icon: <TikTokIcon className="w-5 h-5" />,
    },
    whatsapp: {
        label: "WhatsApp",
        Icon: WhatsAppIcon,
        icon: <WhatsAppIcon className="w-5 h-5" />,
    },
    nostr: {
        label: "Nostr",
        Icon: NostrIcon,
        icon: <NostrIcon className="w-5 h-5" />,
    },
};
