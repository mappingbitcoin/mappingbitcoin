"use client";

import React, { forwardRef } from "react";

export interface TabButtonProps {
    /** Whether this tab is currently active */
    active?: boolean;
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
    ({ active = false, children, className = "", onClick }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                className={`text-sm flex-1 py-3 px-4 bg-transparent border-none cursor-pointer transition-all duration-200 ${
                    active
                        ? "text-accent font-semibold border-b-2 border-accent -mb-px"
                        : "text-text-light hover:text-white border-b-2 border-transparent"
                } ${className}`}
            >
                {children}
            </button>
        );
    }
);

TabButton.displayName = "TabButton";

export default TabButton;
