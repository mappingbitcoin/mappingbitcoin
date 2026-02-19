"use client";

import React from "react";
import {
    CircleCheckFilledIcon,
    UserFilledIcon,
    QuestionCircleIcon,
} from "@/assets/icons/ui";

interface WoTBadgeProps {
    distance: number | null;
    source?: "extension" | "oracle";
    size?: "sm" | "md" | "lg";
    showSource?: boolean;
}

/**
 * Visual indicator for Web of Trust distance
 */
export default function WoTBadge({
    distance,
    source = "oracle",
    size = "md",
    showSource = false,
}: WoTBadgeProps) {
    const getWoTLevel = (dist: number | null): {
        label: string;
        color: string;
        bgColor: string;
        description: string;
    } => {
        if (dist === null) {
            return {
                label: "Unknown",
                color: "text-gray-400",
                bgColor: "bg-gray-500/10 border-gray-500/30 border-dashed",
                description: "Not connected to trust network",
            };
        }
        if (dist === 0) {
            return {
                label: "You",
                color: "text-green-400",
                bgColor: "bg-green-500/10 border-green-500/30",
                description: "This is you",
            };
        }
        if (dist === 1) {
            return {
                label: "Direct",
                color: "text-emerald-400",
                bgColor: "bg-emerald-500/10 border-emerald-500/30",
                description: "You follow this person",
            };
        }
        if (dist === 2) {
            return {
                label: "2nd",
                color: "text-yellow-400",
                bgColor: "bg-yellow-500/10 border-yellow-500/30",
                description: "Friend of a friend",
            };
        }
        if (dist === 3) {
            return {
                label: "3rd",
                color: "text-orange-400",
                bgColor: "bg-orange-500/10 border-orange-500/30",
                description: "3 hops away",
            };
        }
        return {
            label: `${dist}+`,
            color: "text-gray-400",
            bgColor: "bg-gray-500/10 border-gray-500/30",
            description: `${dist} hops away - distant connection`,
        };
    };

    const wot = getWoTLevel(distance);

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
    };

    const sourceLabel = source === "extension" ? "Your WoT" : "Community WoT";
    const tooltip = `${wot.description}${showSource ? ` (${sourceLabel})` : ""}`;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border ${wot.bgColor} ${wot.color} ${sizeClasses[size]} font-medium`}
            title={tooltip}
        >
            <WoTIcon distance={distance} size={size} />
            <span>{wot.label}</span>
            {showSource && (
                <span className="opacity-60 text-[0.65em]">
                    {source === "extension" ? "you" : "bot"}
                </span>
            )}
        </span>
    );
}

interface WoTIconProps {
    distance: number | null;
    size: "sm" | "md" | "lg";
}

function WoTIcon({ distance, size }: WoTIconProps) {
    const iconSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4";

    if (distance === null) {
        return <QuestionCircleIcon className={iconSize} />;
    }
    if (distance <= 1) {
        return <CircleCheckFilledIcon className={iconSize} />;
    }
    return <UserFilledIcon className={iconSize} />;
}
