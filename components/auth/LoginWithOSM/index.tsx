"use client";

import Image from 'next/image'
import {Link, usePathname} from '@/i18n/navigation';

export default function LoginWithOSM() {
    const pathname = usePathname();

    const loginUrl = `/api/auth/osm?returnTo=${encodeURIComponent(pathname)}`;

    return (
        <Link href={loginUrl}>
            <button>
                <Image src="/assets/icons/osm.svg" alt="OSM" width={15} height={15}/>
                {' '}CONNECT WITH OSM
            </button>
        </Link>
    );
}
