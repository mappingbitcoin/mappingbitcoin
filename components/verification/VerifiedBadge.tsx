"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { nip19 } from "nostr-tools";

interface VerifiedBadgeProps {
    ownerPubkey: string;
    verifiedAt?: Date;
    compact?: boolean;
}

export default function VerifiedBadge({ ownerPubkey, verifiedAt, compact = false }: VerifiedBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const npub = nip19.npubEncode(ownerPubkey);
    const truncatedNpub = `${npub.slice(0, 8)}...${npub.slice(-4)}`;

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full"
                title={`Verified owner: ${truncatedNpub}`}
            >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Owner
            </motion.div>

            {showTooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full mt-2 z-50 p-3 bg-surface border border-border-light rounded-lg shadow-lg min-w-[200px]"
                >
                    <div className="text-sm">
                        <p className="text-white font-medium mb-1">Verified Owner</p>
                        <p className="text-text-light text-xs mb-2">
                            This venue&apos;s ownership has been verified via email confirmation.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-text-light">Owner:</span>
                            <code className="px-1.5 py-0.5 bg-primary-light rounded text-accent">
                                {truncatedNpub}
                            </code>
                        </div>
                        {verifiedAt && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-text-light">Since:</span>
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
