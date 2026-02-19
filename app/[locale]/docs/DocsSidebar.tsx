'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsConfig } from "./docsConfig";
import { useState } from "react";

export default function DocsSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Extract current slug from pathname
    const pathParts = pathname.split('/');
    const currentSlug = pathParts[pathParts.length - 1];
    const isDocsRoot = pathname.endsWith('/docs');

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-4 right-4 z-50 bg-accent text-black p-3 rounded-full shadow-lg"
                aria-label="Toggle docs menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 z-40
                    w-72 h-screen lg:h-auto
                    bg-primary lg:bg-transparent
                    transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                    pt-20 lg:pt-0
                    px-4 lg:px-0
                `}
            >
                <nav className="py-6 lg:py-8 lg:pr-8 lg:border-r lg:border-white/10">
                    <div className="mb-6">
                        <Link
                            href="/docs"
                            className="text-xl font-semibold text-white hover:text-accent transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Documentation
                        </Link>
                    </div>

                    {docsConfig.map((section) => (
                        <div key={section.title} className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = currentSlug === item.slug || (isDocsRoot && item.slug === 'overview');
                                    return (
                                        <li key={item.slug}>
                                            <Link
                                                href={`/docs/${item.slug}`}
                                                onClick={() => setIsOpen(false)}
                                                className={`
                                                    block py-2 px-3 rounded-md text-sm transition-colors
                                                    ${isActive
                                                        ? 'bg-accent/10 text-accent border-l-2 border-accent'
                                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                {item.title}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
