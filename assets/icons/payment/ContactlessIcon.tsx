import { IconProps } from "../types";

export function ContactlessIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M8.5 14.5A4.5 4.5 0 0 1 13 10" />
            <path d="M5.5 17.5A8.5 8.5 0 0 1 14 9" />
            <path d="M2.5 20.5A12.5 12.5 0 0 1 15 8" />
        </svg>
    );
}
