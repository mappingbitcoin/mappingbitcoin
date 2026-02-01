"use client";

import React, { forwardRef } from "react";

// ============================================
// Types
// ============================================

export type LabelSize = "xs" | "sm" | "md";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    /** Size variant */
    size?: LabelSize;
    /** Show required indicator */
    required?: boolean;
    /** Optional helper text shown to the right */
    hint?: string;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<LabelSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
};

// ============================================
// Component
// ============================================

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    (
        {
            size = "sm",
            required = false,
            hint,
            children,
            className = "",
            ...props
        },
        ref
    ) => {
        const baseClasses = "font-medium text-text-light";
        const sizeClass = sizeStyles[size];

        const classes = `${baseClasses} ${sizeClass} ${className}`.trim();

        return (
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <label ref={ref} className={classes} {...props}>
                    {children}
                    {required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {hint && (
                    <span className="text-xs text-text-light/60">{hint}</span>
                )}
            </div>
        );
    }
);

Label.displayName = "Label";

export default Label;
