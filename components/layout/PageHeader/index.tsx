import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string | ReactNode;
    centered?: boolean;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    centered = true,
    className = "",
}: PageHeaderProps) {
    return (
        <header className={`mb-8 ${centered ? "text-center" : ""} ${className}`}>
            <h1 className="text-4xl font-bold mb-4 max-md:text-3xl">{title}</h1>
            {description && (
                <p className="text-gray-600 text-lg max-w-175 mx-auto max-md:text-base">
                    {description}
                </p>
            )}
        </header>
    );
}
