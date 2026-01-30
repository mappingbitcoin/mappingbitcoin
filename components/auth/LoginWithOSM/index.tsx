"use client";

import {Link, usePathname} from '@/i18n/navigation';
import { OSMIcon } from "@/assets/icons/social";

export default function LoginWithOSM() {
    const pathname = usePathname();

    const loginUrl = `/api/auth/osm?returnTo=${encodeURIComponent(pathname)}`;

    return (
        <Link href={loginUrl}>
            <button>
                <OSMIcon className="w-4 h-4 inline-block" />
                {' '}CONNECT WITH OSM
            </button>
        </Link>
    );
}
