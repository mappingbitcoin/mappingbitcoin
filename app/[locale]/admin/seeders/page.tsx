"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/Modal/ConfirmModal";
import AlertModal from "@/components/ui/Modal/AlertModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

interface Seeder {
    id: string;
    pubkey: string;
    region: string;
    label: string | null;
    addedBy: string | null;
    createdAt: string;
}

export default function SeedersPage() {
    const { authToken } = useNostrAuth();
    const [seeders, setSeeders] = useState<Seeder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeeder, setEditingSeeder] = useState<Seeder | null>(null);
    const [formData, setFormData] = useState({
        pubkey: "",
        region: "",
        label: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState<Seeder | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Alert modal state
    const [alertModal, setAlertModal] = useState<{ title: string; message: string; variant: "error" | "success" } | null>(null);

    const fetchSeeders = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/admin/seeders", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch seeders");
            }

            const data = await response.json();
            setSeeders(data.seeders || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load seeders");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchSeeders();
    }, [fetchSeeders]);

    const openCreateModal = () => {
        setEditingSeeder(null);
        setFormData({ pubkey: "", region: "", label: "" });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (seeder: Seeder) => {
        setEditingSeeder(seeder);
        setFormData({
            pubkey: seeder.pubkey,
            region: seeder.region,
            label: seeder.label || "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSeeder(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            if (editingSeeder) {
                // Update existing seeder
                const response = await fetch(`/api/admin/seeders/${editingSeeder.pubkey}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        region: formData.region,
                        label: formData.label || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update seeder");
                }
            } else {
                // Create new seeder
                const response = await fetch("/api/admin/seeders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        pubkey: formData.pubkey,
                        region: formData.region,
                        label: formData.label || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create seeder");
                }
            }

            closeModal();
            fetchSeeders();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !authToken) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/admin/seeders/${deleteTarget.pubkey}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete seeder");
            }

            setDeleteTarget(null);
            fetchSeeders();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete seeder");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Community Seeders</h1>
                    <p className="text-text-light mt-1">
                        Manage trusted community members who anchor the trust graph
                    </p>
                </div>
                <Button onClick={openCreateModal} color="primary">
                    Add Seeder
                </Button>
            </div>

            {/* Seeders Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {seeders.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        <p>No seeders yet. Add your first community seeder to start building the trust graph.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Label</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Pubkey</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Region</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Added</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {seeders.map((seeder) => (
                                    <tr key={seeder.id} className="hover:bg-surface-light/50">
                                        <td className="px-4 py-3 text-white">
                                            {seeder.label || <span className="text-text-light italic">No label</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-sm text-text-light bg-surface-light px-2 py-1 rounded">
                                                {seeder.pubkey.slice(0, 8)}...{seeder.pubkey.slice(-8)}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-white">{seeder.region}</td>
                                        <td className="px-4 py-3 text-text-light text-sm">
                                            {new Date(seeder.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-1">
                                            <Button
                                                onClick={() => openEditModal(seeder)}
                                                variant="ghost"
                                                color="primary"
                                                size="xs"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => setDeleteTarget(seeder)}
                                                variant="ghost"
                                                color="danger"
                                                size="xs"
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingSeeder ? "Edit Seeder" : "Add Seeder"}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    <FormField label="Pubkey (hex)" required>
                        <Input
                            type="text"
                            value={formData.pubkey}
                            onChange={(e) => setFormData({ ...formData, pubkey: e.target.value })}
                            disabled={!!editingSeeder}
                            placeholder="64-character hex pubkey"
                            required
                        />
                    </FormField>

                    <FormField label="Region" required>
                        <Input
                            type="text"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            placeholder="e.g., north-america, europe, asia"
                            required
                        />
                    </FormField>

                    <FormField label="Label (optional)">
                        <Input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="e.g., Bitcoin Beach, BTC Prague"
                        />
                    </FormField>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            loading={submitting}
                            color="primary"
                        >
                            {submitting ? "Saving..." : editingSeeder ? "Update" : "Add Seeder"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => {
                    setDeleteTarget(null);
                    setDeleteError(null);
                }}
                onConfirm={handleDelete}
                title="Delete Seeder"
                description={`Are you sure you want to delete this community seeder? This will remove them from the trust graph.`}
                preview={
                    deleteTarget ? (
                        <div>
                            <p className="text-white text-sm font-medium">
                                {deleteTarget.label || "Unnamed Seeder"}
                            </p>
                            <code className="text-xs text-text-light">
                                {deleteTarget.pubkey.slice(0, 16)}...
                            </code>
                            <p className="text-xs text-text-light mt-1">
                                Region: {deleteTarget.region}
                            </p>
                        </div>
                    ) : undefined
                }
                confirmText="Delete Seeder"
                loading={deleting}
                error={deleteError}
                variant="danger"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={!!alertModal}
                onClose={() => setAlertModal(null)}
                title={alertModal?.title || ""}
                message={alertModal?.message || ""}
                variant={alertModal?.variant || "error"}
            />
        </div>
    );
}
