import { useState, useCallback } from 'react';
import { useDebouncedEffect } from './useDebouncedEffect';
import type { BlogPostMeta } from '@/lib/blog/parser';

interface UseBlogSearchOptions {
    locale?: string;
    limit?: number;
    debounceMs?: number;
}

interface UseBlogSearchResult {
    query: string;
    setQuery: (query: string) => void;
    results: BlogPostMeta[];
    isLoading: boolean;
    total: number;
    clear: () => void;
}

export function useBlogSearch(options: UseBlogSearchOptions = {}): UseBlogSearchResult {
    const { locale = 'en', limit = 5, debounceMs = 300 } = options;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BlogPostMeta[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const search = useCallback(async () => {
        if (!query.trim()) {
            setResults([]);
            setTotal(0);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                q: query.trim(),
                locale,
                limit: limit.toString(),
            });

            const response = await fetch(`/api/blog/search?${params}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.results);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Blog search error:', error);
            setResults([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [query, locale, limit]);

    useDebouncedEffect(search, [query], debounceMs);

    const clear = useCallback(() => {
        setQuery('');
        setResults([]);
        setTotal(0);
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        total,
        clear,
    };
}
