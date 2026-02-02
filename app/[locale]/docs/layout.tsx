import React from "react";
import DocsSidebar from "./DocsSidebar";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 py-8 lg:py-12">
                    <DocsSidebar />
                    <main className="flex-1 min-w-0 lg:pl-8 mt-12">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
