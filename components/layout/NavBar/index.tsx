"use client";

import React, {useState, useRef, useEffect} from "react";
import {Link, usePathname} from '@/i18n/navigation';
import Image from "next/image";
import {useTranslations} from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useNostrAuth, useNpub } from "@/contexts/NostrAuthContext";
import NavBarSearch from "./NavBarSearch";
import { LoginModal } from "@/components/auth";
import UserAvatar from "@/components/ui/UserAvatar";
import {
    BadgeCheckIcon,
    SettingsIcon,
    ShieldCheckIcon,
    LogoutIcon,
    LoginIcon,
    SearchIcon,
    MenuIcon,
    CloseIcon,
} from "@/assets/icons/ui";
import Button from "@/components/ui/Button";

const menuItems = [
    'map',
    'countries',
]

const NavBar = () => {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const t = useTranslations("menu");
    const { user, profile, isSeeder, seederInfo, logout, isAdmin } = useNostrAuth();
    const npub = useNpub(user?.pubkey);

    // Check if we're on the map page (which has its own search)
    const isMapPage = pathname === "/map" || pathname?.endsWith("/map");

    // Check if we're on an admin page - hide navbar entirely
    const isAdminPage = pathname?.includes("/admin");

    const openMenu = () => {
        setMenuOpen(true);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

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

    // Hide navbar on admin pages (admin has its own sidebar)
    if (isAdminPage) {
        return null;
    }

    return (
        <motion.nav
            className="w-full py-1 px-6 md:px-8 text-white fixed top-0 z-1000 backdrop-blur-sm border-b border-white/5"
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
                                    alt={'Mapping Bitcoin'}
                                    width={120} height={36}
                                />
                            </Link>
                        </motion.div>

                        {/* Desktop Navigation + CTA */}
                        <div className="hidden md:flex items-center gap-8">
                            <ul className="flex items-center gap-6 list-none">
                                {/* Expandable Search - hidden on map page, positioned left of Map */}
                                {!isMapPage && (
                                    <motion.li
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="group/search"
                                    >
                                        {/* Container expands from w-8 (icon only) to w-52 (full input) */}
                                        <div className="w-8 group-hover/search:w-52 group-focus-within/search:w-52 transition-all duration-300 ease-out">
                                            <NavBarSearch placeholder="Search..." expandable />
                                        </div>
                                    </motion.li>
                                )}

                                {/* Map link */}
                                <motion.li
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.15 }}
                                >
                                    <Link
                                        onClick={closeMenu}
                                        className={`text-white/70 no-underline text-sm font-medium transition-colors duration-300 relative hover:text-white ${
                                            pathname === '/map' ? 'text-white' : ''
                                        }`}
                                        href="/map"
                                    >
                                        {t('map')}
                                    </Link>
                                </motion.li>

                                {/* Other menu items */}
                                {menuItems.slice(1).map((el, ix) => (
                                    <motion.li
                                        key={ix}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 + ix * 0.05 }}
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
                                                isSeeder={isSeeder}
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
                                                                isSeeder={isSeeder}
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
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {isSeeder && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                                                                    <BadgeCheckIcon className="w-3 h-3" />
                                                                    {seederInfo?.label || 'Community Seeder'}
                                                                </span>
                                                            )}
                                                            {user.mode === 'read' && (
                                                                <span className="inline-block px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                                                    {t('readOnly')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-1">
                                                        {isAdmin && (
                                                            <Link
                                                                href="/admin"
                                                                onClick={() => setUserMenuOpen(false)}
                                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors no-underline"
                                                            >
                                                                <SettingsIcon className="w-4 h-4" />
                                                                {t('admin')}
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href="/my-verifications"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors no-underline"
                                                        >
                                                            <ShieldCheckIcon className="w-4 h-4" />
                                                            {t('myVerifications')}
                                                        </Link>
                                                        <Button
                                                            onClick={handleLogout}
                                                            variant="ghost"
                                                            color="neutral"
                                                            size="sm"
                                                            leftIcon={<LogoutIcon />}
                                                            fullWidth
                                                            className="justify-start"
                                                        >
                                                            {t('logout')}
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setShowLoginModal(true)}
                                        leftIcon={<LoginIcon />}
                                        size="sm"
                                    >
                                        {t('login')}
                                    </Button>
                                )}
                            </motion.div>
                        </div>

                        {/* Mobile Search & Menu Buttons */}
                        <div className="flex md:hidden items-center gap-2">
                            {/* Mobile Search Button - hidden on map page */}
                            {!isMapPage && (
                                <motion.button
                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setMobileSearchOpen(true)}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="Search"
                                >
                                    <SearchIcon className="w-5 h-5" />
                                </motion.button>
                            )}
                            <motion.button
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={openMenu}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Open menu"
                            >
                                <MenuIcon className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </>
                ) : (
                    <AnimatePresence>
                        <motion.div
                            className="fixed h-screen top-0 left-0 w-full bg-primary/80 backdrop-blur-xl flex flex-col items-center justify-center gap-8 overscroll-none touch-none z-50"
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
{user ? (
                                    <div className="flex flex-col items-center gap-4 mt-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar
                                                pubkey={user.pubkey}
                                                picture={profile?.picture}
                                                name={profile?.name}
                                                isSeeder={isSeeder}
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
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {isSeeder && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                                                            <BadgeCheckIcon className="w-3 h-3" />
                                                            {seederInfo?.label || 'Community Seeder'}
                                                        </span>
                                                    )}
                                                    {user.mode === 'read' && (
                                                        <span className="inline-block px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                                                            {t('readOnly')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                onClick={closeMenu}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white/80 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors no-underline"
                                            >
                                                <SettingsIcon className="w-5 h-5" />
                                                {t('admin')}
                                            </Link>
                                        )}
                                        <Link
                                            href="/my-verifications"
                                            onClick={closeMenu}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white/80 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors no-underline"
                                        >
                                            <ShieldCheckIcon className="w-5 h-5" />
                                            {t('myVerifications')}
                                        </Link>
                                        <Button
                                            onClick={handleLogout}
                                            variant="outline"
                                            color="neutral"
                                            size="lg"
                                            leftIcon={<LogoutIcon />}
                                        >
                                            {t('logout')}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            closeMenu();
                                            setShowLoginModal(true);
                                        }}
                                        size="lg"
                                        leftIcon={<LoginIcon />}
                                    >
                                        {t('login')}
                                    </Button>
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
                                <CloseIcon className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Mobile Search Overlay */}
                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            className="fixed inset-0 bg-primary/80 backdrop-blur-xl z-50 flex flex-col p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <NavBarSearch
                                        placeholder="Search venues, cities..."
                                        onClose={() => setMobileSearchOpen(false)}
                                        autoFocus
                                    />
                                </div>
                                <motion.button
                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setMobileSearchOpen(false)}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="Close search"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </motion.button>
                            </div>
                            <p className="text-center text-white/40 text-sm mt-8">
                                Search for Bitcoin-accepting venues or locations
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
        </motion.nav>
    );
};

export default NavBar;
