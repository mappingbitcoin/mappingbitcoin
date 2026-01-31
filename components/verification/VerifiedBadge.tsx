"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { nip19 } from "nostr-tools";
import { useTranslations } from "next-intl";
import { VerifiedBadgeIcon } from "@/assets/icons/ui";
import { EmailIcon, WebsiteIcon } from "@/assets/icons/contact";

interface VerificationMethod {
    method: "EMAIL" | "DOMAIN";
    verifiedAt: Date;
    detail?: string;
}

interface VerifiedBadgeProps {
    ownerPubkey: string;
    verifiedAt?: Date;
    methods?: VerificationMethod[];
    compact?: boolean;
}

export default function VerifiedBadge({ ownerPubkey, verifiedAt, methods, compact = false }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const t = useTranslations("login.verification.badge");

    const npub = nip19.npubEncode(ownerPubkey);
    const truncatedNpub = `${npub.slice(0, 8)}...${npub.slice(-4)}`;

    const hasMultipleMethods = methods && methods.length > 1;
    const methodCount = methods?.length || 0;

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full"
                title={`${t("verifiedOwner")}: ${truncatedNpub}${hasMultipleMethods ? ` (${methodCount} methods)` : ""}`}
            >
                <VerifiedBadgeIcon className="w-3 h-3" />
                {t("verified")}
                {hasMultipleMethods && (
                    <span className="ml-0.5 px-1 py-0.5 bg-green-500/30 rounded text-[10px]">
                        {methodCount}
                    </span>
                )}
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
                {hasMultipleMethods && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-green-500/30 rounded-full text-xs">
                        {methodCount}
                    </span>
                )}
            </motion.div>

            {showTooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full mt-2 z-50 p-3 bg-surface border border-border-light rounded-lg shadow-lg min-w-[220px]"
                >
                    <div className="text-sm">
                        <p className="text-white font-medium mb-1">{t("verifiedOwner")}</p>
                        <p className="text-text-light text-xs mb-2">
                            {t("description")}
                        </p>

                        {/* Verification methods */}
                        {methods && methods.length > 0 && (
                            <div className="mb-2 space-y-1.5">
                                <span className="text-xs text-text-light">Verified via:</span>
                                {methods.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        {m.method === "EMAIL" ? (
                                            <EmailIcon className="w-3 h-3 text-blue-400" />
                                        ) : (
                                            <WebsiteIcon className="w-3 h-3 text-purple-400" />
                                        )}
                                        <span className="text-white">
                                            {m.method === "EMAIL" ? "Email" : m.detail || "Domain"}
                                        </span>
                                        <span className="text-text-light">
                                            ({new Date(m.verifiedAt).toLocaleDateString()})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs border-t border-border-light pt-2 mt-2">
                            <span className="text-text-light">{t("owner")}:</span>
                            <code className="px-1.5 py-0.5 bg-primary-light rounded text-accent">
                                {truncatedNpub}
                            </code>
                        </div>
                        {verifiedAt && !methods && (
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
