"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname(); // Detects route changes

    // Don't animate admin routes - they have their own layout with sidebar
    // Using key={pathname} causes full remount which resets admin sidebar state
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        return <div className="w-full">{children}</div>;
    }

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
