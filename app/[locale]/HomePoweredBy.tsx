"use client";

import { motion } from "framer-motion";
import { OSMIcon, NostrIcon, NostrWotIcon } from "@/assets/icons/social";

interface PoweredBySectionProps {
    label: string;
}

export function PoweredBySection({ label }: PoweredBySectionProps) {
    return (
        <motion.div
            className="mt-14 flex flex-col items-center justify-center gap-2 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
        >
            <span className="text-sm">{label}</span>
            <div className="flex items-center gap-5 flex-wrap justify-center">
                <motion.a
                    href="https://www.openstreetmap.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <OSMIcon className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    <span className="text-sm font-medium">OpenStreetMap</span>
                </motion.a>
                <span className="text-gray-600">+</span>
                <motion.a
                    href="https://nostr.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <NostrIcon className="w-7 h-7 opacity-60 group-hover:opacity-100 transition-all" aria-hidden="true" />
                    <span className="text-sm font-medium">Nostr</span>
                </motion.a>
                <span className="text-gray-600">+</span>
                <motion.a
                    href="https://nostr-wot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <NostrWotIcon className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-all rounded" aria-hidden="true" />
                    <span className="text-sm font-medium">Nostr WoT</span>
                </motion.a>
            </div>
        </motion.div>
    );
}
