"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

type AnimationType = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scale" | "stagger";

interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    once?: boolean;
    amount?: number;
    as?: "section" | "div" | "article" | "aside";
}

const animations: Record<AnimationType, Variants> = {
    fadeUp: {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0 },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
    fadeLeft: {
        hidden: { opacity: 0, x: -40 },
        visible: { opacity: 1, x: 0 },
    },
    fadeRight: {
        hidden: { opacity: 0, x: 40 },
        visible: { opacity: 1, x: 0 },
    },
    scale: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
    },
    stagger: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    },
};

export default function AnimatedSection({
    children,
    className = "",
    animation = "fadeUp",
    delay = 0,
    duration = 0.6,
    once = true,
    amount = 0.2,
    as = "section",
}: AnimatedSectionProps) {
    const Component = motion[as];

    return (
        <Component
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={animations[animation]}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
        >
            {children}
        </Component>
    );
}

// Staggered children animation wrapper
interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
    amount?: number;
}

export function StaggerContainer({
    children,
    className = "",
    staggerDelay = 0.1,
    once = true,
    amount = 0.2,
}: StaggerContainerProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, amount }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

// Individual stagger item
interface StaggerItemProps {
    children: ReactNode;
    className?: string;
    duration?: number;
}

export function StaggerItem({
    children,
    className = "",
    duration = 0.5,
}: StaggerItemProps) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            transition={{
                duration,
                ease: [0.25, 0.1, 0.25, 1],
            }}
        >
            {children}
        </motion.div>
    );
}
