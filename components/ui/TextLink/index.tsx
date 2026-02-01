"use client";

import React from "react";
import { Link } from "@/i18n/navigation";

export type TextLinkVariant = "default" | "muted" | "accent";

export interface TextLinkProps {
    /** Link destination */
    href: string;
    /** External link - opens in new tab */
    external?: boolean;
    /** Visual style variant */
    variant?: TextLinkVariant;
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const variantStyles: Record<TextLinkVariant, string> = {
    default: "text-accent hover:text-accent-light",
    muted: "text-text-light hover:text-white",
    accent: "text-accent underline hover:text-accent-light",
};

export default function TextLink({
    href,
    external = false,
    variant = "default",
    children,
    className = "",
    onClick,
}: TextLinkProps) {
    const classes = `transition-colors duration-200 ${variantStyles[variant]} ${className}`;

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes}
                onClick={onClick}
            >
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={classes} onClick={onClick}>
            {children}
        </Link>
    );
}
