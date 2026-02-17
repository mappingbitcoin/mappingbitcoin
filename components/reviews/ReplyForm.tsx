"use client";

import React, { useState } from "react";
import { SpinnerIcon, CloseIcon } from "@/assets/icons/ui";

interface ReplyFormProps {
    onSubmit: (content: string) => Promise<boolean>;
    onCancel: () => void;
    isSubmitting: boolean;
    error: string | null;
}

export default function ReplyForm({ onSubmit, onCancel, isSubmitting, error }: ReplyFormProps) {
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            return;
        }

        const success = await onSubmit(content.trim());
        if (success) {
            setContent("");
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                maxLength={1000}
                autoFocus
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm disabled:opacity-50"
            />

            {error && (
                <p className="text-red-400 text-xs">{error}</p>
            )}

            <div className="flex items-center justify-between">
                <span className="text-xs text-text-light">
                    {content.length}/1000
                </span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-sm text-text-light hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="px-3 py-1.5 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {isSubmitting ? (
                            <>
                                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Reply"
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
