"use client";

import React from "react";

interface ToolCardProps {
    title: string;
    description: string;
    note?: { text: string; date: string };
    icon: React.ReactNode;
    children: React.ReactNode;
    variant?: "default" | "warning";
}

export default function ToolCard({
    title,
    description,
    note,
    icon,
    children,
    variant = "default",
}: ToolCardProps) {
    const variantClasses = {
        default: "border-border-light",
        warning: "border-yellow-500/30",
    };

    return (
        <div className={`bg-surface rounded-xl border ${variantClasses[variant]} p-6`}>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-text-light text-sm mb-4">{description}</p>

                    {note && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                            <p className="text-yellow-400 text-xs">
                                <span className="font-medium">Note:</span> {note.text}
                            </p>
                            <p className="text-yellow-400/70 text-xs mt-1">
                                Issue discovered: {note.date}
                            </p>
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
