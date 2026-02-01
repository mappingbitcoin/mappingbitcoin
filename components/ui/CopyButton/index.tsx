"use client";

import React, { useState, forwardRef } from "react";

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

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
    ({ text, onCopy, className = "", size = "sm" }, ref) => {
        const [copied, setCopied] = useState(false);

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

export default CopyButton;
