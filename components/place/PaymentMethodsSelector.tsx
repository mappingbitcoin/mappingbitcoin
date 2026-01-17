"use client";

import React from "react";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";

interface PaymentMethodsSelectorProps {
    value: {
        onchain: boolean;
        lightning: boolean;
        lightning_contactless: boolean;
        [key: string]: boolean;
    };
    onChange: (key: string, checked: boolean) => void;
}

export default function PaymentMethodsSelector({ value, onChange }: PaymentMethodsSelectorProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PAYMENT_METHODS).map(([key, info]) => {
                const isChecked = value[key as keyof typeof value] || false;
                return (
                    <label
                        key={key}
                        className={`
                            relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                            transition-all duration-200 group
                            ${isChecked
                                ? "border-accent bg-accent/5 shadow-sm"
                                : "border-border-light hover:border-accent/40 hover:bg-surface-light"
                            }
                        `}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onChange(key, e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`
                            w-5 h-5 rounded-md border-2 flex items-center justify-center
                            transition-all duration-200
                            ${isChecked
                                ? "bg-accent border-accent"
                                : "border-border-light group-hover:border-accent/40"
                            }
                        `}>
                            {isChecked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{info.icon}</span>
                            <span className={`text-sm font-medium ${isChecked ? "text-white" : "text-text-light"}`}>
                                {info.label.replace("Accepted", "").trim()}
                            </span>
                        </div>
                    </label>
                );
            })}
        </div>
    );
}
