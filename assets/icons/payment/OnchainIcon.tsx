import { IconProps } from "../types";

export function OnchainIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
            {/* Bitcoin ₿ symbol */}
            <path d="M40.6 26.4c1.9-1.2 3.2-3.2 3.2-5.6 0-4.4-3.6-8-8-8h-1.6V8h-4v4.8h-4V8h-4v4.8H16v4h2.4c1.3 0 2.4 1.1 2.4 2.4v25.6c0 1.3-1.1 2.4-2.4 2.4H16v4h6.2V56h4v-4.8h4V56h4v-4.8h1.6c4.4 0 8-3.6 8-8 0-3.2-1.9-6-4.6-7.2l1.4-.8zM26.2 16.8h9.6c2.2 0 4 1.8 4 4s-1.8 4-4 4h-9.6v-8zm11.6 30.4h-11.6v-10.4h11.6c2.9 0 5.2 2.3 5.2 5.2s-2.3 5.2-5.2 5.2z" />
        </svg>
    );
}
