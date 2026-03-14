"use client";

import React from "react";
import { Link } from "@/i18n/navigation";

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-text-light mt-1">Admin Overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Map Sync Card */}
                <Link
                    href={"/admin/map-sync"}
                    className="bg-surface rounded-xl border border-border-light p-6 hover:border-primary transition-colors"
                >
                    <div className="text-sm text-text-light mb-1">Map Sync</div>
                    <div className="text-lg font-bold text-white mt-2">
                        OSM Data Tools
                    </div>
                    <div className="text-sm text-primary mt-2">Manage sync &rarr;</div>
                </Link>

                {/* Marketing Card */}
                <Link
                    href={"/admin/marketing"}
                    className="bg-surface rounded-xl border border-border-light p-6 hover:border-primary transition-colors"
                >
                    <div className="text-sm text-text-light mb-1">Marketing</div>
                    <div className="text-lg font-bold text-white mt-2">
                        Campaigns & Outreach
                    </div>
                    <div className="text-sm text-primary mt-2">Manage &rarr;</div>
                </Link>

                {/* Nostr Bot Card */}
                <Link
                    href={"/admin/nostr-bot"}
                    className="bg-surface rounded-xl border border-border-light p-6 hover:border-primary transition-colors"
                >
                    <div className="text-sm text-text-light mb-1">Nostr Bot</div>
                    <div className="text-lg font-bold text-white mt-2">
                        Bot Management
                    </div>
                    <div className="text-sm text-primary mt-2">Manage &rarr;</div>
                </Link>
            </div>
        </div>
    );
}
