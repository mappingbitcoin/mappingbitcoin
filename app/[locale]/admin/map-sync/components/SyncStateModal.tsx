"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { WarningIcon, CheckmarkIcon, RefreshIcon } from "@/assets/icons/ui";
import { SyncStateData, ExecuteResult } from "./types";

interface SyncStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    syncStateData: SyncStateData | null;
    syncStateResult: ExecuteResult | null;
    syncStateUpdating: boolean;
    editSequenceNumber: string;
    onEditSequenceNumber: (value: string) => void;
    onUpdateSequenceNumber: () => void;
    onSyncFromStorage: () => void;
}

export default function SyncStateModal({
    isOpen,
    onClose,
    onRefresh,
    syncStateData,
    syncStateResult,
    syncStateUpdating,
    editSequenceNumber,
    onEditSequenceNumber,
    onUpdateSequenceNumber,
    onSyncFromStorage,
}: SyncStateModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sync State Management"
            maxWidth="max-w-2xl"
        >
            <div className="p-6 space-y-6">
                {/* Success/Error Result */}
                {syncStateResult && (
                    <div className={`${syncStateResult.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"} border rounded-lg p-4`}>
                        <div className="flex items-center gap-2">
                            {syncStateResult.success ? (
                                <CheckmarkIcon className="w-5 h-5 text-green-400" />
                            ) : (
                                <WarningIcon className="w-5 h-5 text-red-400" />
                            )}
                            <p className={syncStateResult.success ? "text-green-400" : "text-red-400"}>
                                {syncStateResult.message}
                            </p>
                        </div>
                    </div>
                )}

                {syncStateData && (
                    <>
                        {/* Replication State */}
                        <div>
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <RefreshIcon className="w-4 h-4 text-accent" />
                                OSM Replication State
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface-light rounded-lg p-4">
                                    <p className="text-xs text-text-light uppercase tracking-wide mb-2">Local</p>
                                    {syncStateData.replicationState.local ? (
                                        <>
                                            <p className="text-2xl font-bold text-white">
                                                #{syncStateData.replicationState.local.sequenceNumber.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-text-light mt-1">
                                                {new Date(syncStateData.replicationState.local.timestamp).toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-text-light">Not found</p>
                                    )}
                                </div>
                                <div className="bg-surface-light rounded-lg p-4">
                                    <p className="text-xs text-text-light uppercase tracking-wide mb-2">Storage (Hetzner)</p>
                                    {syncStateData.replicationState.storage ? (
                                        <>
                                            <p className="text-2xl font-bold text-white">
                                                #{syncStateData.replicationState.storage.sequenceNumber.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-text-light mt-1">
                                                {new Date(syncStateData.replicationState.storage.timestamp).toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-text-light">Not found</p>
                                    )}
                                </div>
                            </div>

                            {/* Sync status indicator */}
                            {syncStateData.replicationState.local && syncStateData.replicationState.storage && (
                                <div className={`mt-3 p-3 rounded-lg ${
                                    syncStateData.replicationState.local.sequenceNumber === syncStateData.replicationState.storage.sequenceNumber
                                        ? "bg-green-500/10 border border-green-500/20"
                                        : "bg-yellow-500/10 border border-yellow-500/20"
                                }`}>
                                    {syncStateData.replicationState.local.sequenceNumber === syncStateData.replicationState.storage.sequenceNumber ? (
                                        <p className="text-green-400 text-sm flex items-center gap-2">
                                            <CheckmarkIcon className="w-4 h-4" />
                                            Local and storage are in sync
                                        </p>
                                    ) : (
                                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                                            <WarningIcon className="w-4 h-4" />
                                            Local and storage are out of sync (diff: {Math.abs(
                                                syncStateData.replicationState.local.sequenceNumber -
                                                syncStateData.replicationState.storage.sequenceNumber
                                            ).toLocaleString()})
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Update Sequence Number */}
                        <div className="pt-4 border-t border-border-light">
                            <h4 className="text-white font-medium mb-3">Update Sequence Number</h4>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={editSequenceNumber}
                                    onChange={(e) => onEditSequenceNumber(e.target.value)}
                                    className="flex-1 bg-surface-light border border-border-light rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                    placeholder="Enter sequence number"
                                    disabled={syncStateUpdating}
                                />
                                <Button
                                    onClick={onUpdateSequenceNumber}
                                    color="primary"
                                    disabled={syncStateUpdating || !editSequenceNumber}
                                    loading={syncStateUpdating}
                                >
                                    Update
                                </Button>
                            </div>
                            <p className="text-xs text-text-light mt-2">
                                This will update both local and storage state files.
                            </p>
                        </div>

                        {/* Quick Actions */}
                        {syncStateData.replicationState.storage &&
                         syncStateData.replicationState.local &&
                         syncStateData.replicationState.storage.sequenceNumber !== syncStateData.replicationState.local.sequenceNumber && (
                            <div className="pt-4 border-t border-border-light">
                                <h4 className="text-white font-medium mb-3">Quick Actions</h4>
                                <Button
                                    onClick={onSyncFromStorage}
                                    variant="soft"
                                    color="accent"
                                    size="sm"
                                    disabled={syncStateUpdating}
                                    loading={syncStateUpdating}
                                >
                                    Use Storage Sequence (#{syncStateData.replicationState.storage.sequenceNumber.toLocaleString()})
                                </Button>
                            </div>
                        )}

                        {/* Sync Data Preview */}
                        {syncStateData.syncData.local && (
                            <div className="pt-4 border-t border-border-light">
                                <h4 className="text-white font-medium mb-3">Last Overpass Sync</h4>
                                <div className="bg-surface-light rounded-lg p-4">
                                    <p className="text-sm text-text-light">
                                        {syncStateData.syncData.local.lastSync
                                            ? new Date(syncStateData.syncData.local.lastSync).toLocaleString()
                                            : "Never"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2 border-t border-border-light">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        color="neutral"
                        disabled={syncStateUpdating}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={onRefresh}
                        variant="soft"
                        color="accent"
                        disabled={syncStateUpdating}
                        leftIcon={<RefreshIcon className="w-4 h-4" />}
                    >
                        Refresh
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
