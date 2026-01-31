"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { CopyIcon, RefreshIcon, CheckmarkIcon, UploadIcon, CloseIcon } from "@/assets/icons/ui";

interface Profile {
    name?: string;
    display_name?: string;
    about?: string;
    picture?: string;
    banner?: string;
    website?: string;
    nip05?: string;
    lud16?: string;
}

interface BotData {
    pubkey: string;
    npub: string;
    profile: Profile;
    relays: string[];
}

export default function ProfileTab() {
    const { authToken } = useNostrAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [botData, setBotData] = useState<BotData | null>(null);
    const [form, setForm] = useState<Profile>({});
    const [error, setError] = useState<string | null>(null);

    // Upload states
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const pictureInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/nostr-bot/profile", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch profile");
            }
            const data = await res.json();
            setBotData(data);
            setForm(data.profile || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async () => {
        if (!authToken) return;

        setSaving(true);
        try {
            const res = await fetch("/api/admin/nostr-bot/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            if (data.relays.success > 0) {
                toast.success(`Profile updated! Published to ${data.relays.success}/${data.relays.success + data.relays.failed} relays`);
            } else {
                toast.error(`Failed to publish to any relay. Check console for details.`);
                console.error("Relay details:", data.relays.details);
            }
            fetchProfile();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (file: File, type: "picture" | "banner") => {
        if (!authToken) return;

        const setUploading = type === "picture" ? setUploadingPicture : setUploadingBanner;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/nostr-bot/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload");
            }

            const data = await res.json();
            setForm((prev) => ({ ...prev, [type]: data.url }));
            toast.success(`${type === "picture" ? "Picture" : "Banner"} uploaded!`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to upload");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "picture" | "banner") => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file, type);
        }
        // Reset input
        e.target.value = "";
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                    onClick={fetchProfile}
                    className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bot Identity */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Bot Identity</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="text-xs text-text-light uppercase tracking-wide">Public Key (hex)</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-surface-light rounded text-sm text-white font-mono truncate">
                                {botData?.pubkey}
                            </code>
                            <button
                                onClick={() => copyToClipboard(botData?.pubkey || "", "Pubkey")}
                                className="p-2 hover:bg-surface-light rounded transition-colors"
                            >
                                <CopyIcon className="w-4 h-4 text-text-light" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-text-light uppercase tracking-wide">npub</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-surface-light rounded text-sm text-white font-mono truncate">
                                {botData?.npub}
                            </code>
                            <button
                                onClick={() => copyToClipboard(botData?.npub || "", "npub")}
                                className="p-2 hover:bg-surface-light rounded transition-colors"
                            >
                                <CopyIcon className="w-4 h-4 text-text-light" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Images */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Profile Images</h2>

                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Profile Picture</label>
                        <div className="flex items-start gap-4">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-light border border-border-light flex-shrink-0">
                                {form.picture ? (
                                    <Image
                                        src={form.picture}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-light">
                                        <UploadIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={pictureInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={(e) => handleFileChange(e, "picture")}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => pictureInputRef.current?.click()}
                                    disabled={uploadingPicture}
                                    className="w-full px-3 py-2 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                                >
                                    {uploadingPicture ? "Uploading..." : "Upload Picture"}
                                </button>
                                <input
                                    type="url"
                                    value={form.picture || ""}
                                    onChange={(e) => setForm({ ...form, picture: e.target.value })}
                                    placeholder="Or paste URL..."
                                    className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white text-sm placeholder-text-light/50 focus:outline-none focus:border-accent"
                                />
                                {form.picture && (
                                    <button
                                        onClick={() => setForm({ ...form, picture: "" })}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Remove picture
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Banner</label>
                        <div className="space-y-2">
                            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-surface-light border border-border-light">
                                {form.banner ? (
                                    <Image
                                        src={form.banner}
                                        alt="Banner"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-light">
                                        <UploadIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={(e) => handleFileChange(e, "banner")}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={uploadingBanner}
                                    className="px-3 py-2 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                                >
                                    {uploadingBanner ? "Uploading..." : "Upload Banner"}
                                </button>
                                <input
                                    type="url"
                                    value={form.banner || ""}
                                    onChange={(e) => setForm({ ...form, banner: e.target.value })}
                                    placeholder="Or paste URL..."
                                    className="flex-1 px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white text-sm placeholder-text-light/50 focus:outline-none focus:border-accent"
                                />
                            </div>
                            {form.banner && (
                                <button
                                    onClick={() => setForm({ ...form, banner: "" })}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Remove banner
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-text-light mt-4">
                    Images are uploaded to public Blossom servers (blossom.primal.net, nostr.build). Max 5MB.
                </p>
            </div>

            {/* Profile Form */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Profile Details (kind 0)</h2>
                    <button
                        onClick={fetchProfile}
                        className="p-2 hover:bg-surface-light rounded transition-colors"
                        title="Refresh"
                    >
                        <RefreshIcon className="w-4 h-4 text-text-light" />
                    </button>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm text-text-light mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name || ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="mappingbitcoin"
                                className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-light mb-1">Display Name</label>
                            <input
                                type="text"
                                value={form.display_name || ""}
                                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                                placeholder="Mapping Bitcoin"
                                className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-text-light mb-1">About</label>
                        <textarea
                            value={form.about || ""}
                            onChange={(e) => setForm({ ...form, about: e.target.value })}
                            placeholder="Description of the bot..."
                            rows={3}
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent resize-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm text-text-light mb-1">Website</label>
                            <input
                                type="url"
                                value={form.website || ""}
                                onChange={(e) => setForm({ ...form, website: e.target.value })}
                                placeholder="https://mappingbitcoin.com"
                                className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-light mb-1">NIP-05</label>
                            <input
                                type="text"
                                value={form.nip05 || ""}
                                onChange={(e) => setForm({ ...form, nip05: e.target.value })}
                                placeholder="bot@mappingbitcoin.com"
                                className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-text-light mb-1">Lightning Address (lud16)</label>
                        <input
                            type="text"
                            value={form.lud16 || ""}
                            onChange={(e) => setForm({ ...form, lud16: e.target.value })}
                            placeholder="bot@mappingbitcoin.com"
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckmarkIcon className="w-4 h-4" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Connected Relays */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Publish Relays</h2>
                <div className="space-y-2">
                    {botData?.relays.map((relay) => (
                        <div key={relay} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <code className="text-text-light">{relay}</code>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
