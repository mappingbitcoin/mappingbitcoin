"use client";

import { useState } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { TrashIcon, WarningIcon, CheckmarkIcon, SearchIcon } from "@/assets/icons/ui";

interface OrphanedVenue {
    id: number;
    name: string;
    city: string;
    country: string;
    category: string;
}

interface PreviewData {
    enrichedCount: number;
    sourceCount: number;
    orphanedCount: number;
    orphanedVenues: OrphanedVenue[];
    actions: string[];
}

interface ExecuteResult {
    success: boolean;
    message: string;
    removedCount?: number;
}

function ToolCard({
    title,
    description,
    note,
    icon,
    children,
    variant = "default",
}: {
    title: string;
    description: string;
    note?: { text: string; date: string };
    icon: React.ReactNode;
    children: React.ReactNode;
    variant?: "default" | "warning";
}) {
    const variantClasses = {
        default: "border-border-light",
        warning: "border-yellow-500/30",
    };

    return (
        <div className={`bg-surface rounded-xl border ${variantClasses[variant]} p-6`}>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-text-light text-sm mb-4">{description}</p>

                    {note && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                            <p className="text-yellow-400 text-xs">
                                <span className="font-medium">Note:</span> {note.text}
                            </p>
                            <p className="text-yellow-400/70 text-xs mt-1">
                                Issue discovered: {note.date}
                            </p>
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}

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

    const handlePreview = async () => {
        if (!authToken) return;

        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);
        setExecuteResult(null);

        try {
            const response = await fetch("/api/admin/map-sync/cleanup-orphaned/preview", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const data = await response.json();

            if (!response.ok) {
                setPreviewError(data.error || "Failed to load preview");
                return;
            }

            setPreviewData(data);
            setShowPreviewModal(true);
        } catch (err) {
            setPreviewError(err instanceof Error ? err.message : "Failed to load preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!authToken) return;

        setExecuteLoading(true);

        try {
            const response = await fetch("/api/admin/map-sync/cleanup-orphaned", {
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
                    message: data.error || "Failed to execute cleanup",
                });
                return;
            }

            setExecuteResult({
                success: true,
                message: data.message || "Cleanup completed successfully",
                removedCount: data.removedCount,
            });

            // Close modal after short delay to show success
            setTimeout(() => {
                setShowPreviewModal(false);
                setPreviewData(null);
            }, 2000);
        } catch (err) {
            setExecuteResult({
                success: false,
                message: err instanceof Error ? err.message : "Failed to execute cleanup",
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

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-surface rounded-xl border border-border-light p-4">
                <p className="text-text-light text-sm">
                    These tools help maintain data consistency between OSM source data and enriched venue data.
                    All operations show a preview before execution.
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 gap-6">
                <ToolCard
                    title="Sync Orphaned Venues"
                    description="Remove venues from EnrichedVenues.json that no longer exist in BitcoinVenues.json. This cleans up venues that were deleted from OpenStreetMap but weren't properly removed from the enriched data."
                    note={{
                        text: "This tool was created to fix a bug where EnrichedVenues.json was not syncing deletions from BitcoinVenues.json, causing deleted OSM points to persist on the map.",
                        date: "February 1, 2026",
                    }}
                    icon={<TrashIcon className="w-6 h-6 text-accent" />}
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
                        {previewLoading ? "Analyzing..." : "Analyze Differences"}
                    </Button>
                </ToolCard>
            </div>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreviewModal}
                onClose={closeModal}
                title="Cleanup Preview"
                maxWidth="max-w-2xl"
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
                                    {executeResult.removedCount !== undefined && (
                                        <p className="text-green-400/70 text-sm mt-1">
                                            {executeResult.removedCount} venue{executeResult.removedCount !== 1 ? "s" : ""} removed
                                        </p>
                                    )}
                                </div>
                            </div>
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
                    {previewData && !executeResult?.success && (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{previewData.enrichedCount.toLocaleString()}</p>
                                    <p className="text-xs text-text-light">Enriched Venues</p>
                                </div>
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{previewData.sourceCount.toLocaleString()}</p>
                                    <p className="text-xs text-text-light">Source Venues</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${previewData.orphanedCount > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                                    <p className={`text-2xl font-bold ${previewData.orphanedCount > 0 ? "text-red-400" : "text-green-400"}`}>
                                        {previewData.orphanedCount}
                                    </p>
                                    <p className="text-xs text-text-light">Orphaned</p>
                                </div>
                            </div>

                            {previewData.orphanedCount === 0 ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                    <CheckmarkIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-green-400 font-medium">Data is in sync</p>
                                    <p className="text-green-400/70 text-sm mt-1">
                                        No orphaned venues found. Nothing to clean up.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Venues to be removed */}
                                    <div>
                                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                            <TrashIcon className="w-4 h-4 text-red-400" />
                                            Venues to be removed ({previewData.orphanedCount})
                                        </h4>
                                        <div className="bg-surface-light rounded-lg border border-border-light max-h-48 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-surface-light">
                                                    <tr className="border-b border-border-light">
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">ID</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Name</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Location</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Category</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {previewData.orphanedVenues.map((venue) => (
                                                        <tr key={venue.id} className="hover:bg-surface">
                                                            <td className="px-3 py-2 text-text-light font-mono text-xs">{venue.id}</td>
                                                            <td className="px-3 py-2 text-white">{venue.name}</td>
                                                            <td className="px-3 py-2 text-text-light">{venue.city}, {venue.country}</td>
                                                            <td className="px-3 py-2 text-text-light">{venue.category}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Actions that will be taken */}
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
                                            <p className="text-yellow-400 text-sm">
                                                This operation cannot be undone. Make sure you have reviewed the venues to be removed.
                                            </p>
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
                        {previewData && previewData.orphanedCount > 0 && !executeResult?.success && (
                            <Button
                                onClick={handleExecute}
                                color="danger"
                                disabled={executeLoading}
                                loading={executeLoading}
                            >
                                {executeLoading ? "Executing..." : "Confirm & Execute"}
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
