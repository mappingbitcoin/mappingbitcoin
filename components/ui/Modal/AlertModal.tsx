"use client";

import React from "react";
import Modal from "./index";
import Button from "@/components/ui/Button";
import { CheckmarkIcon, WarningIcon, CloseIcon } from "@/assets/icons";

export type AlertModalVariant = "success" | "error" | "warning" | "info";

export interface AlertModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Message content */
    message: string;
    /** Visual variant */
    variant?: AlertModalVariant;
    /** Button text */
    buttonText?: string;
}

const variantConfig: Record<AlertModalVariant, { icon: React.ReactNode; iconBg: string; iconColor: string }> = {
    success: {
        icon: <CheckmarkIcon className="w-6 h-6" />,
        iconBg: "bg-green-500/20",
        iconColor: "text-green-400",
    },
    error: {
        icon: <CloseIcon className="w-6 h-6" />,
        iconBg: "bg-red-500/20",
        iconColor: "text-red-400",
    },
    warning: {
        icon: <WarningIcon className="w-6 h-6" />,
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-400",
    },
    info: {
        icon: <CheckmarkIcon className="w-6 h-6" />,
        iconBg: "bg-accent/20",
        iconColor: "text-accent",
    },
};

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    variant = "info",
    buttonText = "OK",
}: AlertModalProps) {
    const config = variantConfig[variant];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="px-6 pb-6 pt-2 text-center">
                <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className={config.iconColor}>{config.icon}</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-text-light mb-6">{message}</p>

                <Button onClick={onClose} variant="solid" color="accent" fullWidth>
                    {buttonText}
                </Button>
            </div>
        </Modal>
    );
}
