import React, { useEffect } from 'react';

export const useOnClickOutside = (
    refs: React.RefObject<HTMLElement | null>[],
    callback: () => void
) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const isClickInside = refs.some(ref =>
                ref.current?.contains(event.target as Node)
            );

            if (!isClickInside) {
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
