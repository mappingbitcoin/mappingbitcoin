'use client';

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { useBlogSearch } from "@/hooks";
import type { BlogPostMeta } from "@/lib/blog/parser";

interface BlogSidebarProps {
    posts: BlogPostMeta[];
    categories: string[];
}

export default function BlogSidebar({ posts, categories }: BlogSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const currentCategory = searchParams.get('category');
    const isBlogRoot = pathname.endsWith('/blog');

    const { query, setQuery, results, isLoading, total, clear } = useBlogSearch({
        limit: 5,
        debounceMs: 300,
    });

    // Close results dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/blog?q=${encodeURIComponent(query.trim())}`);
            setShowResults(false);
            setIsOpen(false);
        }
    }, [query, router]);

    const handleResultClick = useCallback(() => {
        clear();
        setShowResults(false);
        setIsOpen(false);
    }, [clear]);

    const handleCategoryClick = useCallback((category: string) => {
        if (currentCategory === category) {
            router.push('/blog');
        } else {
            router.push(`/blog?category=${encodeURIComponent(category)}`);
        }
        setIsOpen(false);
    }, [currentCategory, router]);

    // Get recent posts (top 5)
    const recentPosts = posts.slice(0, 5);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-4 right-4 z-50 bg-accent text-black p-3 rounded-full shadow-lg"
                aria-label="Toggle blog menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                    fixed lg:sticky top-0 lg:top-24 right-0 z-40
                    w-72 lg:h-fit lg:max-h-[calc(100vh-8rem)]
                    bg-primary lg:bg-transparent
                    transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                    h-screen lg:self-start
                    pt-20 lg:pt-0
                    px-4 lg:px-0
                    lg:w-64 lg:flex-shrink-0
                `}
            >
                <div className="py-6 lg:py-0 lg:pl-8 lg:border-l lg:border-white/10">
                    {/* Search */}
                    <div className="mb-8" ref={searchRef}>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                            Search
                        </h3>
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Search posts..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent"
                                >
                                    {isLoading ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </button>

                                {/* Search Results Dropdown */}
                                {showResults && query.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                                        {isLoading ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">
                                                Searching...
                                            </div>
                                        ) : results.length > 0 ? (
                                            <>
                                                <ul className="max-h-64 overflow-y-auto">
                                                    {results.map((post) => (
                                                        <li key={post.slug}>
                                                            <Link
                                                                href={`/blog/${post.slug}`}
                                                                onClick={handleResultClick}
                                                                className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                                            >
                                                                <p className="text-sm text-white font-medium line-clamp-1">
                                                                    {post.title}
                                                                </p>
                                                                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                                                                    {post.description}
                                                                </p>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {total > results.length && (
                                                    <button
                                                        type="submit"
                                                        className="w-full px-4 py-2 text-xs text-accent hover:bg-white/5 transition-colors text-center"
                                                    >
                                                        View all {total} results
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-4 text-center text-gray-400 text-sm">
                                                No posts found for &quot;{query}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Categories */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                            Categories
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`
                                        text-xs px-3 py-1.5 rounded-full transition-colors
                                        ${currentCategory === category
                                            ? 'bg-accent text-black font-medium'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Posts */}
                    {isBlogRoot && (
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                                Recent Posts
                            </h3>
                            <ul className="space-y-3">
                                {recentPosts.map((post) => (
                                    <li key={post.slug}>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="block text-sm text-gray-300 hover:text-accent transition-colors line-clamp-2"
                                        >
                                            {post.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Back to Blog (when on article page) */}
                    {!isBlogRoot && (
                        <div className="mb-8">
                            <Link
                                href="/blog"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to all posts
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
