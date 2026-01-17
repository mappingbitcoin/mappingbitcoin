import LoginWithOSM from "../LoginWithOSM";
import {Link} from '@/i18n/navigation';
import Image from "next/image";
import {useEffect, useState} from "react";
import {useOsmUser} from "@/providers/OsmAuth";

export default function UserInfo() {
    const {user, loading} = useOsmUser()
    const [image, setImage] = useState<string>()
    const [fallbackImage, setFallbackImage] = useState<string>()

    useEffect(() => {
        if (user?.image_url) {
            const parsed = new URL(user.image_url);
            setImage(parsed.origin + parsed.pathname);
            setFallbackImage(parsed.searchParams.get("d") ?? '');
        }
    }, [user])

    return loading ? <p>Loading...</p> : !user  ? (
        <div className="flex flex-col items-start gap-3 p-4 rounded-lg bg-surface mb-4">
            <LoginWithOSM />
        </div>
    ) :(
        <div className="flex flex-col items-start gap-3 p-4 rounded-lg bg-surface [&_p]:m-0 [&_p]:font-medium [&_img]:w-10 [&_img]:h-10 [&_img]:rounded-full [&_img]:object-cover [&_img]:border-2 [&_img]:border-border [&_a]:text-accent [&_a]:no-underline [&_a]:font-bold [&_a:hover]:underline">
            <p>Welcome, {user.display_name}</p>
            {image && <Image src={image}
                             alt="avatar"
                             width={100}
                             height={100}
                             onError={() => setImage(fallbackImage)}
            />}
            <Link href="/api/auth/logout">Logout</Link>
        </div>
    );
}
