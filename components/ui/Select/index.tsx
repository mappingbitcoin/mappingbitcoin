"use client";

import React, { forwardRef } from "react";

// ============================================
// Types
// ============================================

export type SelectSize = "xs" | "sm" | "md" | "lg";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    /** Size variant */
    size?: SelectSize;
    /** Error state */
    error?: boolean;
    /** Full width */
    fullWidth?: boolean;
    /** Options array */
    options?: SelectOption[];
    /** Placeholder text (shown as first disabled option) */
    placeholder?: string;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<SelectSize, string> = {
    xs: "py-1 px-2 text-xs rounded pr-6",
    sm: "py-1.5 px-3 text-sm rounded-md pr-8",
    md: "py-2 px-3.5 text-sm rounded-lg pr-9",
    lg: "py-2.5 px-4 text-base rounded-lg pr-10",
};

// ============================================
// Component
// ============================================

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            size = "md",
            error = false,
            fullWidth = true,
            options,
            placeholder,
            children,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const baseClasses = "border border-border-light bg-surface text-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 cursor-pointer appearance-none bg-no-repeat bg-right";
        const sizeClass = sizeStyles[size];
        const widthClass = fullWidth ? "w-full" : "";
        const disabledClass = disabled ? "bg-background cursor-not-allowed opacity-60" : "";
        const errorClass = error ? "border-red-400 focus:ring-red-400/20 focus:border-red-400" : "";

        // Inline SVG for dropdown arrow
        const arrowStyle = {
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1rem",
        };

        const classes = `${baseClasses} ${sizeClass} ${widthClass} ${disabledClass} ${errorClass} ${className}`.trim();

        return (
            <select
                ref={ref}
                disabled={disabled}
                className={classes}
                style={arrowStyle}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled={props.required}>
                        {placeholder}
                    </option>
                )}
                {options
                    ? options.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                              {opt.label}
                          </option>
                      ))
                    : children}
            </select>
        );
    }
);

Select.displayName = "Select";

export default Select;
