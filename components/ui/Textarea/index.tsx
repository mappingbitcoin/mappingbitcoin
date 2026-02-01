"use client";

import React, { forwardRef } from "react";

// ============================================
// Types
// ============================================

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Size variant */
    size?: TextareaSize;
    /** Error state */
    error?: boolean;
    /** Full width */
    fullWidth?: boolean;
    /** Allow resize */
    resize?: "none" | "vertical" | "horizontal" | "both";
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<TextareaSize, string> = {
    sm: "py-1.5 px-3 text-sm rounded-md",
    md: "py-2 px-3.5 text-sm rounded-lg",
    lg: "py-2.5 px-4 text-base rounded-lg",
};

const resizeStyles: Record<string, string> = {
    none: "resize-none",
    vertical: "resize-y",
    horizontal: "resize-x",
    both: "resize",
};

// ============================================
// Component
// ============================================

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            size = "md",
            error = false,
            fullWidth = true,
            resize = "none",
            className = "",
            disabled,
            rows = 3,
            ...props
        },
        ref
    ) => {
        const baseClasses = "border border-border-light bg-surface text-white placeholder:text-text-light/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200";
        const sizeClass = sizeStyles[size];
        const widthClass = fullWidth ? "w-full" : "";
        const disabledClass = disabled ? "bg-background cursor-not-allowed opacity-60" : "";
        const errorClass = error ? "border-red-400 focus:ring-red-400/20 focus:border-red-400" : "";
        const resizeClass = resizeStyles[resize];

        const classes = `${baseClasses} ${sizeClass} ${widthClass} ${disabledClass} ${errorClass} ${resizeClass} ${className}`.trim();

        return (
            <textarea
                ref={ref}
                disabled={disabled}
                rows={rows}
                className={classes}
                {...props}
            />
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
