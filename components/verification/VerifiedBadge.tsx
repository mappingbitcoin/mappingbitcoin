"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { nip19 } from "nostr-tools";
import { useTranslations } from "next-intl";
import { VerifiedBadgeIcon } from "@/assets/icons/ui";

interface VerifiedBadgeProps {
    ownerPubkey: string;
    verifiedAt?: Date;
    compact?: boolean;
}

export default function VerifiedBadge({ ownerPubkey, verifiedAt, compact = false }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const t = useTranslations("login.verification.badge");

    const npub = nip19.npubEncode(ownerPubkey);
    const truncatedNpub = `${npub.slice(0, 8)}...${npub.slice(-4)}`;

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full"
                title={`${t("verifiedOwner")}: ${truncatedNpub}`}
            >
                <VerifiedBadgeIcon className="w-3 h-3" />
                {t("verified")}
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-full cursor-pointer"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                whileHover={{ scale: 1.02 }}
            >
                <VerifiedBadgeIcon className="w-4 h-4" />
                {t("verifiedOwner")}
            </motion.div>

            {showTooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full mt-2 z-50 p-3 bg-surface border border-border-light rounded-lg shadow-lg min-w-[200px]"
                >
                    <div className="text-sm">
                        <p className="text-white font-medium mb-1">{t("verifiedOwner")}</p>
                        <p className="text-text-light text-xs mb-2">
                            {t("description")}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-text-light">{t("owner")}:</span>
                            <code className="px-1.5 py-0.5 bg-primary-light rounded text-accent">
                                {truncatedNpub}
                            </code>
                        </div>
                        {verifiedAt && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-text-light">{t("since")}:</span>
                                <span className="text-white">
                                    {new Date(verifiedAt).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
