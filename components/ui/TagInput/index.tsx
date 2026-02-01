"use client";

import React, { useState, forwardRef } from "react";
import { TagRemoveButton } from "@/components/ui/Button";

// ============================================
// Types
// ============================================

export type TagInputSize = "sm" | "md" | "lg";

export interface TagInputProps {
    /** Current tags array */
    tags: string[];
    /** Callback when tags change */
    onChange: (tags: string[]) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Size variant */
    size?: TagInputSize;
    /** Error state */
    error?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Maximum number of tags */
    maxTags?: number;
    /** Custom tag prefix (e.g., "#" for hashtags) */
    tagPrefix?: string;
    /** Additional className for container */
    className?: string;
}

// ============================================
// Style Configuration
// ============================================

const sizeStyles: Record<TagInputSize, { container: string; tag: string; input: string }> = {
    sm: {
        container: "p-1.5 min-h-[34px] gap-1.5 rounded-md",
        tag: "px-1.5 py-0.5 text-xs gap-1",
        input: "text-xs min-w-[80px]",
    },
    md: {
        container: "p-2 min-h-[42px] gap-2 rounded-lg",
        tag: "px-2 py-1 text-sm gap-1",
        input: "text-sm min-w-[100px]",
    },
    lg: {
        container: "p-2.5 min-h-[50px] gap-2.5 rounded-lg",
        tag: "px-2.5 py-1.5 text-base gap-1.5",
        input: "text-base min-w-[120px]",
    },
};

// ============================================
// Component
// ============================================

const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
    (
        {
            tags,
            onChange,
            placeholder = "Add tag...",
            size = "md",
            error = false,
            disabled = false,
            maxTags,
            tagPrefix = "",
            className = "",
        },
        ref
    ) => {
        const [input, setInput] = useState("");
        const styles = sizeStyles[size];

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
            } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
                onChange(tags.slice(0, -1));
            }
        };

        const addTag = () => {
            // Remove leading prefix if present (e.g., # for hashtags)
            const trimmed = input.trim().replace(new RegExp(`^${tagPrefix}`), "");
            if (trimmed && !tags.includes(trimmed)) {
                if (maxTags && tags.length >= maxTags) {
                    return;
                }
                onChange([...tags, trimmed]);
            }
            setInput("");
        };

        const removeTag = (index: number) => {
            onChange(tags.filter((_, i) => i !== index));
        };

        const baseClasses = "flex flex-wrap bg-surface-light border border-border-light transition-all duration-200";
        const focusClasses = "focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent";
        const errorClass = error ? "border-red-400 focus-within:ring-red-400/20 focus-within:border-red-400" : "";
        const disabledClass = disabled ? "opacity-60 cursor-not-allowed bg-background" : "";

        const containerClasses = `${baseClasses} ${styles.container} ${focusClasses} ${errorClass} ${disabledClass} ${className}`.trim();

        return (
            <div className={containerClasses}>
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className={`inline-flex items-center bg-accent/20 text-accent rounded ${styles.tag}`}
                    >
                        {tagPrefix}{tag}
                        {!disabled && (
                            <TagRemoveButton
                                onClick={() => removeTag(index)}
                                className="hover:text-red-400"
                                aria-label={`Remove ${tag}`}
                            />
                        )}
                    </span>
                ))}
                <input
                    ref={ref}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    disabled={disabled}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    className={`flex-1 bg-transparent text-white placeholder-text-light focus:outline-none ${styles.input}`}
                />
            </div>
        );
    }
);

TagInput.displayName = "TagInput";

export default TagInput;
