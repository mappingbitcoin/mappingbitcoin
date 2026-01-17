"use client";

import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: string;
}

export function FormInput({ label, error, helpText, className = "", ...props }: FormInputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-white">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                className={`w-full py-2.5 px-3.5 border border-border-light rounded-xl text-sm text-white bg-surface
                    placeholder:text-text-light/60
                    focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                    disabled:bg-background disabled:cursor-not-allowed
                    transition-all duration-200
                    ${error ? "border-red-400 focus:ring-red-100 focus:border-red-400" : ""}
                    ${className}`}
                {...props}
            />
            {helpText && !error && (
                <p className="text-xs text-text-light">{helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helpText?: string;
}

export function FormTextarea({ label, error, helpText, className = "", ...props }: FormTextareaProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-white">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                className={`w-full py-2.5 px-3.5 border border-border-light rounded-xl text-sm text-white bg-surface
                    placeholder:text-text-light/60
                    focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                    disabled:bg-background disabled:cursor-not-allowed
                    transition-all duration-200 resize-none
                    ${error ? "border-red-400 focus:ring-red-100 focus:border-red-400" : ""}
                    ${className}`}
                {...props}
            />
            {helpText && !error && (
                <p className="text-xs text-text-light">{helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helpText?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function FormSelect({ label, error, helpText, options, placeholder, className = "", ...props }: FormSelectProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-white">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <select
                className={`w-full py-2.5 px-3.5 border border-border-light rounded-xl text-sm text-white bg-surface
                    focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                    disabled:bg-background disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                    ${error ? "border-red-400 focus:ring-red-100 focus:border-red-400" : ""}
                    ${className}`}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {helpText && !error && (
                <p className="text-xs text-text-light">{helpText}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
