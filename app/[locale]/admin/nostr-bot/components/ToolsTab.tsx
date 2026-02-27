"use client";

import { useState } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { WarningIcon, CheckmarkIcon, SearchIcon, LinkIcon } from "@/assets/icons/ui";
import ToolCard from "@/app/[locale]/admin/map-sync/components/ToolCard";

// ============================================================================
// Types
// ============================================================================

interface PreviewEvent {
    eventId: string;
    venueName: string;
    osmId: string;
    oldUrl: string;
    newUrl: string;
    method: string;
    createdAt: number;
    claimId: string;
}

interface PreviewData {
    totalBotPosts: number;
    verificationPosts: number;
    matchedToClaims: number;
    unmatchedCount: number;
    badUrlCount: number;
    events: PreviewEvent[];
    hasMore: boolean;
    actions: string[];
}

interface ExecuteResult {
    success: boolean;
    message: string;
    deleted: number;
    republished: number;
    errors: number;
    details: Array<{
        venueName: string;
        osmId: string;
        oldUrl: string;
        newUrl: string;
        newEventId?: string;
        error?: string;
    }>;
}

// ============================================================================
// Component
// ============================================================================

export default function ToolsTab() {
    const { authToken } = useNostrAuth();

    // Preview state
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Execute state
    const [executeLoading, setExecuteLoading] = useState(false);
    const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);

    // Preview handler
    const handlePreview = async () => {
        if (!authToken) return;

        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);
        setExecuteResult(null);

        try {
            const response = await fetch("/api/admin/nostr-bot/fix-verifications/preview", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const data = await response.json();

            if (!response.ok) {
                setPreviewError(data.error || "Failed to scan events");
                return;
            }

            setPreviewData(data);
            setShowPreviewModal(true);
        } catch (err) {
            setPreviewError(err instanceof Error ? err.message : "Failed to scan events");
        } finally {
            setPreviewLoading(false);
        }
    };

    // Execute handler
    const handleExecute = async () => {
        if (!authToken) return;

        setExecuteLoading(true);

        try {
            const response = await fetch("/api/admin/nostr-bot/fix-verifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setExecuteResult({
                    success: false,
                    message: data.error || "Failed to fix events",
                    deleted: 0,
                    republished: 0,
                    errors: 1,
                    details: [],
                });
                return;
            }

            setExecuteResult(data);
        } catch (err) {
            setExecuteResult({
                success: false,
                message: err instanceof Error ? err.message : "Failed to fix events",
                deleted: 0,
                republished: 0,
                errors: 1,
                details: [],
            });
        } finally {
            setExecuteLoading(false);
        }
    };

    const closeModal = () => {
        if (!executeLoading) {
            setShowPreviewModal(false);
            setPreviewData(null);
            setExecuteResult(null);
        }
    };

    function formatDate(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-surface rounded-xl border border-border-light p-4">
                <p className="text-text-light text-sm">
                    Tools for maintaining and fixing Nostr bot events.
                    All operations show a preview before execution.
                </p>
            </div>

            {/* Tools */}
            <div className="grid grid-cols-1 gap-6">
                <ToolCard
                    title="Fix Verification URLs"
                    description="Scan verification announcements on Nostr relays and fix events that have malformed URLs. Events with URLs like /places/node/12345 (instead of /places/some-slug or /places/12345) will be deleted and republished with the correct URL."
                    note={{
                        text: "Verification events were published with the raw OSM ID in the URL path (e.g. /places/node/11906886845), which produces 404 errors. The bot now correctly strips the type prefix and uses venue slugs when available.",
                        date: "February 27, 2026",
                    }}
                    icon={<LinkIcon className="w-6 h-6 text-accent" />}
                    variant="warning"
                >
                    {previewError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-4 h-4 text-red-400" />
                                <p className="text-red-400 text-sm">{previewError}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handlePreview}
                        color="primary"
                        size="sm"
                        disabled={previewLoading}
                        loading={previewLoading}
                        leftIcon={!previewLoading ? <SearchIcon className="w-4 h-4" /> : undefined}
                    >
                        {previewLoading ? "Scanning relays..." : "Scan Relay Events"}
                    </Button>
                </ToolCard>
            </div>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreviewModal}
                onClose={closeModal}
                title="Fix Verification URLs"
                maxWidth="max-w-4xl"
            >
                <div className="p-6 space-y-6">
                    {/* Success Result */}
                    {executeResult?.success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckmarkIcon className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-green-400 font-medium">{executeResult.message}</p>
                                    <p className="text-green-400/70 text-sm mt-1">
                                        Deleted: {executeResult.deleted} | Republished: {executeResult.republished}
                                        {executeResult.errors > 0 && ` | Errors: ${executeResult.errors}`}
                                    </p>
                                </div>
                            </div>

                            {/* Result details */}
                            {executeResult.details.length > 0 && (
                                <div className="mt-4 bg-surface-light rounded-lg border border-border-light max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-surface-light">
                                            <tr className="border-b border-border-light">
                                                <th className="px-3 py-2 text-left text-text-light font-medium">Venue</th>
                                                <th className="px-3 py-2 text-left text-text-light font-medium">New URL</th>
                                                <th className="px-3 py-2 text-left text-text-light font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light">
                                            {executeResult.details.map((d, idx) => (
                                                <tr key={idx} className="hover:bg-surface">
                                                    <td className="px-3 py-2 text-white text-xs">{d.venueName}</td>
                                                    <td className="px-3 py-2 text-accent text-xs truncate max-w-[200px]" title={d.newUrl}>
                                                        {d.newUrl.replace("https://mappingbitcoin.com", "")}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs">
                                                        {d.error ? (
                                                            <span className="text-red-400">{d.error}</span>
                                                        ) : (
                                                            <span className="text-green-400">Fixed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Result */}
                    {executeResult && !executeResult.success && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-5 h-5 text-red-400" />
                                <p className="text-red-400">{executeResult.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Content */}
                    {previewData && !executeResult && (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{previewData.totalBotPosts}</p>
                                    <p className="text-xs text-text-light">Bot Posts</p>
                                </div>
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{previewData.verificationPosts}</p>
                                    <p className="text-xs text-text-light">Verifications</p>
                                </div>
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{previewData.matchedToClaims}</p>
                                    <p className="text-xs text-text-light">Matched to DB</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${previewData.badUrlCount > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                                    <p className={`text-2xl font-bold ${previewData.badUrlCount > 0 ? "text-red-400" : "text-green-400"}`}>
                                        {previewData.badUrlCount}
                                    </p>
                                    <p className="text-xs text-text-light">Bad URLs</p>
                                </div>
                            </div>

                            {/* Unmatched warning */}
                            {previewData.unmatchedCount > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <WarningIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
                                        <p className="text-yellow-400 text-sm">
                                            {previewData.unmatchedCount} verification post{previewData.unmatchedCount !== 1 ? "s" : ""} on
                                            relays could not be matched to any database claim (missing nostrEventId). These will be skipped.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {previewData.badUrlCount === 0 ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                    <CheckmarkIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-green-400 font-medium">All verification URLs are correct</p>
                                    <p className="text-green-400/70 text-sm mt-1">
                                        No malformed URLs found in verification events.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Events table */}
                                    <div>
                                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4 text-red-400" />
                                            Events to fix ({previewData.badUrlCount})
                                            {previewData.hasMore && (
                                                <span className="text-text-light text-xs ml-2">(showing first 100)</span>
                                            )}
                                        </h4>
                                        <div className="bg-surface-light rounded-lg border border-border-light max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-surface-light">
                                                    <tr className="border-b border-border-light">
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Venue</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Method</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Old URL</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">New URL</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {previewData.events.map((event) => (
                                                        <tr key={event.eventId} className="hover:bg-surface">
                                                            <td className="px-3 py-2 text-white text-xs max-w-[150px] truncate" title={`${event.venueName} (${event.osmId})`}>
                                                                {event.venueName}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                                                    event.method === "EMAIL" ? "bg-blue-500/10 text-blue-400" :
                                                                    event.method === "DOMAIN" ? "bg-purple-500/10 text-purple-400" :
                                                                    "bg-amber-500/10 text-amber-400"
                                                                }`}>
                                                                    {event.method}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-red-400 text-xs font-mono truncate max-w-[180px]" title={event.oldUrl}>
                                                                {event.oldUrl.replace("https://mappingbitcoin.com", "")}
                                                            </td>
                                                            <td className="px-3 py-2 text-green-400 text-xs font-mono truncate max-w-[180px]" title={event.newUrl}>
                                                                {event.newUrl.replace("https://mappingbitcoin.com", "")}
                                                            </td>
                                                            <td className="px-3 py-2 text-text-light text-xs whitespace-nowrap">
                                                                {formatDate(event.createdAt)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        <h4 className="text-white font-medium mb-3">Actions to be performed</h4>
                                        <ul className="space-y-2">
                                            {previewData.actions.map((action, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-text-light">{action}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Warning */}
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <WarningIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
                                            <div>
                                                <p className="text-yellow-400 text-sm">
                                                    This will delete old events from relays (NIP-09) and publish new ones with corrected URLs.
                                                    Each event requires relay communication, so this may take a while.
                                                </p>
                                                {previewData.badUrlCount > 20 && (
                                                    <p className="text-yellow-400/70 text-xs mt-1">
                                                        Estimated time: ~{Math.ceil(previewData.badUrlCount * 1.5 / 60)} minutes for {previewData.badUrlCount} events.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-border-light">
                        <Button
                            onClick={closeModal}
                            variant="ghost"
                            color="neutral"
                            disabled={executeLoading}
                        >
                            {executeResult?.success ? "Close" : "Cancel"}
                        </Button>
                        {previewData && previewData.badUrlCount > 0 && !executeResult?.success && (
                            <Button
                                onClick={handleExecute}
                                color="primary"
                                disabled={executeLoading}
                                loading={executeLoading}
                            >
                                {executeLoading ? "Fixing events..." : "Confirm & Fix"}
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
