import React from 'react';

interface CategoryChipProps {
    category?: string;
    children: React.ReactNode;
    as?: React.ElementType;
}

export const CategoryChip = ({
                                 children,
                                 as: Component = 'span',
                             }: CategoryChipProps) => {
    return (
        <Component className="py-1 px-2 my-1 rounded text-[0.85rem] font-semibold capitalize inline-block bg-accent/20 text-accent border border-accent/30">
            {children}
        </Component>
    );
};

