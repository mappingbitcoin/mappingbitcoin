"use client";

import React, { forwardRef } from "react";

export interface DropdownItemProps {
    /** Whether this item is currently highlighted/selected */
    highlighted?: boolean;
    /** Icon to display */
    icon?: React.ReactNode;
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
    ({ highlighted = false, icon, children, className = "", onClick }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${
                    highlighted
                        ? "bg-accent/20 text-white"
                        : "text-white hover:bg-surface-light"
                } ${className}`}
            >
                {icon && <span className="text-text-light">{icon}</span>}
                {children}
            </button>
        );
    }
);

DropdownItem.displayName = "DropdownItem";

export default DropdownItem;
