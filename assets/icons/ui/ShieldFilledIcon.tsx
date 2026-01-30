import { IconProps } from "../types";

export function ShieldFilledIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
            <path
                fillRule="evenodd"
                d="M10 1a.75.75 0 01.65.375l3 5.25a.75.75 0 01-.65 1.125H7a.75.75 0 01-.65-1.125l3-5.25A.75.75 0 0110 1zM5.23 8.75A.75.75 0 016 8.25h8a.75.75 0 01.77.5l1.5 5.5a.75.75 0 01-.27.83l-5.25 3.5a.75.75 0 01-.83 0l-5.25-3.5a.75.75 0 01-.27-.83l1.5-5.5a.75.75 0 01.33-.5z"
                clipRule="evenodd"
            />
        </svg>
    );
}
