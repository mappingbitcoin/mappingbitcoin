"use client";

import React, { forwardRef } from "react";
import { Link } from "@/i18n/navigation";
import { motion, HTMLMotionProps } from "framer-motion";
import { SpinnerIcon } from "@/assets/icons/ui";

// ============================================
// Types
// ============================================

export type ButtonVariant = "solid" | "outline" | "ghost" | "soft";
export type ButtonColor = "accent" | "primary" | "danger" | "success" | "neutral";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps {
    /** Visual style variant */
    variant?: ButtonVariant;
    /** Color scheme */
    color?: ButtonColor;
    /** Size of the button */
    size?: ButtonSize;
    /** Full width button */
    fullWidth?: boolean;
    /** Loading state - shows spinner and disables button */
    loading?: boolean;
    /** Icon to show on the left */
    leftIcon?: React.ReactNode;
    /** Icon to show on the right */
    rightIcon?: React.ReactNode;
    /** Link href - renders as Link instead of button */
    href?: string;
    /** External link - opens in new tab */
    external?: boolean;
    /** Disable animations */
    noAnimation?: boolean;
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Button type */
    type?: "button" | "submit" | "reset";
    /** Disabled state */
    disabled?: boolean;
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-xs gap-1 rounded",
    sm: "px-3 py-1.5 text-sm gap-1.5 rounded-md",
    md: "px-4 py-2 text-sm gap-2 rounded-lg",
    lg: "px-6 py-3 text-base gap-2 rounded-lg",
};

const iconSizes: Record<ButtonSize, string> = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
};

// Solid variant styles
const solidStyles: Record<ButtonColor, string> = {
    accent: "bg-accent hover:bg-accent-dark text-white shadow-sm hover:shadow",
    primary: "bg-primary hover:bg-primary-light text-white shadow-sm hover:shadow",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow",
    success: "bg-green-600 hover:bg-green-500 text-white shadow-sm hover:shadow",
    neutral: "bg-gray-600 hover:bg-gray-500 text-white shadow-sm hover:shadow",
};

// Outline variant styles
const outlineStyles: Record<ButtonColor, string> = {
    accent: "border-2 border-accent text-accent hover:bg-accent/10",
    primary: "border-2 border-primary text-primary hover:bg-primary/10",
    danger: "border-2 border-red-500 text-red-400 hover:bg-red-500/10",
    success: "border-2 border-green-500 text-green-400 hover:bg-green-500/10",
    neutral: "border-2 border-gray-500 text-gray-300 hover:bg-gray-500/10",
};

// Ghost variant styles (no background, text only)
const ghostStyles: Record<ButtonColor, string> = {
    accent: "text-accent hover:bg-accent/10",
    primary: "text-primary hover:bg-primary/10",
    danger: "text-red-400 hover:bg-red-500/10",
    success: "text-green-400 hover:bg-green-500/10",
    neutral: "text-gray-300 hover:bg-gray-500/10 hover:text-white",
};

// Soft variant styles (subtle background)
const softStyles: Record<ButtonColor, string> = {
    accent: "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20",
    primary: "bg-primary/10 text-white hover:bg-primary/20 border border-primary/20",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    success: "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20",
    neutral: "bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 border border-gray-500/20",
};

const variantStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
    solid: solidStyles,
    outline: outlineStyles,
    ghost: ghostStyles,
    soft: softStyles,
};

// ============================================
// Component
// ============================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "solid",
            color = "accent",
            size = "md",
            fullWidth = false,
            loading = false,
            leftIcon,
            rightIcon,
            href,
            external = false,
            noAnimation = false,
            children,
            className = "",
            type = "button",
            disabled = false,
            onClick,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        // Build class string
        const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary";
        const sizeClass = sizeStyles[size];
        const colorClass = variantStyles[variant][color];
        const widthClass = fullWidth ? "w-full" : "";
        const disabledClass = isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

        const classes = `${baseClasses} ${sizeClass} ${colorClass} ${widthClass} ${disabledClass} ${className}`.trim();

        // Animation props
        const motionProps: Partial<HTMLMotionProps<"button">> = noAnimation
            ? {}
            : {
                  whileHover: isDisabled ? {} : { scale: 1.02 },
                  whileTap: isDisabled ? {} : { scale: 0.98 },
                  transition: { type: "spring", stiffness: 400, damping: 17 },
              };

        // Icon size class
        const iconClass = iconSizes[size];

        // Content
        const content = (
            <>
                {loading ? (
                    <SpinnerIcon className={`${iconClass} animate-spin`} />
                ) : leftIcon ? (
                    <span className={iconClass}>{leftIcon}</span>
                ) : null}
                <span>{children}</span>
                {rightIcon && !loading && <span className={iconClass}>{rightIcon}</span>}
            </>
        );

        // Render as link
        if (href) {
            if (external) {
                return (
                    <motion.a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={classes}
                        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
                        {...motionProps}
                    >
                        {content}
                    </motion.a>
                );
            }
            return (
                <Link href={href} className={classes} onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}>
                    {content}
                </Link>
            );
        }

        // Render as button
        return (
            <motion.button
                ref={ref}
                type={type}
                disabled={isDisabled}
                className={classes}
                onClick={onClick}
                {...motionProps}
                {...props}
            >
                {content}
            </motion.button>
        );
    }
);

Button.displayName = "Button";

export default Button;

// ============================================
// Convenience Exports
// ============================================

/** Primary action button - solid accent */
export const ButtonPrimary = (props: Omit<ButtonProps, "variant" | "color">) => (
    <Button variant="solid" color="accent" {...props} />
);

/** Secondary button - outline style */
export const ButtonSecondary = (props: Omit<ButtonProps, "variant" | "color">) => (
    <Button variant="outline" color="neutral" {...props} />
);

/** Danger button for destructive actions */
export const ButtonDanger = (props: Omit<ButtonProps, "variant" | "color">) => (
    <Button variant="solid" color="danger" {...props} />
);

/** Ghost button for subtle actions */
export const ButtonGhost = (props: Omit<ButtonProps, "variant">) => (
    <Button variant="ghost" {...props} />
);

/** Soft button with subtle background */
export const ButtonSoft = (props: Omit<ButtonProps, "variant">) => (
    <Button variant="soft" {...props} />
);

// ============================================
// Icon Button (square, icon-only)
// ============================================

export interface IconButtonProps extends Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> {
    /** The icon to display */
    icon: React.ReactNode;
    /** Accessible label for screen readers */
    "aria-label": string;
}

const iconButtonSizes: Record<ButtonSize, string> = {
    xs: "p-1 rounded",
    sm: "p-1.5 rounded-md",
    md: "p-2 rounded-lg",
    lg: "p-3 rounded-lg",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, size = "md", className = "", ...props }, ref) => {
        const sizeClass = iconButtonSizes[size];
        const iconClass = iconSizes[size];

        return (
            <Button
                ref={ref}
                size={size}
                className={`${sizeClass} ${className}`}
                {...props}
            >
                <span className={iconClass}>{icon}</span>
            </Button>
        );
    }
);

IconButton.displayName = "IconButton";

// ============================================
// Tab Button (for tab navigation)
// ============================================

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

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
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

// ============================================
// Toggle Button (for selection/toggle groups)
// ============================================

export interface ToggleButtonProps {
    /** Whether this button is currently selected */
    selected?: boolean;
    /** Size variant */
    size?: "xs" | "sm" | "md";
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Button type */
    type?: "button" | "submit" | "reset";
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const toggleSizeStyles = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
};

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
    ({ selected = false, size = "sm", children, className = "", type = "button", onClick }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                onClick={onClick}
                className={`${toggleSizeStyles[size]} rounded-lg transition-colors cursor-pointer ${
                    selected
                        ? "bg-accent text-white"
                        : "bg-surface-light text-text-light hover:text-white hover:bg-surface-light/80"
                } ${className}`}
            >
                {children}
            </button>
        );
    }
);

ToggleButton.displayName = "ToggleButton";

// ============================================
// Tag Remove Button (tiny close button in tags)
// ============================================

export interface TagRemoveButtonProps {
    /** Click handler */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Additional className */
    className?: string;
    /** Accessible label */
    "aria-label"?: string;
}

export const TagRemoveButton = forwardRef<HTMLButtonElement, TagRemoveButtonProps>(
    ({ onClick, className = "", "aria-label": ariaLabel = "Remove" }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className={`p-0.5 rounded hover:bg-white/20 text-current opacity-60 hover:opacity-100 transition-all ${className}`}
            >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        );
    }
);

TagRemoveButton.displayName = "TagRemoveButton";

// ============================================
// Dropdown Item Button (for menu items)
// ============================================

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

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
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

// ============================================
// Accordion Button (for expandable sections)
// ============================================

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

export const AccordionButton = forwardRef<HTMLButtonElement, AccordionButtonProps>(
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

// ============================================
// Copy Button (for copying text to clipboard)
// ============================================

export interface CopyButtonProps {
    /** Text to copy */
    text: string;
    /** Callback when copied */
    onCopy?: () => void;
    /** Additional className */
    className?: string;
    /** Size */
    size?: "sm" | "md";
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
    ({ text, onCopy, className = "", size = "sm" }, ref) => {
        const [copied, setCopied] = React.useState(false);

        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                onCopy?.();
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        };

        const sizeClass = size === "sm" ? "p-1.5" : "p-2";

        return (
            <button
                ref={ref}
                type="button"
                onClick={handleCopy}
                className={`${sizeClass} rounded-lg hover:bg-surface-light transition-colors cursor-pointer ${className}`}
                title={copied ? "Copied!" : "Copy to clipboard"}
            >
                {copied ? (
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-text-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                )}
            </button>
        );
    }
);

CopyButton.displayName = "CopyButton";
