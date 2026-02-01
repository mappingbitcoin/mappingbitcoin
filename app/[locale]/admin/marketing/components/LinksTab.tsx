"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/Modal/ConfirmModal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import FormField from "@/components/ui/FormField";
import type { MarketingLink } from "../types";

export default function LinksTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [links, setLinks] = useState<MarketingLink[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<MarketingLink | null>(null);
    const [formData, setFormData] = useState({ title: "", url: "", description: "", category: "" });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState<MarketingLink | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchLinks = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.set("category", selectedCategory);

            const response = await fetch(`/api/admin/marketing/links?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) throw new Error("Failed to fetch links");

            const data = await response.json();
            setLinks(data.links || []);
            setCategories(data.categories || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load links");
        } finally {
            setLoading(false);
        }
    }, [authToken, selectedCategory]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const openCreateModal = () => {
        setEditingLink(null);
        setFormData({ title: "", url: "", description: "", category: "" });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (link: MarketingLink) => {
        setEditingLink(link);
        setFormData({
            title: link.title,
            url: link.url,
            description: link.description || "",
            category: link.category,
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLink(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const url = editingLink
                ? `/api/admin/marketing/links/${editingLink.id}`
                : "/api/admin/marketing/links";

            const response = await fetch(url, {
                method: editingLink ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: formData.title,
                    url: formData.url,
                    description: formData.description || null,
                    category: formData.category,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Operation failed");
            }

            closeModal();
            fetchLinks();
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
            const response = await fetch(`/api/admin/marketing/links/${deleteTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            setDeleteTarget(null);
            fetchLinks();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : t("errors.failedToDelete"));
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size="sm"
                    fullWidth={false}
                    placeholder={t("links.allCategories")}
                    options={categories.map((cat) => ({ value: cat, label: cat }))}
                />
                <Button onClick={openCreateModal} size="sm">
                    {t("links.addButton")}
                </Button>
            </div>

            {/* Links Table */}
            <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
                {links.length === 0 ? (
                    <div className="p-6 text-center text-text-light text-sm">
                        {t("links.emptyMessage")}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-surface-light text-left">
                            <tr>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.title")}</th>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.url")}</th>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.category")}</th>
                                <th className="px-3 py-2 font-medium text-text-light text-right">{t("common.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {links.map((link) => (
                                <tr key={link.id} className="hover:bg-surface-light/50">
                                    <td className="px-3 py-2">
                                        <span className="text-white font-medium">{link.title}</span>
                                        {link.description && (
                                            <p className="text-xs text-text-light truncate max-w-xs">{link.description}</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:text-accent-light text-xs truncate max-w-[200px] block"
                                        >
                                            {link.url}
                                        </a>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="px-2 py-0.5 bg-surface-light rounded text-xs text-text-light">
                                            {link.category}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right space-x-1">
                                        <Button
                                            onClick={() => openEditModal(link)}
                                            variant="ghost"
                                            color="accent"
                                            size="xs"
                                        >
                                            {t("common.edit")}
                                        </Button>
                                        <Button
                                            onClick={() => setDeleteTarget(link)}
                                            variant="ghost"
                                            color="danger"
                                            size="xs"
                                        >
                                            {t("common.delete")}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingLink ? t("links.editTitle") : t("links.addTitle")} maxWidth="max-w-md">
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400 text-xs">
                            {formError}
                        </div>
                    )}

                    <FormField label={t("links.fields.title")} labelSize="xs" required>
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t("links.placeholders.title")}
                            size="sm"
                            required
                        />
                    </FormField>

                    <FormField label={t("links.fields.url")} labelSize="xs" required>
                        <Input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder={t("links.placeholders.url")}
                            size="sm"
                            required
                        />
                    </FormField>

                    <FormField label={t("links.fields.description")} labelSize="xs">
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("links.placeholders.description")}
                            rows={2}
                            size="sm"
                        />
                    </FormField>

                    <FormField label={t("links.fields.category")} labelSize="xs" required>
                        <Input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder={t("links.placeholders.category")}
                            list="category-suggestions"
                            size="sm"
                            required
                        />
                        <datalist id="category-suggestions">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </FormField>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            onClick={closeModal}
                            variant="ghost"
                            color="neutral"
                            size="sm"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            loading={submitting}
                            size="sm"
                        >
                            {submitting ? t("common.saving") : editingLink ? t("common.update") : t("common.add")}
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
                title={t("links.deleteTitle")}
                description={t("confirm.deleteLink", { name: deleteTarget?.title || "" })}
                preview={
                    deleteTarget ? (
                        <div>
                            <p className="text-white text-sm font-medium">{deleteTarget.title}</p>
                            <p className="text-xs text-accent truncate">{deleteTarget.url}</p>
                        </div>
                    ) : undefined
                }
                confirmText={t("common.delete")}
                loading={deleting}
                error={deleteError}
                variant="danger"
            />
        </div>
    );
}
