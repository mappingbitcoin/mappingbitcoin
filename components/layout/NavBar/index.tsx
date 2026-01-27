"use client";

import React, {useState, useRef, useEffect} from "react";
import {Link, usePathname} from '@/i18n/navigation';
import Image from "next/image";
import {useTranslations} from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useNostrAuth, useNpub } from "@/contexts/NostrAuthContext";

const menuItems = [
    'map',
    'countries',
    'contact',
]

interface NostrProfile {
    name?: string;
    display_name?: string;
    picture?: string;
    about?: string;
    nip05?: string;
}

// Fetch user profile from relays (NIP-01 kind:0)
async function fetchNostrProfile(pubkey: string): Promise<NostrProfile | null> {
    const relays = [
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://nos.lol",
        "wss://relay.snort.social",
    ];

    for (const relayUrl of relays) {
        try {
            const profile = await fetchProfileFromRelay(relayUrl, pubkey);
            if (profile) return profile;
        } catch (e) {
            console.warn(`Failed to fetch profile from ${relayUrl}:`, e);
        }
    }
    return null;
}

function fetchProfileFromRelay(relayUrl: string, pubkey: string): Promise<NostrProfile | null> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            ws.close();
            resolve(null);
        }, 5000);

        const ws = new WebSocket(relayUrl);

        ws.onopen = () => {
            const subId = `profile-${Date.now()}`;
            ws.send(JSON.stringify(["REQ", subId, {
                kinds: [0],
                authors: [pubkey],
                limit: 1,
            }]));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data[0] === "EVENT" && data[2]?.kind === 0) {
                    clearTimeout(timeout);
                    ws.close();
                    const content = JSON.parse(data[2].content);
                    resolve(content);
                } else if (data[0] === "EOSE") {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(null);
                }
            } catch {
                // Ignore parse errors
            }
        };

        ws.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
        };
    });
}

const UserAvatar = ({ pubkey, picture, name }: { pubkey: string; picture?: string; name?: string }) => {
    // Generate a deterministic color based on pubkey
    const hue = parseInt(pubkey.slice(0, 8), 16) % 360;
    const initial = name ? name.charAt(0).toUpperCase() : pubkey.slice(0, 2).toUpperCase();

    if (picture) {
        return (
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all">
                <img
                    src={picture}
                    alt={name || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to colored circle if image fails
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-white text-xs font-bold" style="background-color: hsl(${hue}, 60%, 45%)">${initial}</div>
                        `;
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-accent/50 transition-all"
            style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
        >
            {initial}
        </div>
    );
};

const NavBar = () => {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const t = useTranslations("menu");
    const { user, logout } = useNostrAuth();
    const npub = useNpub(user?.pubkey);
    const [profile, setProfile] = useState<NostrProfile | null>(null);

    const openMenu = () => {
        setMenuOpen(true);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    // Fetch user profile when logged in
    useEffect(() => {
        if (user?.pubkey) {
            fetchNostrProfile(user.pubkey).then(setProfile);
        } else {
            setProfile(null);
        }
    }, [user?.pubkey]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        closeMenu();
    };

    const displayName = profile?.display_name || profile?.name || (npub ? `${npub.slice(0, 12)}...` : user?.pubkey?.slice(0, 12) + "...");

    return (
        <motion.nav
            className="w-full py-1 px-6 md:px-8 bg-primary/90 text-white fixed top-0 z-1000 backdrop-blur-[20px] border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="max-w-container mx-auto flex justify-between items-center">
                {!menuOpen ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Link href="/">
                                <Image
                                    src={'/mapping-bitcoin-logo.svg'}
                                    alt={'MappingBitcoin.com'}
                                    width={120} height={36}
                                />
                            </Link>
                        </motion.div>

                        {/* Desktop Navigation + CTA */}
                        <div className="hidden md:flex items-center gap-8">
                            <ul className="flex items-center gap-8 list-none">
                                {menuItems.map((el, ix) => (
                                    <motion.li
                                        key={ix}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 + ix * 0.05 }}
                                    >
                                        <Link
                                            onClick={closeMenu}
                                            className={`text-white/70 no-underline text-sm font-medium transition-colors duration-300 relative hover:text-white ${
                                                pathname === `/${el}` ? 'text-white' : ''
                                            }`}
                                            href={`/${el}`}
                                        >
                                            {t(el)}
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                <Link
                                    href="/places/create"
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent/10 border border-accent rounded-lg hover:bg-accent/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('addPlace')}
                                </Link>

                                {user ? (
                                    <div className="relative" ref={userMenuRef}>
                                        <motion.button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="group flex items-center gap-2 p-1 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <UserAvatar
                                                pubkey={user.pubkey}
                                                picture={profile?.picture}
                                                name={profile?.name}
                                            />
                                        </motion.button>

                                        <AnimatePresence>
                                            {userMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 mt-2 w-64 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden"
                                                >
                                                    <div className="p-4 border-b border-border-light">
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar
                                                                pubkey={user.pubkey}
                                                                picture={profile?.picture}
                                                                name={profile?.name}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-white truncate">
                                                                    {displayName}
                                                                </p>
                                                                {profile?.nip05 && (
                                                                    <p className="text-xs text-accent truncate">
                                                                        {profile.nip05}
                                                                    </p>
                                                                )}
                                                                {!profile?.nip05 && npub && (
                                                                    <p className="text-xs text-text-light font-mono truncate">
                                                                        {npub.slice(0, 16)}...
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {user.mode === 'read' && (
                                                            <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                                                {t('readOnly')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-1">
                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                            </svg>
                                                            {t('logout')}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent border border-accent rounded-lg hover:bg-accent-dark transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                        </svg>
                                        {t('login')}
                                    </Link>
                                )}
                            </motion.div>
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={openMenu}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </motion.button>
                    </>
                ) : (
                    <AnimatePresence>
                        <motion.div
                            className="fixed h-screen top-0 left-0 w-full bg-primary/98 backdrop-blur-[20px] flex flex-col items-center justify-center gap-8 overscroll-none touch-none z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {menuItems.map((el, ix) =>
                                <motion.div
                                    key={ix}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: ix * 0.1 }}
                                >
                                    <Link
                                        onClick={closeMenu}
                                        className={`text-white/80 text-xl no-underline font-medium transition-colors duration-300 hover:text-accent ${
                                            pathname === `/${el}` ? 'text-white' : ''
                                        }`}
                                        href={`/${el}`}
                                    >
                                        {t(el)}
                                    </Link>
                                </motion.div>
                            )}

                            {/* Mobile CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <Link
                                    onClick={closeMenu}
                                    href="/places/create"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-accent/10 border border-accent rounded-lg hover:bg-accent/20 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('addPlace')}
                                </Link>

                                {user ? (
                                    <div className="flex flex-col items-center gap-4 mt-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar
                                                pubkey={user.pubkey}
                                                picture={profile?.picture}
                                                name={profile?.name}
                                            />
                                            <div>
                                                <p className="text-sm text-white font-medium">
                                                    {displayName}
                                                </p>
                                                {profile?.nip05 && (
                                                    <p className="text-xs text-accent">
                                                        {profile.nip05}
                                                    </p>
                                                )}
                                                {user.mode === 'read' && (
                                                    <span className="inline-block px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                                        {t('readOnly')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white/80 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                            </svg>
                                            {t('logout')}
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        onClick={closeMenu}
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-accent border border-accent rounded-lg hover:bg-accent-dark transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                        </svg>
                                        {t('login')}
                                    </Link>
                                )}
                            </motion.div>

                            {/* Close Button */}
                            <motion.button
                                className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={closeMenu}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                aria-label="Close menu"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.nav>
    );
};

export default NavBar;
