"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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

    const handleDelete = async (seeder: Seeder) => {
        if (!confirm(`Are you sure you want to delete seeder ${seeder.label || seeder.pubkey.slice(0, 16)}...?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/seeders/${seeder.pubkey}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete seeder");
            }

            fetchSeeders();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete seeder");
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
                                                onClick={() => handleDelete(seeder)}
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

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Pubkey (hex)
                        </label>
                        <input
                            type="text"
                            value={formData.pubkey}
                            onChange={(e) => setFormData({ ...formData, pubkey: e.target.value })}
                            disabled={!!editingSeeder}
                            placeholder="64-character hex pubkey"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Region
                        </label>
                        <input
                            type="text"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            placeholder="e.g., north-america, europe, asia"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Label (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="e.g., Bitcoin Beach, BTC Prague"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                        />
                    </div>

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
        </div>
    );
}
