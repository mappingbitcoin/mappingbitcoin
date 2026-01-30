"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { LockIcon } from "@/assets/icons/ui";
import LoginStep from "./LoginStep";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Translation key for title (uses login.modal namespace, e.g., "title" or "adminTitle") */
    titleKey?: string;
    /** Whether to show the "Create Account" option (default: true) */
    showCreateAccount?: boolean;
    /** Translation key for description (e.g., "default" or "verification") */
    descriptionKey?: string;
    /** Called when login succeeds */
    onSuccess?: () => void;
}

export default function LoginModal({
    isOpen,
    onClose,
    titleKey = "title",
    showCreateAccount = true,
    descriptionKey = "default",
    onSuccess,
}: LoginModalProps) {
    const t = useTranslations("login");
    const { user, error } = useNostrAuth();
    const [internalError, setInternalError] = useState<string | null>(null);

    // Handle successful login
    useEffect(() => {
        if (user && isOpen) {
            onSuccess?.();
            onClose();
        }
    }, [user, isOpen, onSuccess, onClose]);

    // Reset error when modal opens
    useEffect(() => {
        if (isOpen) {
            setInternalError(null);
        }
    }, [isOpen]);

    // Combined error from context or internal
    const displayError = error || internalError;

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <LockIcon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{t(`modal.${titleKey}`)}</h2>
                        <p className="text-sm text-text-light">{t("modal.subtitle")}</p>
                    </div>
                </div>

                {/* Error display */}
                <AnimatePresence mode="wait">
                    {displayError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                        >
                            {displayError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reuse the LoginStep component */}
                <LoginStep
                    onError={setInternalError}
                    showCreateAccount={showCreateAccount}
                    descriptionKey={descriptionKey}
                />
            </div>
        </Modal>
    );
}
