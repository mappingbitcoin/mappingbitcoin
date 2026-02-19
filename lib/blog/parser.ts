import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPostMeta {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    authorPubkey?: string;
    tags: string[];
    featuredImage: string;
    featuredImageAlt: string;
    ogImage: string;           // For social media previews (must be JPG/PNG)
    previewImage: string;      // For blog listing cards
}

export interface BlogPost extends BlogPostMeta {
    content: string;
}

const BLOG_DIR = path.join(process.cwd(), 'public', 'blog');

/**
 * Get all blog post slugs for a locale
 */
export function getBlogSlugs(locale: string = 'en'): string[] {
    const dir = path.join(BLOG_DIR, locale);

    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace(/\.md$/, ''));
}

/**
 * Parse a single blog post by slug
 */
export function getBlogPost(slug: string, locale: string = 'en'): BlogPost | null {
    const filePath = path.join(BLOG_DIR, locale, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    // For ogImage, prefer explicit ogImage, then derive JPG from featuredImage SVG, then use featuredImage as-is
    const featuredImage = data.featuredImage || '/blog/images/default-featured.svg';
    const ogImage = data.ogImage || featuredImage.replace(/\.svg$/, '.jpg');

    return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        date: data.date || new Date().toISOString().split('T')[0],
        author: data.author || 'MappingBitcoin Team',
        authorPubkey: data.authorPubkey,
        tags: data.tags || [],
        featuredImage,
        featuredImageAlt: data.featuredImageAlt || data.title || slug,
        ogImage,
        previewImage: data.previewImage || ogImage,
        content,
    };
}

/**
 * Get metadata for a single blog post (without content)
 */
export function getBlogPostMeta(slug: string, locale: string = 'en'): BlogPostMeta | null {
    const post = getBlogPost(slug, locale);
    if (!post) return null;

    const { content, ...meta } = post;
    return meta;
}

/**
 * Get all blog posts metadata sorted by date (newest first)
 */
export function getAllBlogPosts(locale: string = 'en'): BlogPostMeta[] {
    const slugs = getBlogSlugs(locale);

    const posts = slugs
        .map(slug => getBlogPostMeta(slug, locale))
        .filter((post): post is BlogPostMeta => post !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
}

/**
 * Get adjacent posts for navigation
 */
export function getAdjacentPosts(slug: string, locale: string = 'en'): { prev?: BlogPostMeta; next?: BlogPostMeta } {
    const posts = getAllBlogPosts(locale);
    const index = posts.findIndex(post => post.slug === slug);

    if (index === -1) {
        return {};
    }

    return {
        prev: index < posts.length - 1 ? posts[index + 1] : undefined,
        next: index > 0 ? posts[index - 1] : undefined,
    };
}

/**
 * Format date for display
 */
export function formatBlogDate(dateString: string, locale: string = 'en'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Get all available locales in the blog directory
 */
export function getAvailableBlogLocales(): string[] {
    if (!fs.existsSync(BLOG_DIR)) {
        return [];
    }

    return fs.readdirSync(BLOG_DIR)
        .filter(item => {
            const itemPath = path.join(BLOG_DIR, item);
            return fs.statSync(itemPath).isDirectory() && item !== 'images';
        });
}

/**
 * Get available locales for a specific blog post
 */
export function getPostAvailableLocales(slug: string): string[] {
    const allLocales = getAvailableBlogLocales();

    return allLocales.filter(locale => {
        const filePath = path.join(BLOG_DIR, locale, `${slug}.md`);
        return fs.existsSync(filePath);
    });
}

/**
 * Language display names
 */
export const LOCALE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
};
