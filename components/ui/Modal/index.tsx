"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CloseIcon } from "@/assets/icons/ui";
import { IconButton } from "@/components/ui/Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    if (typeof window === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" data-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className={`relative w-full ${maxWidth} bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-border-light overflow-hidden`}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                                <h2 className="text-lg font-semibold text-white">{title}</h2>
                                <IconButton
                                    onClick={onClose}
                                    icon={<CloseIcon className="w-4 h-4" />}
                                    aria-label="Close"
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    className="!rounded-full"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className={title ? "" : "pt-4"}>
                            {!title && (
                                <IconButton
                                    onClick={onClose}
                                    icon={<CloseIcon className="w-4 h-4" />}
                                    aria-label="Close"
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    className="absolute top-3 right-3 z-10 !rounded-full"
                                />
                            )}
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
