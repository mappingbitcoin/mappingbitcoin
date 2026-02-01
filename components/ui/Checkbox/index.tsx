"use client";

import React, { forwardRef } from "react";

// ============================================
// Types
// ============================================

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    /** Size variant */
    size?: CheckboxSize;
    /** Label text */
    label?: string;
    /** Description text below label */
    description?: string;
    /** Error state */
    error?: boolean;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<CheckboxSize, { box: string; label: string; description: string }> = {
    sm: {
        box: "w-3.5 h-3.5 rounded",
        label: "text-sm",
        description: "text-xs",
    },
    md: {
        box: "w-4 h-4 rounded",
        label: "text-sm",
        description: "text-xs",
    },
    lg: {
        box: "w-5 h-5 rounded-md",
        label: "text-base",
        description: "text-sm",
    },
};

// ============================================
// Component
// ============================================

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            size = "md",
            label,
            description,
            error = false,
            className = "",
            disabled,
            id,
            ...props
        },
        ref
    ) => {
        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
        const styles = sizeStyles[size];

        const baseClasses = "border border-border-light bg-surface text-accent focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 cursor-pointer transition-all duration-200";
        const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";
        const errorClass = error ? "border-red-400" : "";

        const checkboxClasses = `${baseClasses} ${styles.box} ${disabledClass} ${errorClass}`.trim();

        if (label || description) {
            return (
                <label
                    htmlFor={checkboxId}
                    className={`inline-flex items-start gap-2.5 cursor-pointer ${disabled ? "cursor-not-allowed" : ""} ${className}`}
                >
                    <input
                        ref={ref}
                        type="checkbox"
                        id={checkboxId}
                        disabled={disabled}
                        className={checkboxClasses}
                        {...props}
                    />
                    <span className="flex flex-col">
                        {label && (
                            <span className={`${styles.label} text-white ${disabled ? "opacity-60" : ""}`}>
                                {label}
                            </span>
                        )}
                        {description && (
                            <span className={`${styles.description} text-text-light ${disabled ? "opacity-60" : ""}`}>
                                {description}
                            </span>
                        )}
                    </span>
                </label>
            );
        }

        return (
            <input
                ref={ref}
                type="checkbox"
                id={checkboxId}
                disabled={disabled}
                className={`${checkboxClasses} ${className}`}
                {...props}
            />
        );
    }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
