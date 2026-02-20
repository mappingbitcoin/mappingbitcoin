"use client";

import { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ShieldCheckIcon, EditIcon, ChatIcon, LockIcon, ChevronRightIcon } from "@/assets/icons/ui";

// Animation variants
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
};

// Wrapper for animated sections
function AnimatedSection({
    children,
    className = "",
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.section
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {children}
        </motion.section>
    );
}

// Hero Section with animations
interface HeroSectionProps {
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    pattern?: ReactNode; // TopographicPattern
    poweredBySection?: ReactNode; // PoweredBySection
}

export function HeroSection({
    title,
    description,
    ctaPrimary,
    ctaSecondary,
    pattern,
    poweredBySection,
}: HeroSectionProps) {
    return (
        <section className="min-h-screen pt-20 pb-16 flex items-center justify-center px-6 relative overflow-hidden">
            {/* Backgrounds - extend above navbar for seamless look */}
            <div className="absolute inset-0 -top-20 bg-gradient-to-b from-[#1A1A1A] via-[#0D0D0D] to-[#0D0D0D]" />
            <div className="absolute inset-0 -top-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent" />

            {/* TopographicPattern */}
            {pattern}

            <div className="relative z-10 text-center max-w-4xl mx-auto">
                <motion.h1
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {title}
                </motion.h1>
                <motion.p
                    className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {description}
                </motion.p>
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <Link
                        href="/map"
                        className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                    >
                        {ctaPrimary}
                    </Link>
                    <Link
                        href="/countries"
                        className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold rounded-lg transition-colors"
                    >
                        {ctaSecondary}
                    </Link>
                </motion.div>

                {/* Powered by section */}
                {poweredBySection}
            </div>
        </section>
    );
}

// Own Business Section
interface OwnBusinessSectionProps {
    title: string;
    description: string;
    verifyLink: string;
    cta: string;
    benefits: {
        verified: { title: string; description: string };
        edit: { title: string; description: string };
        reviews: { title: string; description: string };
        secure: { title: string; description: string };
    };
}

export function OwnBusinessSection({
    title,
    description,
    verifyLink,
    cta,
    benefits,
}: OwnBusinessSectionProps) {
    const benefitItems = [
        { ...benefits.verified, icon: ShieldCheckIcon, color: "green" },
        { ...benefits.edit, icon: EditIcon, color: "blue" },
        { ...benefits.reviews, icon: ChatIcon, color: "purple" },
        { ...benefits.secure, icon: LockIcon, color: "orange" },
    ];

    const colorClasses: Record<string, string> = {
        green: "bg-green-500/10 text-green-500",
        blue: "bg-blue-500/10 text-blue-500",
        purple: "bg-purple-500/10 text-purple-500",
        orange: "bg-orange-500/10 text-orange-500",
    };

    return (
        <AnimatedSection className="py-16 md:py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                            {title}
                        </h2>
                        <p className="text-gray-400 mb-6">{description}</p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/verify-your-business"
                                className="inline-flex items-center justify-center px-6 py-3 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                            >
                                {verifyLink}
                            </Link>
                            <Link
                                href="/places/create"
                                className="inline-flex items-center justify-center px-6 py-3 border border-white/30 hover:border-white/60 text-white font-semibold rounded-lg transition-colors"
                            >
                                {cta}
                            </Link>
                        </div>
                    </motion.div>
                    <motion.div
                        className="grid grid-cols-2 gap-4"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {benefitItems.map((benefit, index) => (
                            <motion.div
                                key={index}
                                className="p-5 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                                variants={staggerItem}
                                transition={{ duration: 0.5 }}
                            >
                                <div className={`w-10 h-10 mb-3 rounded-full ${colorClasses[benefit.color]} flex items-center justify-center`}>
                                    <benefit.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                                <p className="text-gray-400 text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </AnimatedSection>
    );
}

// How It Works Section
interface HowItWorksSectionProps {
    title: string;
    features: { title: string; description: string }[];
}

export function HowItWorksSection({ title, features }: HowItWorksSectionProps) {
    return (
        <AnimatedSection className="py-16 md:py-24 px-6 bg-[#111111]">
            <div className="max-w-6xl mx-auto">
                <motion.h2
                    className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center"
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {title}
                </motion.h2>
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="text-center p-6"
                            variants={staggerItem}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div
                                className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <span className="text-orange-500 font-bold text-lg">{index + 1}</span>
                            </motion.div>
                            <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </AnimatedSection>
    );
}

// Regions Section
interface RegionsSectionProps {
    title: string;
    venuesLabel: string;
    regions: { name: string; count: number }[];
}

export function RegionsSection({ title, venuesLabel, regions }: RegionsSectionProps) {
    return (
        <AnimatedSection className="py-16 md:py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <motion.h2
                    className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center"
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {title}
                </motion.h2>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {regions.map((region, index) => (
                        <motion.div key={index} variants={staggerItem} transition={{ duration: 0.5 }}>
                            <Link
                                href="/countries"
                                className="group flex items-center justify-between p-6 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-orange-500/50 transition-all"
                            >
                                <div>
                                    <div className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                                        {region.name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {region.count.toLocaleString()} {venuesLabel}
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </AnimatedSection>
    );
}

// Top Countries Section
interface TopCountriesSectionProps {
    title: string;
    venuesLabel: string;
    countries: { code: string; name: string; flag: string; count: number; slug: string }[];
}

export function TopCountriesSection({ title, venuesLabel, countries }: TopCountriesSectionProps) {
    return (
        <AnimatedSection className="py-16 md:py-24 px-6 bg-[#111111]">
            <div className="max-w-6xl mx-auto">
                <motion.h2
                    className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center"
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {title}
                </motion.h2>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {countries.slice(0, 6).map((country, index) => (
                        <motion.div key={index} variants={staggerItem} transition={{ duration: 0.5 }}>
                            <Link
                                href={`/bitcoin-shops-in-${country.slug}`}
                                className="group flex items-center gap-4 p-6 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-orange-500/50 transition-all"
                            >
                                <motion.span
                                    className="text-4xl"
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    {country.flag}
                                </motion.span>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                                        {country.name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {country.count.toLocaleString()} {venuesLabel}
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </AnimatedSection>
    );
}
