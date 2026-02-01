"use client";

import React, { forwardRef } from "react";

export interface ToggleButtonProps {
    /** Whether this button is currently selected */
    selected?: boolean;
    /** Size variant */
    size?: "xs" | "sm" | "md";
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Button type */
    type?: "button" | "submit" | "reset";
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const toggleSizeStyles = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
    ({ selected = false, size = "sm", children, className = "", type = "button", onClick }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                onClick={onClick}
                className={`${toggleSizeStyles[size]} rounded-lg transition-colors cursor-pointer ${
                    selected
                        ? "bg-accent text-white"
                        : "bg-surface-light text-text-light hover:text-white hover:bg-surface-light/80"
                } ${className}`}
            >
                {children}
            </button>
        );
    }
);

ToggleButton.displayName = "ToggleButton";

export default ToggleButton;
