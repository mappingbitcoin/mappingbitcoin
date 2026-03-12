"use client";

import { useEffect, useCallback, useRef } from "react";
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
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
            // Focus the modal container when opened
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
            // Restore focus to the previously focused element on close
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, handleEscape]);

    if (typeof window === "undefined") return null;

    const modalTitleId = title ? "modal-title" : undefined;

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
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={modalTitleId}
                        tabIndex={-1}
                        className={`relative w-full ${maxWidth} bg-surface rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-border-light overflow-hidden outline-none`}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                                <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>
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
