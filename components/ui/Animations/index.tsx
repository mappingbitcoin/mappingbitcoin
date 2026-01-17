"use client";

import { motion, Variants, HTMLMotionProps } from "framer-motion";
import React, { ReactNode } from "react";

// Animation Variants
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Fade In Component
interface FadeInProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    className?: string;
}

export const FadeIn = ({
    children,
    delay = 0,
    direction = "up",
    className = "",
    ...props
}: FadeInProps) => {
    const variants: Record<string, Variants> = {
        up: fadeInUp,
        down: fadeInDown,
        left: fadeInLeft,
        right: fadeInRight,
        none: fadeIn,
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={variants[direction]}
            transition={{ delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Stagger Container Component
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export const StaggerContainer = ({
    children,
    className = "",
    delay = 0,
    ...props
}: StaggerContainerProps) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Stagger Item Component
interface StaggerItemProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
}

export const StaggerItem = ({ children, className = "", ...props }: StaggerItemProps) => {
    return (
        <motion.div
            variants={staggerItem}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Scale on Hover Component
interface ScaleOnHoverProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    scale?: number;
    className?: string;
}

export const ScaleOnHover = ({
    children,
    scale = 1.02,
    className = "",
    ...props
}: ScaleOnHoverProps) => {
    return (
        <motion.div
            whileHover={{ scale }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Animated Button Component
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
    className?: string;
}

export const AnimatedButton = ({
    children,
    className = "",
    ...props
}: AnimatedButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
            {...props}
        >
            {children}
        </motion.button>
    );
};

// Animated Link (for wrapping Next.js Links)
interface AnimatedDivProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
}

export const AnimatedCard = ({
    children,
    className = "",
    ...props
}: AnimatedDivProps) => {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Counter Animation Component
interface CounterProps {
    from?: number;
    to: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

export const Counter = ({ from = 0, to, duration = 2, className = "", suffix = "", prefix = "" }: CounterProps) => {
    const [count, setCount] = React.useState(from);
    const [hasAnimated, setHasAnimated] = React.useState(false);
    const ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);
                        const startTime = performance.now();
                        const animate = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / (duration * 1000), 1);
                            const easeOut = 1 - Math.pow(1 - progress, 3);
                            const currentValue = Math.floor(from + (to - from) * easeOut);
                            setCount(currentValue);
                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        };
                        requestAnimationFrame(animate);
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [from, to, duration, hasAnimated]);

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={className}
        >
            {prefix}{count.toLocaleString()}{suffix}
        </motion.span>
    );
};

// Text Reveal Animation
interface TextRevealProps {
    children: string;
    className?: string;
    delay?: number;
}

export const TextReveal = ({ children, className = "", delay = 0 }: TextRevealProps) => {
    const words = children.split(" ");

    return (
        <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.05,
                        delayChildren: delay,
                    },
                },
                hidden: {},
            }}
            className={className}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ display: "inline-block", marginRight: "0.25em" }}
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
};

// Parallax Component
interface ParallaxProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    offset?: number;
    className?: string;
}

export const Parallax = ({
    children,
    offset = 50,
    className = "",
    ...props
}: ParallaxProps) => {
    return (
        <motion.div
            initial={{ y: offset }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};
