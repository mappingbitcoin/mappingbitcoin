import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts, type BlogPostMeta } from '@/lib/blog/parser';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category')?.toLowerCase();
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query && !category) {
        return NextResponse.json({ results: [], total: 0 });
    }

    let posts = getAllBlogPosts(locale);

    // Filter by search query
    if (query) {
        posts = posts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.description.toLowerCase().includes(query) ||
            post.tags.some(tag => tag.toLowerCase().includes(query)) ||
            post.author.toLowerCase().includes(query)
        );
    }

    // Filter by category
    if (category) {
        posts = posts.filter(post =>
            post.tags.some(tag => tag.toLowerCase() === category)
        );
    }

    const total = posts.length;
    const results = posts.slice(0, limit);

    return NextResponse.json({ results, total });
}
