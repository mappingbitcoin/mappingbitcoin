"use client";

import React, { forwardRef } from "react";

export interface AccordionButtonProps {
    /** Whether the accordion is expanded */
    expanded?: boolean;
    /** Icon or indicator to show expand state */
    expandIcon?: React.ReactNode;
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const AccordionButton = forwardRef<HTMLButtonElement, AccordionButtonProps>(
    ({ expanded = false, expandIcon, children, className = "", onClick }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                className={`w-full flex items-center justify-between gap-4 p-4 text-left cursor-pointer bg-transparent border-none ${className}`}
            >
                <span className="font-medium text-text-dark pr-4">{children}</span>
                {expandIcon && (
                    <span className={`text-accent transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
                        {expandIcon}
                    </span>
                )}
            </button>
        );
    }
);

AccordionButton.displayName = "AccordionButton";

export default AccordionButton;
