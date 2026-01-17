"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname(); // Detects route changes

    return (
        <AnimatePresence mode="wait"> {/* Prevents exit animation on first load */}
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
