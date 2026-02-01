"use client";

import { usePathname } from '@/i18n/navigation';
import { OSMIcon } from "@/assets/icons/social";
import Button from "@/components/ui/Button";

export default function LoginWithOSM() {
    const pathname = usePathname();

    const handleLogin = () => {
        // Use window.location for API routes to avoid i18n Link handling
        window.location.href = `/api/auth/osm?returnTo=${encodeURIComponent(pathname)}`;
    };

    return (
        <Button
            onClick={handleLogin}
            variant="outline"
            color="neutral"
            leftIcon={<OSMIcon className="w-4 h-4" />}
        >
            Connect with OSM
        </Button>
    );
}
