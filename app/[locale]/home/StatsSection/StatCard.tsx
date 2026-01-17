"use client";

import { motion } from "framer-motion";
import { Counter } from "@/components/ui";

type Accent = "orange" | "green";

interface StatCardProps {
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    accent: Accent;
    delay?: number;
}

const accentClasses: Record<Accent, { border: string; shadow: string; text: string }> = {
    orange: {
        border: "border-accent-glow hover:border-accent/50",
        shadow: "hover:shadow-accent",
        text: "text-gradient-accent",
    },
    green: {
        border: "border-success-glow hover:border-success/50",
        shadow: "hover:shadow-success",
        text: "text-gradient-success",
    },
};

const StatCard = ({ value, label, suffix = "", prefix = "", accent, delay = 0 }: StatCardProps) => {
    const classes = accentClasses[accent];

    return (
        <motion.div
            className={`bg-white/5 backdrop-blur-sm rounded-card p-6 text-center border ${classes.border} transition-all duration-300 ${classes.shadow}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -4 }}
        >
            <div className={`text-4xl md:text-5xl font-bold mb-2 ${classes.text}`}>
                <Counter to={value} duration={2} suffix={suffix} prefix={prefix} />
            </div>
            <p className="text-white/70 text-sm font-medium">{label}</p>
        </motion.div>
    );
};

export default StatCard;
