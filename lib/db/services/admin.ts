import prisma from "../prisma";

/**
 * Convert npub to hex pubkey
 */
function npubToHex(npub: string): string | null {
    try {
        const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
        const lower = npub.toLowerCase();
        if (!lower.startsWith("npub1")) return null;

        const data = lower.slice(5); // skip "npub1"
        const values: number[] = [];
        for (const char of data) {
            const idx = ALPHABET.indexOf(char);
            if (idx === -1) return null;
            values.push(idx);
        }

        // Convert 5-bit to 8-bit
        let acc = 0;
        let bits = 0;
        const bytes: number[] = [];
        for (const value of values.slice(0, -6)) { // exclude checksum
            acc = (acc << 5) | value;
            bits += 5;
            while (bits >= 8) {
                bits -= 8;
                bytes.push((acc >> bits) & 0xff);
            }
        }

        return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
        return null;
    }
}

/**
 * Normalize pubkey to hex format (handles both npub and hex)
 */
function normalizeToHex(pubkey: string): string {
    if (pubkey.startsWith("npub1")) {
        const hex = npubToHex(pubkey);
        return hex || pubkey;
    }
    return pubkey.toLowerCase();
}

/**
 * Check if a pubkey belongs to an admin user
 * Also handles bootstrap via INITIAL_ADMIN_PUBKEY env var
 * Accepts both npub and hex formats
 */
export async function isAdmin(pubkey: string): Promise<boolean> {
    const normalizedPubkey = normalizeToHex(pubkey);

    // Check if this is the initial admin from env var
    const initialAdminPubkey = process.env.INITIAL_ADMIN_PUBKEY;
    if (initialAdminPubkey) {
        const normalizedInitial = normalizeToHex(initialAdminPubkey);
        if (normalizedPubkey === normalizedInitial) {
            // Auto-create admin user if it doesn't exist
            await prisma.adminUser.upsert({
                where: { pubkey: normalizedPubkey },
                update: {},
                create: {
                    pubkey: normalizedPubkey,
                    label: "Initial Admin",
                },
            });
            return true;
        }
    }

    // Check database for admin user - check both normalized hex and original
    const adminUser = await prisma.adminUser.findFirst({
        where: {
            OR: [
                { pubkey: normalizedPubkey },
                { pubkey: pubkey },
            ],
        },
    });

    return adminUser !== null;
}

/**
 * Get an admin user by pubkey (accepts npub or hex)
 */
export async function getAdmin(pubkey: string) {
    const normalizedPubkey = normalizeToHex(pubkey);
    return prisma.adminUser.findFirst({
        where: {
            OR: [
                { pubkey: normalizedPubkey },
                { pubkey: pubkey },
            ],
        },
    });
}

/**
 * List all admin users
 */
export async function listAdmins() {
    return prisma.adminUser.findMany({
        orderBy: { createdAt: "asc" },
    });
}

/**
 * Create a new admin user (accepts npub or hex, stores as hex)
 * Only existing admins can create new admins
 */
export async function createAdmin(
    pubkey: string,
    label?: string,
    addedByPubkey?: string
): Promise<{ success: boolean; error?: string; admin?: Awaited<ReturnType<typeof getAdmin>> }> {
    const normalizedPubkey = normalizeToHex(pubkey);

    // Verify the creator is an admin (if provided)
    if (addedByPubkey) {
        const isCreatorAdmin = await isAdmin(addedByPubkey);
        if (!isCreatorAdmin) {
            return { success: false, error: "Only admins can create new admins" };
        }
    }

    // Check if admin already exists
    const existing = await getAdmin(normalizedPubkey);

    if (existing) {
        return { success: false, error: "Admin already exists" };
    }

    const admin = await prisma.adminUser.create({
        data: {
            pubkey: normalizedPubkey,
            label,
        },
    });

    return { success: true, admin };
}

/**
 * Update an admin user's label (accepts npub or hex)
 */
export async function updateAdmin(
    pubkey: string,
    label: string
): Promise<{ success: boolean; error?: string; admin?: Awaited<ReturnType<typeof getAdmin>> }> {
    const existing = await getAdmin(pubkey);

    if (!existing) {
        return { success: false, error: "Admin not found" };
    }

    const admin = await prisma.adminUser.update({
        where: { id: existing.id },
        data: { label },
    });

    return { success: true, admin };
}

/**
 * Delete an admin user (accepts npub or hex)
 * Cannot delete the last admin
 */
export async function deleteAdmin(
    pubkey: string,
    requestorPubkey: string
): Promise<{ success: boolean; error?: string }> {
    const normalizedPubkey = normalizeToHex(pubkey);
    const normalizedRequestor = normalizeToHex(requestorPubkey);

    // Check requestor is admin
    const isRequestorAdmin = await isAdmin(requestorPubkey);
    if (!isRequestorAdmin) {
        return { success: false, error: "Only admins can delete admins" };
    }

    // Cannot delete yourself
    if (normalizedPubkey === normalizedRequestor) {
        return { success: false, error: "Cannot delete yourself" };
    }

    // Check there's more than one admin
    const adminCount = await prisma.adminUser.count();
    if (adminCount <= 1) {
        return { success: false, error: "Cannot delete the last admin" };
    }

    const existing = await getAdmin(pubkey);

    if (!existing) {
        return { success: false, error: "Admin not found" };
    }

    await prisma.adminUser.delete({
        where: { id: existing.id },
    });

    return { success: true };
}
