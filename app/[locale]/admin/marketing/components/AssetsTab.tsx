"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import AssetUploader from "./AssetUploader";
import TagInput from "./TagInput";
import type { MarketingAsset, SocialNetwork, PostType, ContentTopic } from "../types";
import { SOCIAL_NETWORKS, POST_TYPES, CONTENT_TOPICS, SOCIAL_NETWORK_LABELS, POST_TYPE_LABELS, CONTENT_TOPIC_LABELS } from "../types";
import { PhotoIcon, VideoIcon, FileIcon, DocumentIcon, CheckmarkIcon } from "@/assets/icons/ui";

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) {
        return <PhotoIcon className="w-8 h-8 text-blue-400" />;
    }
    if (mimeType.startsWith("video/")) {
        return <VideoIcon className="w-8 h-8 text-purple-400" />;
    }
    if (mimeType === "application/pdf") {
        return <FileIcon className="w-8 h-8 text-red-400" />;
    }
    return <DocumentIcon className="w-8 h-8 text-gray-400" />;
}

export default function AssetsTab() {
    const { authToken } = useNostrAuth();
    const [assets, setAssets] = useState<MarketingAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterNetwork, setFilterNetwork] = useState<SocialNetwork | "">("");
    const [filterType, setFilterType] = useState<PostType | "">("");
    const [filterTopic, setFilterTopic] = useState<ContentTopic | "">("");

    // Upload modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{
        filename: string;
        storageKey: string;
        mimeType: string;
        size: number;
    } | null>(null);
    const [assetFormData, setAssetFormData] = useState({
        socialNetworks: [] as SocialNetwork[],
        postTypes: [] as PostType[],
        topic: "" as ContentTopic | "",
        customTags: [] as string[],
        altText: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Edit modal
    const [editingAsset, setEditingAsset] = useState<MarketingAsset | null>(null);

    const fetchAssets = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = new URLSearchParams();
            if (filterNetwork) params.set("socialNetwork", filterNetwork);
            if (filterType) params.set("postType", filterType);
            if (filterTopic) params.set("topic", filterTopic);

            const response = await fetch(`/api/admin/marketing/assets?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch assets");
            }

            const data = await response.json();
            setAssets(data.assets || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assets");
        } finally {
            setLoading(false);
        }
    }, [authToken, filterNetwork, filterType, filterTopic]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const openUploadModal = () => {
        setUploadedFile(null);
        setAssetFormData({
            socialNetworks: [],
            postTypes: [],
            topic: "",
            customTags: [],
            altText: "",
        });
        setFormError(null);
        setIsUploadModalOpen(true);
    };

    const openEditModal = (asset: MarketingAsset) => {
        setEditingAsset(asset);
        setAssetFormData({
            socialNetworks: asset.socialNetworks,
            postTypes: asset.postTypes,
            topic: asset.topic || "",
            customTags: asset.customTags,
            altText: asset.altText || "",
        });
        setFormError(null);
    };

    const closeModal = () => {
        setIsUploadModalOpen(false);
        setUploadedFile(null);
        setEditingAsset(null);
        setFormError(null);
    };

    const handleUploadComplete = (data: { filename: string; storageKey: string; mimeType: string; size: number }) => {
        setUploadedFile(data);
    };

    const handleSaveAsset = async () => {
        if (!authToken) return;

        if (!uploadedFile && !editingAsset) {
            setFormError("Please upload a file first");
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            if (editingAsset) {
                // Update existing asset
                const response = await fetch(`/api/admin/marketing/assets/${editingAsset.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        socialNetworks: assetFormData.socialNetworks,
                        postTypes: assetFormData.postTypes,
                        topic: assetFormData.topic || null,
                        customTags: assetFormData.customTags,
                        altText: assetFormData.altText || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update asset");
                }
            } else if (uploadedFile) {
                // Create new asset
                const response = await fetch("/api/admin/marketing/assets", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        filename: uploadedFile.filename,
                        storageKey: uploadedFile.storageKey,
                        mimeType: uploadedFile.mimeType,
                        size: uploadedFile.size,
                        socialNetworks: assetFormData.socialNetworks,
                        postTypes: assetFormData.postTypes,
                        topic: assetFormData.topic || null,
                        customTags: assetFormData.customTags,
                        altText: assetFormData.altText || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create asset");
                }
            }

            closeModal();
            fetchAssets();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (asset: MarketingAsset) => {
        if (!confirm(`Are you sure you want to delete "${asset.filename}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/assets/${asset.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete asset");
            }

            fetchAssets();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete asset");
        }
    };

    const toggleArrayItem = <T extends string>(array: T[], item: T, setArray: (items: T[]) => void) => {
        if (array.includes(item)) {
            setArray(array.filter((i) => i !== item));
        } else {
            setArray([...array, item]);
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
            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterNetwork}
                        onChange={(e) => setFilterNetwork(e.target.value as SocialNetwork | "")}
                        className="px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">All Networks</option>
                        {SOCIAL_NETWORKS.map((network) => (
                            <option key={network} value={network}>{SOCIAL_NETWORK_LABELS[network]}</option>
                        ))}
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as PostType | "")}
                        className="px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">All Types</option>
                        {POST_TYPES.map((type) => (
                            <option key={type} value={type}>{POST_TYPE_LABELS[type]}</option>
                        ))}
                    </select>

                    <select
                        value={filterTopic}
                        onChange={(e) => setFilterTopic(e.target.value as ContentTopic | "")}
                        className="px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">All Topics</option>
                        {CONTENT_TOPICS.map((topic) => (
                            <option key={topic} value={topic}>{CONTENT_TOPIC_LABELS[topic]}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={openUploadModal}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                >
                    Upload Asset
                </button>
            </div>

            {/* Assets Grid */}
            {assets.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-light">
                    <p>No assets yet. Upload your first marketing asset.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                        <div
                            key={asset.id}
                            className="bg-surface rounded-xl border border-border-light overflow-hidden hover:border-primary/50 transition-colors"
                        >
                            {/* Preview */}
                            <div className="aspect-video bg-surface-light flex items-center justify-center">
                                {getFileIcon(asset.mimeType)}
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h4 className="text-white font-medium truncate">{asset.filename}</h4>
                                    <p className="text-sm text-text-light">{formatFileSize(asset.size)}</p>
                                </div>

                                {/* Tags */}
                                {(asset.socialNetworks.length > 0 || asset.postTypes.length > 0 || asset.topic) && (
                                    <div className="flex flex-wrap gap-1">
                                        {asset.socialNetworks.map((network) => (
                                            <span key={network} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                                {SOCIAL_NETWORK_LABELS[network]}
                                            </span>
                                        ))}
                                        {asset.postTypes.map((type) => (
                                            <span key={type} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                                                {POST_TYPE_LABELS[type]}
                                            </span>
                                        ))}
                                        {asset.topic && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                                {CONTENT_TOPIC_LABELS[asset.topic]}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => openEditModal(asset)}
                                        className="px-3 py-1 text-sm text-primary hover:text-primary-light transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(asset)}
                                        className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={closeModal}
                title="Upload Asset"
                maxWidth="max-w-2xl"
            >
                <div className="p-6 space-y-6">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    {!uploadedFile ? (
                        <AssetUploader
                            onUploadComplete={handleUploadComplete}
                            onError={(err) => setFormError(err)}
                        />
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CheckmarkIcon className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-green-400 font-medium">{uploadedFile.filename}</p>
                                    <p className="text-sm text-green-400/70">{formatFileSize(uploadedFile.size)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata form */}
                    {uploadedFile && (
                        <>
                            {/* Social Networks */}
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-2">Social Networks</label>
                                <div className="flex flex-wrap gap-2">
                                    {SOCIAL_NETWORKS.map((network) => (
                                        <button
                                            key={network}
                                            type="button"
                                            onClick={() => toggleArrayItem(assetFormData.socialNetworks, network, (items) => setAssetFormData({ ...assetFormData, socialNetworks: items }))}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                assetFormData.socialNetworks.includes(network)
                                                    ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                                                    : "bg-surface-light text-text-light border border-transparent hover:border-border-light"
                                            }`}
                                        >
                                            {SOCIAL_NETWORK_LABELS[network]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Post Types */}
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-2">Post Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {POST_TYPES.map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleArrayItem(assetFormData.postTypes, type, (items) => setAssetFormData({ ...assetFormData, postTypes: items }))}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                assetFormData.postTypes.includes(type)
                                                    ? "bg-purple-500/30 text-purple-400 border border-purple-500/50"
                                                    : "bg-surface-light text-text-light border border-transparent hover:border-border-light"
                                            }`}
                                        >
                                            {POST_TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic */}
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-2">Topic</label>
                                <select
                                    value={assetFormData.topic}
                                    onChange={(e) => setAssetFormData({ ...assetFormData, topic: e.target.value as ContentTopic | "" })}
                                    className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Select topic...</option>
                                    {CONTENT_TOPICS.map((topic) => (
                                        <option key={topic} value={topic}>{CONTENT_TOPIC_LABELS[topic]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Tags */}
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-2">Custom Tags</label>
                                <TagInput
                                    tags={assetFormData.customTags}
                                    onChange={(tags) => setAssetFormData({ ...assetFormData, customTags: tags })}
                                    placeholder="Add custom tags..."
                                />
                            </div>

                            {/* Alt Text */}
                            <div>
                                <label className="block text-sm font-medium text-text-light mb-2">Alt Text (optional)</label>
                                <input
                                    type="text"
                                    value={assetFormData.altText}
                                    onChange={(e) => setAssetFormData({ ...assetFormData, altText: e.target.value })}
                                    placeholder="Describe the image for accessibility..."
                                    className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-text-light hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAsset}
                            disabled={submitting || !uploadedFile}
                            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : "Save Asset"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingAsset}
                onClose={closeModal}
                title="Edit Asset"
                maxWidth="max-w-2xl"
            >
                <div className="p-6 space-y-6">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    {editingAsset && (
                        <div className="bg-surface-light rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                {getFileIcon(editingAsset.mimeType)}
                                <div>
                                    <p className="text-white font-medium">{editingAsset.filename}</p>
                                    <p className="text-sm text-text-light">{formatFileSize(editingAsset.size)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Networks */}
                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">Social Networks</label>
                        <div className="flex flex-wrap gap-2">
                            {SOCIAL_NETWORKS.map((network) => (
                                <button
                                    key={network}
                                    type="button"
                                    onClick={() => toggleArrayItem(assetFormData.socialNetworks, network, (items) => setAssetFormData({ ...assetFormData, socialNetworks: items }))}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        assetFormData.socialNetworks.includes(network)
                                            ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                                            : "bg-surface-light text-text-light border border-transparent hover:border-border-light"
                                    }`}
                                >
                                    {SOCIAL_NETWORK_LABELS[network]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Post Types */}
                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">Post Types</label>
                        <div className="flex flex-wrap gap-2">
                            {POST_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleArrayItem(assetFormData.postTypes, type, (items) => setAssetFormData({ ...assetFormData, postTypes: items }))}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        assetFormData.postTypes.includes(type)
                                            ? "bg-purple-500/30 text-purple-400 border border-purple-500/50"
                                            : "bg-surface-light text-text-light border border-transparent hover:border-border-light"
                                    }`}
                                >
                                    {POST_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">Topic</label>
                        <select
                            value={assetFormData.topic}
                            onChange={(e) => setAssetFormData({ ...assetFormData, topic: e.target.value as ContentTopic | "" })}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                        >
                            <option value="">Select topic...</option>
                            {CONTENT_TOPICS.map((topic) => (
                                <option key={topic} value={topic}>{CONTENT_TOPIC_LABELS[topic]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Tags */}
                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">Custom Tags</label>
                        <TagInput
                            tags={assetFormData.customTags}
                            onChange={(tags) => setAssetFormData({ ...assetFormData, customTags: tags })}
                            placeholder="Add custom tags..."
                        />
                    </div>

                    {/* Alt Text */}
                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">Alt Text (optional)</label>
                        <input
                            type="text"
                            value={assetFormData.altText}
                            onChange={(e) => setAssetFormData({ ...assetFormData, altText: e.target.value })}
                            placeholder="Describe the image for accessibility..."
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-text-light hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAsset}
                            disabled={submitting}
                            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
