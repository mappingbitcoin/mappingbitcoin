"use client";

import React from "react";

interface TrustBadgeProps {
    score: number;
    showScore?: boolean;
    size?: "sm" | "md" | "lg";
}

/**
 * Visual indicator for trust score
 * Score ranges: 1.0 (seeder), 0.4 (depth 1), 0.1 (depth 2), 0.02 (unknown)
 */
export default function TrustBadge({ score, showScore = false, size = "md" }: TrustBadgeProps) {
    const getTrustLevel = (score: number): {
        label: string;
        color: string;
        bgColor: string;
        description: string;
    } => {
        if (score >= 1.0) {
            return {
                label: "Seeder",
                color: "text-green-400",
                bgColor: "bg-green-500/10 border-green-500/30",
                description: "Community seeder - highest trust",
            };
        }
        if (score >= 0.4) {
            return {
                label: "Trusted",
                color: "text-emerald-400",
                bgColor: "bg-emerald-500/10 border-emerald-500/30",
                description: "Followed by community seeders",
            };
        }
        if (score >= 0.1) {
            return {
                label: "Known",
                color: "text-yellow-400",
                bgColor: "bg-yellow-500/10 border-yellow-500/30",
                description: "2nd degree connection to seeders",
            };
        }
        return {
            label: "New",
            color: "text-gray-400",
            bgColor: "bg-gray-500/10 border-gray-500/30",
            description: "Not yet connected to trust network",
        };
    };

    const trust = getTrustLevel(score);

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border ${trust.bgColor} ${trust.color} ${sizeClasses[size]} font-medium`}
            title={trust.description}
        >
            <TrustIcon score={score} size={size} />
            <span>{trust.label}</span>
            {showScore && (
                <span className="opacity-75">({score.toFixed(2)})</span>
            )}
        </span>
    );
}

interface TrustIconProps {
    score: number;
    size: "sm" | "md" | "lg";
}

function TrustIcon({ score, size }: TrustIconProps) {
    const iconSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4";

    if (score >= 1.0) {
        // Verified checkmark for seeders
        return (
            <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                />
            </svg>
        );
    }

    if (score >= 0.4) {
        // Shield for trusted
        return (
            <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 1a.75.75 0 01.65.375l3 5.25a.75.75 0 01-.65 1.125H7a.75.75 0 01-.65-1.125l3-5.25A.75.75 0 0110 1zM5.23 8.75A.75.75 0 016 8.25h8a.75.75 0 01.77.5l1.5 5.5a.75.75 0 01-.27.83l-5.25 3.5a.75.75 0 01-.83 0l-5.25-3.5a.75.75 0 01-.27-.83l1.5-5.5a.75.75 0 01.33-.5z"
                    clipRule="evenodd"
                />
            </svg>
        );
    }

    if (score >= 0.1) {
        // User check for known
        return (
            <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
            </svg>
        );
    }

    // Question mark for new/unknown
    return (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.06-1.06 3 3 0 112.12 5.122.75.75 0 01-.75.75v.75a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75 1.5 1.5 0 00.44-2.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
            />
        </svg>
    );
}

/**
 * Compact inline trust indicator
 */
export function TrustIndicator({ score }: { score: number }) {
    const getColor = (score: number): string => {
        if (score >= 1.0) return "bg-green-500";
        if (score >= 0.4) return "bg-emerald-500";
        if (score >= 0.1) return "bg-yellow-500";
        return "bg-gray-500";
    };

    return (
        <span
            className={`inline-block w-2 h-2 rounded-full ${getColor(score)}`}
            title={`Trust score: ${score.toFixed(2)}`}
        />
    );
}

/**
 * Weighted rating display with trust context
 */
export function WeightedRating({
    weightedRating,
    simpleRating,
    totalReviews,
}: {
    weightedRating: number | null;
    simpleRating: number | null;
    totalReviews: number;
}) {
    if (weightedRating === null || totalReviews === 0) {
        return (
            <span className="text-text-light text-sm">No ratings yet</span>
        );
    }

    const difference = simpleRating !== null ? weightedRating - simpleRating : 0;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                <span className="text-2xl font-bold text-white">
                    {weightedRating.toFixed(1)}
                </span>
                <span className="text-yellow-400 ml-1">★</span>
            </div>
            <div className="text-sm text-text-light">
                <span>from {totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
                {Math.abs(difference) >= 0.1 && (
                    <span
                        className={`ml-1 ${difference > 0 ? "text-green-400" : "text-red-400"}`}
                        title="Difference from simple average due to trust weighting"
                    >
                        ({difference > 0 ? "+" : ""}{difference.toFixed(1)} trust-weighted)
                    </span>
                )}
            </div>
        </div>
    );
}
