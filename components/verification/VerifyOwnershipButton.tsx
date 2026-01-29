"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { EnrichedVenue } from "@/models/Overpass";
import VerifyOwnershipModal from "./VerifyOwnershipModal";
import VerifiedBadge from "./VerifiedBadge";

interface VerifyOwnershipButtonProps {
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
    compact?: boolean;
}

interface VerificationStatus {
    isVerified: boolean;
    ownerPubkey?: string;
    verifiedAt?: Date;
}

export default function VerifyOwnershipButton({
    venue,
    venueName,
    osmEmail,
    compact = false,
}: VerifyOwnershipButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastFetchedId = useRef<string | null>(null);

    useEffect(() => {
        const osmId = `${venue.type}/${venue.id}`;

        // Skip if we already fetched for this venue
        if (lastFetchedId.current === osmId) {
            return;
        }

        const checkStatus = async () => {
            lastFetchedId.current = osmId;
            try {
                const response = await fetch(`/api/verify/status?osmId=${encodeURIComponent(osmId)}`);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error("Failed to check verification status:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [venue.type, venue.id]);

    // Show loading state
    if (isLoading) {
        return compact ? null : (
            <div className="h-8 w-32 bg-surface-light rounded-full animate-pulse" />
        );
    }

    // Show verified badge if already verified
    if (status?.isVerified && status.ownerPubkey) {
        return (
            <VerifiedBadge
                ownerPubkey={status.ownerPubkey}
                verifiedAt={status.verifiedAt}
                compact={compact}
            />
        );
    }

    // Show verify button
    if (compact) {
        return (
            <>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full hover:bg-accent/30 transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify
                </button>

                <VerifyOwnershipModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    venue={venue}
                    venueName={venueName}
                    osmEmail={osmEmail}
                />
            </>
        );
    }

    return (
        <>
            <motion.button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify Ownership
            </motion.button>

            <VerifyOwnershipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                venue={venue}
                venueName={venueName}
                osmEmail={osmEmail}
            />
        </>
    );
}
