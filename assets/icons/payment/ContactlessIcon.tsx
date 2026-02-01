import { IconProps } from "../types";

export function ContactlessIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            {/* Contactless/NFC payment symbol - curved waves */}
            <path d="M6 12a6 6 0 0 1 6 6" />
            <path d="M6 4a14 14 0 0 1 14 14" />
            <path d="M6 8a10 10 0 0 1 10 10" />
            <circle cx="6" cy="18" r="2" fill="currentColor" />
        </svg>
    );
}
