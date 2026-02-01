"use client";

import React from "react";
import Label from "@/components/ui/Label";

// ============================================
// Types
// ============================================

export interface FormFieldProps {
    /** Field label */
    label?: string;
    /** Show required indicator */
    required?: boolean;
    /** Error message */
    error?: string;
    /** Helper text */
    helpText?: string;
    /** Hint text shown to the right of label */
    hint?: string;
    /** Label size */
    labelSize?: "xs" | "sm" | "md";
    /** For attribute for label */
    htmlFor?: string;
    /** Children (the input element) */
    children: React.ReactNode;
    /** Additional className for container */
    className?: string;
}

// ============================================
// Component
// ============================================

export default function FormField({
    label,
    required = false,
    error,
    helpText,
    hint,
    labelSize = "sm",
    htmlFor,
    children,
    className = "",
}: FormFieldProps) {
    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <Label
                    htmlFor={htmlFor}
                    size={labelSize}
                    required={required}
                    hint={hint}
                >
                    {label}
                </Label>
            )}
            {children}
            {helpText && !error && (
                <p className="text-xs text-text-light mt-1.5">{helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
        </div>
    );
}
