import { ReactNode } from "react";

type Background = "white" | "light" | "gradient" | "dark" | "none" | "transparent" | "gradient-transparent" | "light-transparent";
type MaxWidth = "container" | "narrow" | "article" | "none";

interface PageSectionProps {
    children: ReactNode;
    background?: Background;
    maxWidth?: MaxWidth;
    className?: string;
}

const bgClasses: Record<Background, string> = {
    white: "bg-surface",
    light: "bg-primary-light",
    gradient: "bg-gradient-primary",
    dark: "bg-primary",
    none: "",
    transparent: "bg-transparent",
    "gradient-transparent": "bg-primary/80 backdrop-blur-sm",
    "light-transparent": "bg-primary-light/80 backdrop-blur-sm",
};

const maxWidthClasses: Record<MaxWidth, string> = {
    container: "max-w-container",
    narrow: "max-w-[600px]",
    article: "max-w-[900px]",
    none: "",
};

export default function PageSection({
    children,
    background = "none",
    maxWidth = "container",
    className = "",
}: PageSectionProps) {
    return (
        <section className={`w-full py-20 px-8 ${bgClasses[background]}`}>
            <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${className}`}>
                {children}
            </div>
        </section>
    );
}
