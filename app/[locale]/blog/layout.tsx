import React from "react";
import BlogSidebar from "./BlogSidebar";
import { getAllBlogPosts } from "@/lib/blog/parser";
import { Locale } from "@/i18n/types";

interface BlogLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        locale: Locale;
    }>;
}

export default async function BlogLayout({
    children,
    params,
}: BlogLayoutProps) {
    const { locale } = await params;
    const posts = getAllBlogPosts(locale);

    // Extract unique categories from all posts
    const allTags = posts.flatMap(post => post.tags);
    const categories = [...new Set(allTags)];

    return (
        <div className="min-h-screen bg-primary pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 py-8 lg:py-12">
                    {/* Main content - now on the left */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                    {/* Sidebar - now on the right */}
                    <BlogSidebar posts={posts} categories={categories} />
                </div>
            </div>
        </div>
    );
}
