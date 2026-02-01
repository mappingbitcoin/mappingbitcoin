"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { EnrichedVenue } from "@/models/Overpass";
import VerifyOwnershipModal from "./VerifyOwnershipModal";
import VerifiedBadge from "./VerifiedBadge";
import { ShieldCheckIcon, PlusIcon } from "@/assets/icons/ui";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";

interface VerifyOwnershipButtonProps {
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
    compact?: boolean;
}

interface VerificationMethod {
    method: "EMAIL" | "DOMAIN";
    verifiedAt: Date;
    detail?: string;
}

interface VerificationStatus {
    isVerified: boolean;
    ownerPubkey?: string;
    verifiedAt?: Date;
    methods?: VerificationMethod[];
}

export default function VerifyOwnershipButton({
    venue,
    venueName,
    osmEmail,
    compact = false,
}: VerifyOwnershipButtonProps) {
    const { user } = useNostrAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastFetchedId = useRef<string | null>(null);

    const fetchStatus = useCallback(async (force = false) => {
        const osmId = `${venue.type}/${venue.id}`;

        // Skip if we already fetched for this venue (unless forced)
        if (!force && lastFetchedId.current === osmId) {
            return;
        }

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
    }, [venue.type, venue.id]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleVerificationSuccess = useCallback(() => {
        // Refetch status after successful verification
        fetchStatus(true);
        setIsModalOpen(false);
    }, [fetchStatus]);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // Show loading state
    if (isLoading) {
        return compact ? null : (
            <div className="h-8 w-32 bg-surface-light rounded-full animate-pulse" />
        );
    }

    // Check if the current user is the owner
    const isOwner = status?.isVerified && status.ownerPubkey && user?.pubkey === status.ownerPubkey;

    // Check which methods are already verified
    const verifiedMethods = status?.methods?.map(m => m.method) || [];
    const hasEmailVerified = verifiedMethods.includes("EMAIL");
    const hasDomainVerified = verifiedMethods.includes("DOMAIN");
    const canAddMore = isOwner && (!hasEmailVerified || !hasDomainVerified);

    // Show verified badge if already verified
    if (status?.isVerified && status.ownerPubkey) {
        return (
            <div className="flex items-center gap-2">
                <VerifiedBadge
                    ownerPubkey={status.ownerPubkey}
                    verifiedAt={status.verifiedAt}
                    methods={status.methods}
                    compact={compact}
                />
                {canAddMore && !compact && (
                    <>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            variant="ghost"
                            color="accent"
                            size="xs"
                            leftIcon={<PlusIcon />}
                        >
                            Add
                        </Button>
                        <VerifyOwnershipModal
                            isOpen={isModalOpen}
                            onClose={handleModalClose}
                            onSuccess={handleVerificationSuccess}
                            venue={venue}
                            venueName={venueName}
                            osmEmail={osmEmail}
                        />
                    </>
                )}
            </div>
        );
    }

    // Show verify button
    if (compact) {
        return (
            <>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="soft"
                    color="accent"
                    size="xs"
                    leftIcon={<ShieldCheckIcon />}
                >
                    Verify
                </Button>

                <VerifyOwnershipModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleVerificationSuccess}
                    venue={venue}
                    venueName={venueName}
                    osmEmail={osmEmail}
                />
            </>
        );
    }

    return (
        <>
            <Button
                onClick={() => setIsModalOpen(true)}
                variant="soft"
                color="accent"
                leftIcon={<ShieldCheckIcon />}
            >
                Verify Ownership
            </Button>

            <VerifyOwnershipModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleVerificationSuccess}
                venue={venue}
                venueName={venueName}
                osmEmail={osmEmail}
            />
        </>
    );
}
