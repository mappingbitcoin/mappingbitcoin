"use client";

import React from "react";

interface FormSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export default function FormSection({ title, description, children, className = "" }: FormSectionProps) {
    return (
        <div className={`bg-surface rounded-2xl border border-border-light shadow-sm p-6 ${className}`}>
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description && (
                    <p className="text-sm text-text-light mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}
