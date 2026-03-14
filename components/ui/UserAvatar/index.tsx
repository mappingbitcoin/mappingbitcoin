"use client";

interface UserAvatarProps {
    pubkey: string;
    picture?: string;
    name?: string;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
};

export default function UserAvatar({
    pubkey,
    picture,
    name,
    size = "md",
}: UserAvatarProps) {
    // Generate a deterministic color based on pubkey
    const hue = parseInt(pubkey.slice(0, 8), 16) % 360;
    const initial = name ? name.charAt(0).toUpperCase() : pubkey.slice(0, 2).toUpperCase();

    const ringClass = "ring-2 ring-transparent group-hover:ring-accent/50";

    if (picture) {
        return (
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
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ${ringClass} transition-all`}
            style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
        >
            {initial}
        </div>
    );
}
