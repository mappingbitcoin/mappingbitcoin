"use client";

import React from "react";
import { Link } from "@/i18n/navigation";

export type IconLinkSize = "sm" | "md" | "lg";
export type IconLinkVariant = "default" | "solid" | "outline";

export interface IconLinkProps {
    /** Link destination */
    href: string;
    /** External link - opens in new tab */
    external?: boolean;
    /** Icon to display */
    icon: React.ReactNode;
    /** Accessible label */
    "aria-label": string;
    /** Size variant */
    size?: IconLinkSize;
    /** Visual style variant */
    variant?: IconLinkVariant;
    /** Additional className */
    className?: string;
}

const sizeStyles: Record<IconLinkSize, string> = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
};

const iconSizes: Record<IconLinkSize, string> = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
};

const variantStyles: Record<IconLinkVariant, string> = {
    default: "bg-white/10 hover:bg-white/20 text-white",
    solid: "bg-accent hover:bg-accent-dark text-white",
    outline: "border border-border-light hover:border-accent text-text-light hover:text-accent",
};

export default function IconLink({
    href,
    external = false,
    icon,
    "aria-label": ariaLabel,
    size = "md",
    variant = "default",
    className = "",
}: IconLinkProps) {
    const classes = `flex items-center justify-center rounded-lg transition-colors duration-200 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
    const iconClass = iconSizes[size];

    const content = (
        <span className={iconClass}>{icon}</span>
    );

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes}
                aria-label={ariaLabel}
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={classes} aria-label={ariaLabel}>
            {content}
        </Link>
    );
}
