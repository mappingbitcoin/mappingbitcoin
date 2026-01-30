import { IconProps } from "../types";

export function QuestionCircleIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
            <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.06-1.06 3 3 0 112.12 5.122.75.75 0 01-.75.75v.75a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75 1.5 1.5 0 00.44-2.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
            />
        </svg>
    );
}
