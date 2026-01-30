import { IconProps } from "../types";

export function OnchainIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h1c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-3v1h4v2h-2v2h-2v-2h-1c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3v-1h-4V9h2V7z" />
        </svg>
    );
}
