import { useEffect, useRef } from "react";

export function useDebouncedEffect(
    effect: () => void,
    deps: unknown[],
    delay: number
) {
    const firstCall = useRef(true);
    const timeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
        }

        timeout.current = setTimeout(() => {
            if (firstCall.current) {
                firstCall.current = false;
                return;
            }
            effect();
        }, delay);

        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay]);
}
