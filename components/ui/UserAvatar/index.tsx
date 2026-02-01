"use client";

import { CheckmarkIcon } from "@/assets/icons/ui";

interface UserAvatarProps {
    pubkey: string;
    picture?: string;
    name?: string;
    isSeeder?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
};

const badgeSizeClasses = {
    sm: "w-3 h-3 border",
    md: "w-4 h-4 border-2",
    lg: "w-5 h-5 border-2",
};

const badgeIconSizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
};

export default function UserAvatar({
    pubkey,
    picture,
    name,
    isSeeder,
    size = "md",
}: UserAvatarProps) {
    // Generate a deterministic color based on pubkey
    const hue = parseInt(pubkey.slice(0, 8), 16) % 360;
    const initial = name ? name.charAt(0).toUpperCase() : pubkey.slice(0, 2).toUpperCase();

    const ringClass = isSeeder
        ? "ring-2 ring-green-400 group-hover:ring-green-300"
        : "ring-2 ring-transparent group-hover:ring-accent/50";

    if (picture) {
        return (
            <div className="relative">
                <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${ringClass} transition-all`}>
                    <img
                        src={picture}
                        alt={name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to colored circle if image fails
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-white font-bold" style="background-color: hsl(${hue}, 60%, 45%)">${initial}</div>
                            `;
                        }}
                    />
                </div>
                {isSeeder && (
                    <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center border-primary`}>
                        <CheckmarkIcon className={`${badgeIconSizeClasses[size]} text-white`} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ${ringClass} transition-all`}
                style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
            >
                {initial}
            </div>
            {isSeeder && (
                <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center border-primary`}>
                    <CheckmarkIcon className={`${badgeIconSizeClasses[size]} text-white`} />
                </div>
            )}
        </div>
    );
}
