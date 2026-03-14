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
    slugs?: Record<string, string>;  // Locale-specific slugs from frontmatter
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
    const { data, content: rawContent } = matter(fileContent);

    // Strip first H1 from content (we render title as H1 in component to avoid duplicates)
    // Account for potential leading whitespace/newlines after frontmatter
    const content = rawContent.replace(/^\s*#\s+.+\n+/, '');

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
        slugs: data.slugs || undefined,
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
 * Given a blog post slug in one locale, find the slug for a target locale.
 * Uses the frontmatter slugs map if available.
 */
export function getBlogSlugForLocale(
    currentSlug: string,
    currentLocale: string,
    targetLocale: string
): string | null {
    // If same locale, return same slug
    if (currentLocale === targetLocale) return currentSlug;

    // Try to read the current post to get its slugs map
    const post = getBlogPostMeta(currentSlug, currentLocale);
    if (!post?.slugs) return null;

    const targetSlug = post.slugs[targetLocale];
    if (!targetSlug) return null;

    // Verify the target post actually exists
    const targetPost = getBlogPostMeta(targetSlug, targetLocale);
    return targetPost ? targetSlug : null;
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
 * Get available locales for a specific blog post, with locale-specific slugs
 */
export function getPostAvailableLocales(slug: string, currentLocale: string = 'en'): { locale: string; slug: string }[] {
    const currentPost = getBlogPostMeta(slug, currentLocale);
    const result: { locale: string; slug: string }[] = [];

    // Always include current locale
    result.push({ locale: currentLocale, slug });

    if (currentPost?.slugs) {
        // Use frontmatter slugs map for other locales
        for (const [locale, localeSlug] of Object.entries(currentPost.slugs)) {
            if (locale === currentLocale) continue;
            const targetPost = getBlogPostMeta(localeSlug, locale);
            if (targetPost) {
                result.push({ locale, slug: localeSlug });
            }
        }
    } else {
        // Fallback: check all blog locale directories for same slug
        const allLocales = getAvailableBlogLocales();
        for (const locale of allLocales) {
            if (locale === currentLocale) continue;
            const filePath = path.join(BLOG_DIR, locale, `${slug}.md`);
            if (fs.existsSync(filePath)) {
                result.push({ locale, slug });
            }
        }
    }

    return result;
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

/**
 * Get related posts based on shared tags
 */
export function getRelatedPosts(slug: string, locale: string = 'en', limit: number = 3): BlogPostMeta[] {
    const currentPost = getBlogPostMeta(slug, locale);
    if (!currentPost) return [];

    const allPosts = getAllBlogPosts(locale);
    const currentTags = new Set(currentPost.tags.map(t => t.toLowerCase()));

    // Score posts by number of shared tags
    const scoredPosts = allPosts
        .filter(post => post.slug !== slug) // Exclude current post
        .map(post => {
            const sharedTags = post.tags.filter(tag =>
                currentTags.has(tag.toLowerCase())
            ).length;
            return { post, score: sharedTags };
        })
        .filter(({ score }) => score > 0) // Only include posts with at least one shared tag
        .sort((a, b) => b.score - a.score); // Sort by most shared tags

    return scoredPosts.slice(0, limit).map(({ post }) => post);
}
