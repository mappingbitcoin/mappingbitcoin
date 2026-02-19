import React from 'react';

interface CategoryChipProps {
    category?: string;
    children: React.ReactNode;
    as?: React.ElementType;
    /** Size variant */
    size?: 'sm' | 'md';
}

/**
 * Non-interactive label/tag for displaying categories, tags, and metadata.
 * Styled to be clearly distinct from interactive buttons:
 * - Muted gray tones instead of accent colors
 * - Smaller, compact appearance
 * - No hover effects or cursor pointer
 * - Subtle dashed border
 */
export const CategoryChip = ({
    children,
    as: Component = 'span',
    size = 'md',
}: CategoryChipProps) => {
    const sizeClasses = size === 'sm'
        ? 'py-0.5 px-1.5 text-xs'
        : 'py-1 px-2 text-[0.8rem]';

    return (
        <Component
            className={`${sizeClasses} rounded-sm inline-flex items-center gap-1 font-medium capitalize bg-surface-light/80 text-text-light border border-border-light/50 border-dashed select-none`}
        >
            {children}
        </Component>
    );
};

