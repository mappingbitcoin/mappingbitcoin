import React, { useEffect } from 'react';

export const useOnClickOutside = (
    refs: React.RefObject<HTMLElement | null>[],
    callback: () => void
) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            // Check if click is inside any of the provided refs
            const isClickInside = refs.some(ref =>
                ref.current?.contains(target)
            );

            // Check if click is inside a modal (portaled elements)
            const isClickInsideModal = (target as Element).closest?.('[data-modal="true"]');

            if (!isClickInside && !isClickInsideModal) {
                callback();
            }
        };

        document.addEventListener('mouseup', handleClickOutside);
        document.addEventListener('touchend', handleClickOutside);

        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
            document.removeEventListener('touchend', handleClickOutside);
        };
    }, [refs, callback]);
};
