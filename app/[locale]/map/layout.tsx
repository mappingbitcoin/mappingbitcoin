'use client';

import { usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function MapLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        // Apply lock if on /map
        if (pathname === '/map') {
            const scrollY = window.scrollY;

            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Clean up
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('position');
                document.body.style.removeProperty('top');
                document.body.style.removeProperty('width');

                window.scrollTo({ top: scrollY });
            };
        }
    }, [pathname]);

    return <>{children}</>;
}
