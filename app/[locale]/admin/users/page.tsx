"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import ToggleButton from "@/components/ui/ToggleButton";
import { SearchIcon, CloseIcon, PlusIcon, UsersIcon, BanIcon } from "@/assets/icons/ui";

interface User {
    id: string;
    pubkey: string;
    name: string | null;
    displayName: string | null;
    picture: string | null;
    nip05: string | null;
    createdAt: string;
    bannedAt: string | null;
    bannedReason: string | null;
    bannedBy: string | null;
    reviewCount: number;
    claimCount: number;
}

interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: {
        totalUsers: number;
        bannedUsers: number;
        activeUsers: number;
    };
}

type FilterType = "all" | "banned" | "active";

export default function UsersPage() {
    const { authToken } = useNostrAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ totalUsers: 0, bannedUsers: 0, activeUsers: 0 });

    // Ban modal state
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [banTarget, setBanTarget] = useState<User | null>(null);
    const [banReason, setBanReason] = useState("");
    const [banning, setBanning] = useState(false);
    const [banError, setBanError] = useState<string | null>(null);

    // Add ban modal state (manual)
    const [addBanModalOpen, setAddBanModalOpen] = useState(false);
    const [addBanPubkey, setAddBanPubkey] = useState("");
    const [addBanReason, setAddBanReason] = useState("");
    const [addingBan, setAddingBan] = useState(false);
    const [addBanError, setAddBanError] = useState<string | null>(null);

    // Bulk ban modal state
    const [bulkBanModalOpen, setBulkBanModalOpen] = useState(false);
    const [bulkBanList, setBulkBanList] = useState("");
    const [bulkBanReason, setBulkBanReason] = useState("");
    const [bulkBanning, setBulkBanning] = useState(false);
    const [bulkBanError, setBulkBanError] = useState<string | null>(null);
    const [bulkBanResult, setBulkBanResult] = useState<string | null>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                filter,
            });
            if (debouncedQuery) {
                params.set("q", debouncedQuery);
            }

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data: UsersResponse = await response.json();
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setStats(data.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [authToken, page, debouncedQuery, filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Ban modal functions
    const openBanModal = (user: User) => {
        setBanTarget(user);
        setBanReason("");
        setBanError(null);
        setBanModalOpen(true);
    };

    const closeBanModal = () => {
        setBanModalOpen(false);
        setBanTarget(null);
        setBanReason("");
        setBanError(null);
    };

    const handleBan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!banTarget || !authToken) return;

        setBanning(true);
        setBanError(null);

        try {
            const response = await fetch(`/api/admin/users/${banTarget.pubkey}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    action: "ban",
                    reason: banReason || "Banned by admin",
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to ban user");
            }

            closeBanModal();
            fetchUsers();
        } catch (err) {
            setBanError(err instanceof Error ? err.message : "Failed to ban");
        } finally {
            setBanning(false);
        }
    };

    const handleUnban = async (user: User) => {
        if (!authToken) return;
        if (!confirm(`Are you sure you want to unban ${user.name || user.pubkey.slice(0, 16)}...?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${user.pubkey}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ action: "unban" }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to unban user");
            }

            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to unban user");
        }
    };

    // Add ban modal functions
    const openAddBanModal = () => {
        setAddBanPubkey("");
        setAddBanReason("");
        setAddBanError(null);
        setAddBanModalOpen(true);
    };

    const closeAddBanModal = () => {
        setAddBanModalOpen(false);
        setAddBanPubkey("");
        setAddBanReason("");
        setAddBanError(null);
    };

    const handleAddBan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authToken || !addBanPubkey.trim()) return;

        setAddingBan(true);
        setAddBanError(null);

        try {
            const response = await fetch("/api/admin/users/bulk-ban", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    pubkeys: [addBanPubkey.trim()],
                    reason: addBanReason || "Banned by admin",
                    action: "ban",
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to ban user");
            }

            closeAddBanModal();
            fetchUsers();
        } catch (err) {
            setAddBanError(err instanceof Error ? err.message : "Failed to ban");
        } finally {
            setAddingBan(false);
        }
    };

    // Bulk ban modal functions
    const openBulkBanModal = () => {
        setBulkBanList("");
        setBulkBanReason("");
        setBulkBanError(null);
        setBulkBanResult(null);
        setBulkBanModalOpen(true);
    };

    const closeBulkBanModal = () => {
        setBulkBanModalOpen(false);
        setBulkBanList("");
        setBulkBanReason("");
        setBulkBanError(null);
        setBulkBanResult(null);
    };

    const handleBulkBan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authToken || !bulkBanList.trim()) return;

        setBulkBanning(true);
        setBulkBanError(null);
        setBulkBanResult(null);

        try {
            // Parse list - split by newlines, commas, or spaces
            const pubkeys = bulkBanList
                .split(/[\n,\s]+/)
                .map((pk) => pk.trim())
                .filter((pk) => pk.length > 0);

            if (pubkeys.length === 0) {
                throw new Error("No valid pubkeys provided");
            }

            const response = await fetch("/api/admin/users/bulk-ban", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    pubkeys,
                    reason: bulkBanReason || "Bulk banned by admin",
                    action: "ban",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to bulk ban");
            }

            setBulkBanResult(
                `Successfully banned ${data.updated} users. ${data.newUsersCreated > 0 ? `Created ${data.newUsersCreated} new user records.` : ""} ${data.invalidPubkeys?.length > 0 ? `${data.invalidPubkeys.length} invalid pubkeys skipped.` : ""}`
            );
            fetchUsers();
        } catch (err) {
            setBulkBanError(err instanceof Error ? err.message : "Failed to bulk ban");
        } finally {
            setBulkBanning(false);
        }
    };

    const getUserDisplayName = (user: User | null) => {
        if (!user) return null;
        return user.displayName || user.name || null;
    };

    if (error && !loading) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-text-light mt-1">
                        Manage users and bans
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-light text-text-light rounded-full text-sm">
                        <UsersIcon className="w-4 h-4" />
                        <span>{stats.totalUsers} users</span>
                    </div>
                    {stats.bannedUsers > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-sm">
                            <BanIcon className="w-4 h-4" />
                            <span>{stats.bannedUsers} banned</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    onClick={openAddBanModal}
                    color="danger"
                    leftIcon={<PlusIcon />}
                >
                    Add Ban
                </Button>
                <Button
                    onClick={openBulkBanModal}
                    variant="soft"
                    color="neutral"
                    leftIcon={<BanIcon />}
                >
                    Bulk Ban
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by pubkey, name, or NIP-05..."
                        className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                    />
                    {searchQuery && (
                        <IconButton
                            onClick={() => setSearchQuery("")}
                            icon={<CloseIcon className="w-4 h-4" />}
                            aria-label="Clear search"
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                        />
                    )}
                </div>
                <div className="flex gap-2">
                    {(["all", "active", "banned"] as FilterType[]).map((f) => (
                        <ToggleButton
                            key={f}
                            selected={filter === f}
                            onClick={() => {
                                setFilter(f);
                                setPage(1);
                            }}
                            size="md"
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </ToggleButton>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        {debouncedQuery ? (
                            <p>No users found matching &quot;{debouncedQuery}&quot;</p>
                        ) : filter === "banned" ? (
                            <p>No banned users.</p>
                        ) : (
                            <p>No users yet.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">User</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Pubkey</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Activity</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Joined</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-light/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.picture ? (
                                                    <img
                                                        src={user.picture}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center">
                                                        <UsersIcon className="w-4 h-4 text-text-light" />
                                                    </div>
                                                )}
                                                <div>
                                                    {getUserDisplayName(user) ? (
                                                        <p className="text-white font-medium">
                                                            {getUserDisplayName(user)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-text-light italic text-sm">No name</p>
                                                    )}
                                                    {user.nip05 && (
                                                        <p className="text-xs text-text-light">{user.nip05}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="text-xs text-text-light bg-surface-light px-1.5 py-0.5 rounded">
                                                {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-text-light">
                                                {user.reviewCount > 0 && (
                                                    <span className="mr-3">{user.reviewCount} reviews</span>
                                                )}
                                                {user.claimCount > 0 && (
                                                    <span>{user.claimCount} claims</span>
                                                )}
                                                {user.reviewCount === 0 && user.claimCount === 0 && (
                                                    <span className="italic">No activity</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-text-light text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.bannedAt ? (
                                                <div>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                                        Banned
                                                    </span>
                                                    {user.bannedReason && (
                                                        <p className="text-xs text-text-light mt-1 max-w-[150px] truncate">
                                                            {user.bannedReason}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {user.bannedAt ? (
                                                <Button
                                                    onClick={() => handleUnban(user)}
                                                    variant="ghost"
                                                    color="success"
                                                    size="sm"
                                                >
                                                    Unban
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => openBanModal(user)}
                                                    variant="ghost"
                                                    color="danger"
                                                    size="sm"
                                                >
                                                    Ban
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-text-light">
                        Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            variant="soft"
                            color="neutral"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-text-light px-3">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            variant="soft"
                            color="neutral"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Ban User Modal */}
            <Modal
                isOpen={banModalOpen}
                onClose={closeBanModal}
                title="Ban User"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleBan} className="p-6 space-y-4">
                    {banError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {banError}
                        </div>
                    )}

                    <div className="bg-surface-light rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            {banTarget?.picture ? (
                                <img
                                    src={banTarget.picture}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                                    <UsersIcon className="w-5 h-5 text-text-light" />
                                </div>
                            )}
                            <div>
                                <p className="text-white font-medium">
                                    {getUserDisplayName(banTarget) || "Anonymous"}
                                </p>
                                <code className="text-xs text-text-light">
                                    {banTarget?.pubkey.slice(0, 16)}...
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                        Banning this user will prevent them from submitting reviews or claiming venues.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Reason for ban
                        </label>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="e.g., Spam, Harassment, Fake reviews..."
                            rows={3}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeBanModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={banning}
                            loading={banning}
                            color="danger"
                        >
                            {banning ? "Banning..." : "Ban User"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Ban Modal (Manual) */}
            <Modal
                isOpen={addBanModalOpen}
                onClose={closeAddBanModal}
                title="Add Ban"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleAddBan} className="p-6 space-y-4">
                    {addBanError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {addBanError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Pubkey / npub
                        </label>
                        <input
                            type="text"
                            value={addBanPubkey}
                            onChange={(e) => setAddBanPubkey(e.target.value)}
                            placeholder="npub1... or 64-char hex pubkey"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-text-light mt-1">
                            If the user doesn&apos;t exist yet, a new record will be created with banned status.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Reason for ban
                        </label>
                        <textarea
                            value={addBanReason}
                            onChange={(e) => setAddBanReason(e.target.value)}
                            placeholder="e.g., Spam, Known bad actor..."
                            rows={3}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeAddBanModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={addingBan || !addBanPubkey.trim()}
                            loading={addingBan}
                            color="danger"
                        >
                            {addingBan ? "Adding..." : "Add Ban"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Ban Modal */}
            <Modal
                isOpen={bulkBanModalOpen}
                onClose={closeBulkBanModal}
                title="Bulk Ban"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleBulkBan} className="p-6 space-y-4">
                    {bulkBanError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {bulkBanError}
                        </div>
                    )}

                    {bulkBanResult && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
                            {bulkBanResult}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Pubkeys to ban
                        </label>
                        <textarea
                            value={bulkBanList}
                            onChange={(e) => setBulkBanList(e.target.value)}
                            placeholder="Enter pubkeys or npubs, one per line, or separated by commas..."
                            rows={8}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-text-light mt-1">
                            Max 100 pubkeys per request. Both hex and npub formats are accepted.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Reason for ban
                        </label>
                        <input
                            type="text"
                            value={bulkBanReason}
                            onChange={(e) => setBulkBanReason(e.target.value)}
                            placeholder="e.g., Known spam ring, Bot network..."
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeBulkBanModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={bulkBanning || !bulkBanList.trim()}
                            loading={bulkBanning}
                            color="danger"
                        >
                            {bulkBanning ? "Processing..." : "Ban All"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
