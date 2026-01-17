import React, { useEffect, useRef, useState } from "react";

export function useContainerSize(): [React.RefObject<HTMLDivElement | null>, { width: number; height: number }] {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 800, height: 400 });

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setSize({ width, height });
            }
        });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return [ref, size];
}
