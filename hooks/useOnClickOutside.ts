import React, { useEffect, useRef } from 'react';

export const useOnClickOutside = (
    refs: React.RefObject<HTMLElement | null>[],
    callback: () => void
) => {
    // Store callback in a ref so the effect never re-runs when it changes
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    // Store refs array in a ref to avoid re-registering on every render
    const refsRef = useRef(refs);
    refsRef.current = refs;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            // Check if click is inside any of the provided refs
            const isClickInside = refsRef.current.some(ref =>
                ref.current?.contains(target)
            );

            // Check if click is inside a modal (portaled elements)
            const isClickInsideModal = (target as Element).closest?.('[data-modal="true"]');

            if (!isClickInside && !isClickInsideModal) {
                callbackRef.current();
            }
        };

        document.addEventListener('mouseup', handleClickOutside);
        document.addEventListener('touchend', handleClickOutside);

        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
            document.removeEventListener('touchend', handleClickOutside);
        };
    }, []); // stable -- no deps needed, reads from refs
};
