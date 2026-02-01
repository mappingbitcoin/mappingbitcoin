"use client";

import React from "react";
import Modal from "./index";
import Button from "@/components/ui/Button";
import { TrashIcon, WarningIcon, CheckmarkIcon } from "@/assets/icons";

export type ConfirmModalVariant = "danger" | "warning" | "info";

export interface ConfirmModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** Confirm handler */
    onConfirm: () => void;
    /** Modal title */
    title: string;
    /** Description text */
    description: string;
    /** Optional preview content (e.g., item being deleted) */
    preview?: React.ReactNode;
    /** Confirm button text */
    confirmText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Loading state for confirm button */
    loading?: boolean;
    /** Error message to display */
    error?: string | null;
    /** Visual variant */
    variant?: ConfirmModalVariant;
    /** Custom icon for confirm button */
    confirmIcon?: React.ReactNode;
}

const variantConfig: Record<ConfirmModalVariant, { color: "danger" | "accent" | "success"; icon: React.ReactNode }> = {
    danger: {
        color: "danger",
        icon: <TrashIcon className="w-4 h-4" />,
    },
    warning: {
        color: "accent",
        icon: <WarningIcon className="w-4 h-4" />,
    },
    info: {
        color: "accent",
        icon: <CheckmarkIcon className="w-4 h-4" />,
    },
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    preview,
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading = false,
    error = null,
    variant = "danger",
    confirmIcon,
}: ConfirmModalProps) {
    const config = variantConfig[variant];

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="px-6 pb-6 space-y-4">
                <p className="text-text-light">{description}</p>

                {preview && (
                    <div className="bg-surface-light rounded-lg p-3 max-h-32 overflow-y-auto">
                        {preview}
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-400">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        onClick={handleClose}
                        variant="ghost"
                        color="neutral"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="solid"
                        color={config.color}
                        loading={loading}
                        leftIcon={confirmIcon || config.icon}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
