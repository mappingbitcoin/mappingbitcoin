"use client";

import React, { forwardRef } from "react";

// ============================================
// Types
// ============================================

export type InputSize = "xs" | "sm" | "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** Size variant */
    size?: InputSize;
    /** Error state */
    error?: boolean;
    /** Left icon/addon */
    leftIcon?: React.ReactNode;
    /** Right icon/addon */
    rightIcon?: React.ReactNode;
    /** Full width */
    fullWidth?: boolean;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<InputSize, string> = {
    xs: "py-1 px-2 text-xs rounded",
    sm: "py-1.5 px-3 text-sm rounded-md",
    md: "py-2 px-3.5 text-sm rounded-lg",
    lg: "py-2.5 px-4 text-base rounded-lg",
};

const iconSizes: Record<InputSize, string> = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
};

const iconPadding: Record<InputSize, { left: string; right: string }> = {
    xs: { left: "pl-6", right: "pr-6" },
    sm: { left: "pl-8", right: "pr-8" },
    md: { left: "pl-9", right: "pr-9" },
    lg: { left: "pl-10", right: "pr-10" },
};

const iconPositions: Record<InputSize, string> = {
    xs: "top-1/2 -translate-y-1/2",
    sm: "top-1/2 -translate-y-1/2",
    md: "top-1/2 -translate-y-1/2",
    lg: "top-1/2 -translate-y-1/2",
};

// ============================================
// Component
// ============================================

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = "md",
            error = false,
            leftIcon,
            rightIcon,
            fullWidth = true,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const baseClasses = "border border-border-light bg-surface text-white placeholder:text-text-light/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200";
        const sizeClass = sizeStyles[size];
        const widthClass = fullWidth ? "w-full" : "";
        const disabledClass = disabled ? "bg-background cursor-not-allowed opacity-60" : "";
        const errorClass = error ? "border-red-400 focus:ring-red-400/20 focus:border-red-400" : "";
        const leftPadding = leftIcon ? iconPadding[size].left : "";
        const rightPadding = rightIcon ? iconPadding[size].right : "";

        const classes = `${baseClasses} ${sizeClass} ${widthClass} ${disabledClass} ${errorClass} ${leftPadding} ${rightPadding} ${className}`.trim();

        if (leftIcon || rightIcon) {
            return (
                <div className={`relative ${fullWidth ? "w-full" : "inline-flex"}`}>
                    {leftIcon && (
                        <span className={`absolute left-3 ${iconPositions[size]} ${iconSizes[size]} text-text-light pointer-events-none`}>
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={classes}
                        {...props}
                    />
                    {rightIcon && (
                        <span className={`absolute right-3 ${iconPositions[size]} ${iconSizes[size]} text-text-light`}>
                            {rightIcon}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={ref}
                disabled={disabled}
                className={classes}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

export default Input;
