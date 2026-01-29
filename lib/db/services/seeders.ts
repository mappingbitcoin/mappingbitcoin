import prisma from "../prisma";

export interface CreateSeederInput {
    pubkey: string;
    region: string;
    label?: string;
    addedBy?: string;
}

export interface UpdateSeederInput {
    region?: string;
    label?: string;
}

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
function normalizeToHex(pubkey: string): string | null {
    const trimmed = pubkey.trim();
    if (trimmed.startsWith("npub1")) {
        return npubToHex(trimmed);
    }
    // Already hex - validate and normalize to lowercase
    if (/^[0-9a-f]{64}$/i.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    return null;
}

/**
 * Get a seeder by pubkey (accepts npub or hex)
 */
export async function getSeeder(pubkey: string) {
    const normalizedPubkey = normalizeToHex(pubkey);
    if (!normalizedPubkey) return null;

    return prisma.communitySeeder.findUnique({
        where: { pubkey: normalizedPubkey },
    });
}

/**
 * List all seeders
 */
export async function listSeeders(region?: string) {
    return prisma.communitySeeder.findMany({
        where: region ? { region } : undefined,
        orderBy: { createdAt: "asc" },
    });
}

/**
 * Create a new community seeder
 * Accepts both npub and hex formats for pubkey
 */
export async function createSeeder(
    input: CreateSeederInput
): Promise<{ success: boolean; error?: string; seeder?: Awaited<ReturnType<typeof getSeeder>> }> {
    const { pubkey, region, label, addedBy } = input;

    // Convert npub to hex or validate hex format
    const normalizedPubkey = normalizeToHex(pubkey);
    if (!normalizedPubkey) {
        return { success: false, error: "Invalid pubkey format. Must be npub or 64 hex characters." };
    }

    // Check if seeder already exists
    const existing = await prisma.communitySeeder.findUnique({
        where: { pubkey: normalizedPubkey },
    });

    if (existing) {
        return { success: false, error: "Seeder already exists" };
    }

    const seeder = await prisma.communitySeeder.create({
        data: {
            pubkey: normalizedPubkey,
            region,
            label,
            addedBy,
        },
    });

    return { success: true, seeder };
}

/**
 * Update a seeder's region or label (accepts npub or hex)
 */
export async function updateSeeder(
    pubkey: string,
    input: UpdateSeederInput
): Promise<{ success: boolean; error?: string; seeder?: Awaited<ReturnType<typeof getSeeder>> }> {
    const normalizedPubkey = normalizeToHex(pubkey);
    if (!normalizedPubkey) {
        return { success: false, error: "Invalid pubkey format" };
    }

    const existing = await prisma.communitySeeder.findUnique({
        where: { pubkey: normalizedPubkey },
    });

    if (!existing) {
        return { success: false, error: "Seeder not found" };
    }

    const seeder = await prisma.communitySeeder.update({
        where: { pubkey: normalizedPubkey },
        data: {
            ...(input.region !== undefined && { region: input.region }),
            ...(input.label !== undefined && { label: input.label }),
        },
    });

    return { success: true, seeder };
}

/**
 * Delete a seeder (accepts npub or hex)
 * This will cascade delete all associated graph nodes
 */
export async function deleteSeeder(
    pubkey: string
): Promise<{ success: boolean; error?: string }> {
    const normalizedPubkey = normalizeToHex(pubkey);
    if (!normalizedPubkey) {
        return { success: false, error: "Invalid pubkey format" };
    }

    const existing = await prisma.communitySeeder.findUnique({
        where: { pubkey: normalizedPubkey },
    });

    if (!existing) {
        return { success: false, error: "Seeder not found" };
    }

    await prisma.communitySeeder.delete({
        where: { pubkey: normalizedPubkey },
    });

    return { success: true };
}

/**
 * Get seeder count
 */
export async function getSeederCount(): Promise<number> {
    return prisma.communitySeeder.count();
}

/**
 * List unique regions from seeders
 */
export async function listSeederRegions(): Promise<string[]> {
    const result = await prisma.communitySeeder.findMany({
        select: { region: true },
        distinct: ["region"],
    });
    return result.map((r) => r.region);
}
