"use client";

import { useState } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { TrashIcon, WarningIcon, CheckmarkIcon, SearchIcon, RefreshIcon, SettingsIcon } from "@/assets/icons/ui";
import ToolCard from "./ToolCard";
import SyncStateModal from "./SyncStateModal";
import {
    PreviewData,
    ExecuteResult,
    CategoryFixPreviewData,
    SyncStateData,
} from "./types";

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

    // Category fix state
    const [categoryPreviewLoading, setCategoryPreviewLoading] = useState(false);
    const [categoryPreviewData, setCategoryPreviewData] = useState<CategoryFixPreviewData | null>(null);
    const [categoryPreviewError, setCategoryPreviewError] = useState<string | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryExecuteLoading, setCategoryExecuteLoading] = useState(false);
    const [categoryExecuteResult, setCategoryExecuteResult] = useState<ExecuteResult | null>(null);

    // Sync state management
    const [syncStateLoading, setSyncStateLoading] = useState(false);
    const [syncStateData, setSyncStateData] = useState<SyncStateData | null>(null);
    const [syncStateError, setSyncStateError] = useState<string | null>(null);
    const [showSyncStateModal, setShowSyncStateModal] = useState(false);
    const [syncStateUpdating, setSyncStateUpdating] = useState(false);
    const [syncStateResult, setSyncStateResult] = useState<ExecuteResult | null>(null);
    const [editSequenceNumber, setEditSequenceNumber] = useState<string>("");

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

    // Category fix handlers
    const handleCategoryPreview = async () => {
        if (!authToken) return;

        setCategoryPreviewLoading(true);
        setCategoryPreviewError(null);
        setCategoryPreviewData(null);
        setCategoryExecuteResult(null);

        try {
            const response = await fetch("/api/admin/map-sync/fix-categories/preview", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const data = await response.json();

            if (!response.ok) {
                setCategoryPreviewError(data.error || "Failed to load preview");
                return;
            }

            setCategoryPreviewData(data);
            setShowCategoryModal(true);
        } catch (err) {
            setCategoryPreviewError(err instanceof Error ? err.message : "Failed to load preview");
        } finally {
            setCategoryPreviewLoading(false);
        }
    };

    const handleCategoryExecute = async () => {
        if (!authToken) return;

        setCategoryExecuteLoading(true);

        try {
            const response = await fetch("/api/admin/map-sync/fix-categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setCategoryExecuteResult({
                    success: false,
                    message: data.error || "Failed to fix categories",
                });
                return;
            }

            setCategoryExecuteResult({
                success: true,
                message: data.message || "Categories fixed successfully",
                fixedCount: data.fixedCount,
            });

            // Close modal after short delay to show success
            setTimeout(() => {
                setShowCategoryModal(false);
                setCategoryPreviewData(null);
            }, 2000);
        } catch (err) {
            setCategoryExecuteResult({
                success: false,
                message: err instanceof Error ? err.message : "Failed to fix categories",
            });
        } finally {
            setCategoryExecuteLoading(false);
        }
    };

    const closeCategoryModal = () => {
        if (!categoryExecuteLoading) {
            setShowCategoryModal(false);
            setCategoryPreviewData(null);
            setCategoryExecuteResult(null);
        }
    };

    // Sync state handlers
    const handleLoadSyncState = async () => {
        if (!authToken) return;

        setSyncStateLoading(true);
        setSyncStateError(null);
        setSyncStateData(null);
        setSyncStateResult(null);

        try {
            const response = await fetch("/api/admin/map-sync/sync-state", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const data = await response.json();

            if (!response.ok) {
                setSyncStateError(data.error || "Failed to load sync state");
                return;
            }

            setSyncStateData(data);
            // Pre-fill the edit field with the higher sequence number
            const localSeq = data.replicationState.local?.sequenceNumber || 0;
            const storageSeq = data.replicationState.storage?.sequenceNumber || 0;
            setEditSequenceNumber(String(Math.max(localSeq, storageSeq)));
            setShowSyncStateModal(true);
        } catch (err) {
            setSyncStateError(err instanceof Error ? err.message : "Failed to load sync state");
        } finally {
            setSyncStateLoading(false);
        }
    };

    const handleUpdateSequenceNumber = async () => {
        if (!authToken) return;

        const sequenceNumber = parseInt(editSequenceNumber, 10);
        if (isNaN(sequenceNumber) || sequenceNumber < 0) {
            setSyncStateResult({
                success: false,
                message: "Please enter a valid sequence number (positive integer)",
            });
            return;
        }

        setSyncStateUpdating(true);

        try {
            const response = await fetch("/api/admin/map-sync/sync-state", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    replicationState: { sequenceNumber },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSyncStateResult({
                    success: false,
                    message: data.error || "Failed to update sync state",
                });
                return;
            }

            setSyncStateResult({
                success: true,
                message: `Sequence number updated to #${sequenceNumber}`,
            });

            // Reload state after successful update
            setTimeout(() => {
                handleLoadSyncState();
            }, 1500);
        } catch (err) {
            setSyncStateResult({
                success: false,
                message: err instanceof Error ? err.message : "Failed to update sync state",
            });
        } finally {
            setSyncStateUpdating(false);
        }
    };

    const handleSyncFromStorage = async () => {
        if (!authToken || !syncStateData?.replicationState.storage) return;

        const storageSeq = syncStateData.replicationState.storage.sequenceNumber;
        setEditSequenceNumber(String(storageSeq));

        setSyncStateUpdating(true);

        try {
            const response = await fetch("/api/admin/map-sync/sync-state", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    replicationState: { sequenceNumber: storageSeq },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSyncStateResult({
                    success: false,
                    message: data.error || "Failed to sync from storage",
                });
                return;
            }

            setSyncStateResult({
                success: true,
                message: `Synced local state to storage sequence #${storageSeq}`,
            });

            // Reload state after successful update
            setTimeout(() => {
                handleLoadSyncState();
            }, 1500);
        } catch (err) {
            setSyncStateResult({
                success: false,
                message: err instanceof Error ? err.message : "Failed to sync from storage",
            });
        } finally {
            setSyncStateUpdating(false);
        }
    };

    const closeSyncStateModal = () => {
        if (!syncStateUpdating) {
            setShowSyncStateModal(false);
            setSyncStateData(null);
            setSyncStateResult(null);
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

                {/* Fix Categories Tool */}
                <ToolCard
                    title="Fix Venue Categories"
                    description="Re-enrich categories for venues created via MappingBitcoin.com that weren't properly mapped back to their category/subcategory when synced from OpenStreetMap. Uses the custom 'category' tag stored in OSM as a fallback."
                    note={{
                        text: "This tool was created to fix an issue where venues created via MappingBitcoin.com were not being properly mapped back to their category/subcategory when synced from OpenStreetMap. The enrichment process only used TAG_CATEGORY_MAP, but venues created through our platform have a custom 'category' tag that wasn't being utilized as a fallback.",
                        date: "February 1, 2026",
                    }}
                    icon={<CheckmarkIcon className="w-6 h-6 text-accent" />}
                    variant="warning"
                >
                    {categoryPreviewError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-4 h-4 text-red-400" />
                                <p className="text-red-400 text-sm">{categoryPreviewError}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleCategoryPreview}
                        color="primary"
                        size="sm"
                        disabled={categoryPreviewLoading}
                        loading={categoryPreviewLoading}
                        leftIcon={!categoryPreviewLoading ? <SearchIcon className="w-4 h-4" /> : undefined}
                    >
                        {categoryPreviewLoading ? "Analyzing..." : "Find Fixable Venues"}
                    </Button>
                </ToolCard>

                {/* Sync State Management Tool */}
                <ToolCard
                    title="Manage Sync State"
                    description="View and update the OSM replication state (sequence number) and sync data. Use this to recover from state resets after migrations or to manually adjust the sync position."
                    icon={<SettingsIcon className="w-6 h-6 text-accent" />}
                >
                    {syncStateError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-4 h-4 text-red-400" />
                                <p className="text-red-400 text-sm">{syncStateError}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleLoadSyncState}
                        color="primary"
                        size="sm"
                        disabled={syncStateLoading}
                        loading={syncStateLoading}
                        leftIcon={!syncStateLoading ? <RefreshIcon className="w-4 h-4" /> : undefined}
                    >
                        {syncStateLoading ? "Loading..." : "View Sync State"}
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

            {/* Category Fix Modal */}
            <Modal
                isOpen={showCategoryModal}
                onClose={closeCategoryModal}
                title="Fix Venue Categories"
                maxWidth="max-w-3xl"
            >
                <div className="p-6 space-y-6">
                    {/* Success Result */}
                    {categoryExecuteResult?.success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckmarkIcon className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-green-400 font-medium">{categoryExecuteResult.message}</p>
                                    {categoryExecuteResult.fixedCount !== undefined && (
                                        <p className="text-green-400/70 text-sm mt-1">
                                            {categoryExecuteResult.fixedCount} venue{categoryExecuteResult.fixedCount !== 1 ? "s" : ""} fixed
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Result */}
                    {categoryExecuteResult && !categoryExecuteResult.success && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <WarningIcon className="w-5 h-5 text-red-400" />
                                <p className="text-red-400">{categoryExecuteResult.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Content */}
                    {categoryPreviewData && !categoryExecuteResult?.success && (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface-light rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-white">{categoryPreviewData.totalVenues.toLocaleString()}</p>
                                    <p className="text-xs text-text-light">Total Venues</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${categoryPreviewData.fixableCount > 0 ? "bg-yellow-500/10" : "bg-green-500/10"}`}>
                                    <p className={`text-2xl font-bold ${categoryPreviewData.fixableCount > 0 ? "text-yellow-400" : "text-green-400"}`}>
                                        {categoryPreviewData.fixableCount}
                                    </p>
                                    <p className="text-xs text-text-light">Fixable</p>
                                </div>
                            </div>

                            {categoryPreviewData.fixableCount === 0 ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                    <CheckmarkIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <p className="text-green-400 font-medium">All categories are correct</p>
                                    <p className="text-green-400/70 text-sm mt-1">
                                        No venues need category fixes.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Venues to be fixed */}
                                    <div>
                                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                            <CheckmarkIcon className="w-4 h-4 text-yellow-400" />
                                            Venues to be fixed ({categoryPreviewData.fixableCount})
                                            {categoryPreviewData.hasMore && (
                                                <span className="text-text-light text-xs ml-2">(showing first 100)</span>
                                            )}
                                        </h4>
                                        <div className="bg-surface-light rounded-lg border border-border-light max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-surface-light">
                                                    <tr className="border-b border-border-light">
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">ID</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Name</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Location</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Current</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Fix To</th>
                                                        <th className="px-3 py-2 text-left text-text-light font-medium">Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {categoryPreviewData.fixableVenues.map((venue) => (
                                                        <tr key={venue.id} className="hover:bg-surface">
                                                            <td className="px-3 py-2 text-text-light font-mono text-xs">{venue.id}</td>
                                                            <td className="px-3 py-2 text-white max-w-[150px] truncate" title={venue.name}>{venue.name}</td>
                                                            <td className="px-3 py-2 text-text-light text-xs">{venue.city}, {venue.country}</td>
                                                            <td className="px-3 py-2 text-text-light text-xs">
                                                                {venue.currentCategory || "-"} / {venue.currentSubcategory || "-"}
                                                            </td>
                                                            <td className="px-3 py-2 text-accent text-xs">
                                                                {venue.tagCategory} / {venue.tagSubcategory || "-"}
                                                            </td>
                                                            <td className="px-3 py-2 text-yellow-400 text-xs max-w-[200px] truncate" title={venue.reason}>
                                                                {venue.reason}
                                                            </td>
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
                                            {categoryPreviewData.actions.map((action, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-text-light">{action}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Info */}
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <CheckmarkIcon className="w-4 h-4 text-blue-400 mt-0.5" />
                                            <p className="text-blue-400 text-sm">
                                                This operation will update venue categories to match the &apos;category&apos; tag stored in OSM when venues were created via MappingBitcoin.com.
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
                            onClick={closeCategoryModal}
                            variant="ghost"
                            color="neutral"
                            disabled={categoryExecuteLoading}
                        >
                            {categoryExecuteResult?.success ? "Close" : "Cancel"}
                        </Button>
                        {categoryPreviewData && categoryPreviewData.fixableCount > 0 && !categoryExecuteResult?.success && (
                            <Button
                                onClick={handleCategoryExecute}
                                color="primary"
                                disabled={categoryExecuteLoading}
                                loading={categoryExecuteLoading}
                            >
                                {categoryExecuteLoading ? "Fixing..." : "Confirm & Fix"}
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Sync State Modal */}
            <SyncStateModal
                isOpen={showSyncStateModal}
                onClose={closeSyncStateModal}
                onRefresh={handleLoadSyncState}
                syncStateData={syncStateData}
                syncStateResult={syncStateResult}
                syncStateUpdating={syncStateUpdating}
                editSequenceNumber={editSequenceNumber}
                onEditSequenceNumber={setEditSequenceNumber}
                onUpdateSequenceNumber={handleUpdateSequenceNumber}
                onSyncFromStorage={handleSyncFromStorage}
            />
        </div>
    );
}
