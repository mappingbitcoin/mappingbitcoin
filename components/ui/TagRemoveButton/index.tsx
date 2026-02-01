"use client";

import React, { forwardRef } from "react";

export interface TagRemoveButtonProps {
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Additional className */
    className?: string;
    /** Accessible label */
    "aria-label"?: string;
}

const TagRemoveButton = forwardRef<HTMLButtonElement, TagRemoveButtonProps>(
    ({ onClick, className = "", "aria-label": ariaLabel = "Remove" }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className={`p-0.5 rounded hover:bg-white/20 text-current opacity-60 hover:opacity-100 transition-all cursor-pointer ${className}`}
            >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        );
    }
);

TagRemoveButton.displayName = "TagRemoveButton";

export default TagRemoveButton;
