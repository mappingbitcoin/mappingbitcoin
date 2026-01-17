"use client";

import React, {ReactElement, useState} from "react";

const WikiPreview = ({ href, children }: { href: string, children: ReactElement }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const wikiTitle = decodeURIComponent(href.split("/wiki/")[1]);

    const fetchSummary = async () => {
        if (summary) return; // Avoid re-fetching
        try {
            const res = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`
            );
            const data = await res.json();

            if (data.extract) setSummary(data.extract);
        } catch (error) {
            console.error("Wikipedia fetch error:", error);
        }
    };

    return (
        <span
            onMouseEnter={() => {
                fetchSummary();
                setVisible(true);
            }}
            onMouseLeave={() => setVisible(false)}
            className="relative cursor-pointer text-accent underline transition-colors duration-200 hover:text-accent-light group"
        >
            {children}
            {visible && summary && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[120%] w-[260px] bg-white text-gray-700 p-2.5 shadow-[0_4px_8px_rgba(0,0,0,0.15)] text-sm leading-snug z-[9999] before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-solid before:border-t-white before:border-x-transparent before:border-b-transparent">
                    <strong>{wikiTitle.replace(/_/g, " ")}</strong>
                    <br />
                    <span className="font-light">{(summary ?? "").slice(0, 200)}...</span>
                </span>
            )}
        </span>
    );
};

export default WikiPreview;
