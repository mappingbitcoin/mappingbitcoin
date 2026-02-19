# WoT Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate nostr-wot-sdk for Web of Trust scoring on reviews, with extension-first approach and backend oracle fallback.

**Architecture:** Frontend checks for WoT browser extension via nostr-wot-sdk; if available, uses user's personal WoT graph. Falls back to backend-computed distances from wot-oracle.mappingbitcoin.com relative to the Mapping Bitcoin bot pubkey.

**Tech Stack:** nostr-wot-sdk, Next.js API routes, Prisma/PostgreSQL, TypeScript

---

## Task 1: Install nostr-wot-sdk

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run:
```bash
npm install nostr-wot-sdk
```

**Step 2: Verify installation**

Run: `npm ls nostr-wot-sdk`
Expected: Shows nostr-wot-sdk version

---

## Task 2: Add Prisma Schema Changes

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add WoT fields to Review model**

Find the Review model (around line 117) and add these fields after `spamReasons`:

```prisma
  // Web of Trust
  wotDistance    Int?       @map("wot_distance")    // Hops from bot pubkey
  wotPathCount   Int?       @map("wot_path_count")  // Number of paths found
  wotComputedAt  DateTime?  @map("wot_computed_at") // When computed
```

**Step 2: Add WoT fields to User model**

Find the User model (around line 27) and add these fields after `bannedBy`:

```prisma
  // Web of Trust cache
  wotDistance    Int?       @map("wot_distance")
  wotComputedAt  DateTime?  @map("wot_computed_at")
```

**Step 3: Create migration**

Run:
```bash
npx prisma migrate dev --name add_wot_fields
```

Expected: Migration created and applied successfully

---

## Task 3: Add Environment Variables

**Files:**
- Modify: `.env`
- Modify: `lib/Environment.ts`

**Step 1: Add to .env**

```env
WOT_ORACLE_URL=https://wot-oracle.mappingbitcoin.com
```

Note: MAPPING_BITCOIN_BOT_PUBKEY will be derived from MAPPING_BITCOIN_BOT_PRIVATE_KEY at runtime.

**Step 2: Add to lib/Environment.ts serverEnv**

Find the `serverEnv` object and add:

```typescript
wotOracleUrl: process.env.WOT_ORACLE_URL || "https://wot-oracle.mappingbitcoin.com",
mappingBitcoinBotPrivateKey: process.env.MAPPING_BITCOIN_BOT_PRIVATE_KEY || "",
```

---

## Task 4: Create WoT Oracle Client

**Files:**
- Create: `lib/wot/oracleClient.ts`

**Step 1: Create the oracle client**

```typescript
import { serverEnv } from "../Environment";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

// Cache the bot pubkey
let botPubkey: string | null = null;

function getBotPubkey(): string {
    if (botPubkey) return botPubkey;

    const privateKey = serverEnv.mappingBitcoinBotPrivateKey;
    if (!privateKey) {
        throw new Error("MAPPING_BITCOIN_BOT_PRIVATE_KEY not configured");
    }

    // Remove 'nsec' prefix if present and convert
    const hexKey = privateKey.startsWith("nsec")
        ? decodeNsec(privateKey)
        : privateKey;

    botPubkey = getPublicKey(hexToBytes(hexKey));
    return botPubkey;
}

// Decode nsec to hex (simplified - use nostr-tools nip19 in real implementation)
function decodeNsec(nsec: string): string {
    // Import from nostr-tools if needed
    const { decode } = require("nostr-tools/nip19");
    const { data } = decode(nsec);
    return Buffer.from(data).toString("hex");
}

export interface WoTDistanceResult {
    hops: number | null;  // null means unreachable
    pathCount: number;
    mutual: boolean;
}

/**
 * Query WoT oracle for distance between bot and target pubkey
 */
export async function getWoTDistance(
    targetPubkey: string,
    fromPubkey?: string
): Promise<WoTDistanceResult> {
    const from = fromPubkey || getBotPubkey();
    const oracleUrl = serverEnv.wotOracleUrl;

    try {
        const url = `${oracleUrl}/distance?from=${from}&to=${targetPubkey}`;
        const response = await fetch(url, {
            headers: { "User-Agent": "MappingBitcoin/1.0" },
            signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!response.ok) {
            console.error(`[WoT] Oracle returned ${response.status}`);
            return { hops: null, pathCount: 0, mutual: false };
        }

        const data = await response.json();
        return {
            hops: data.hops ?? null,
            pathCount: data.pathCount ?? 0,
            mutual: data.mutual ?? false,
        };
    } catch (error) {
        console.error("[WoT] Oracle query failed:", error);
        return { hops: null, pathCount: 0, mutual: false };
    }
}

/**
 * Batch query WoT distances for multiple pubkeys
 */
export async function getWoTDistanceBatch(
    targetPubkeys: string[],
    fromPubkey?: string
): Promise<Map<string, WoTDistanceResult>> {
    const from = fromPubkey || getBotPubkey();
    const oracleUrl = serverEnv.wotOracleUrl;
    const results = new Map<string, WoTDistanceResult>();

    // Initialize with defaults
    for (const pubkey of targetPubkeys) {
        results.set(pubkey, { hops: null, pathCount: 0, mutual: false });
    }

    try {
        const response = await fetch(`${oracleUrl}/distance/batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "MappingBitcoin/1.0",
            },
            body: JSON.stringify({ from, targets: targetPubkeys }),
            signal: AbortSignal.timeout(30000), // 30s for batch
        });

        if (!response.ok) {
            console.error(`[WoT] Batch query returned ${response.status}`);
            return results;
        }

        const data = await response.json();

        // Process results
        if (data.results && Array.isArray(data.results)) {
            for (const item of data.results) {
                results.set(item.pubkey, {
                    hops: item.hops ?? null,
                    pathCount: item.pathCount ?? 0,
                    mutual: item.mutual ?? false,
                });
            }
        }

        return results;
    } catch (error) {
        console.error("[WoT] Batch query failed:", error);
        return results;
    }
}

/**
 * Get bot pubkey for frontend use
 */
export function getMappingBitcoinBotPubkey(): string {
    return getBotPubkey();
}
```

---

## Task 5: Update Review Listener to Compute WoT

**Files:**
- Modify: `scripts/reviewListener.ts`

**Step 1: Import WoT client**

Add at the top with other imports:

```typescript
import { getWoTDistance } from "../lib/wot/oracleClient";
```

**Step 2: Update processEvent to compute WoT**

Find the `processEvent` function. After `await indexReview(reviewWithImages)` (around line 181), add:

```typescript
// Compute WoT distance for the reviewer
try {
    const wotResult = await getWoTDistance(review.authorPubkey);
    if (wotResult.hops !== null || wotResult.pathCount > 0) {
        await updateReviewWoT(review.eventId, wotResult);
    }
} catch (wotError) {
    console.error(`[Listener] WoT computation failed:`, wotError);
}
```

**Step 3: Add updateReviewWoT import**

This function needs to be created in the reviews service (Task 6).

---

## Task 6: Add WoT Update Function to Reviews Service

**Files:**
- Modify: `lib/db/services/reviews.ts`

**Step 1: Add updateReviewWoT function**

Add this function at the end of the file:

```typescript
/**
 * Update WoT distance for a review
 */
export async function updateReviewWoT(
    eventId: string,
    wotData: { hops: number | null; pathCount: number }
): Promise<void> {
    await prisma.review.update({
        where: { eventId },
        data: {
            wotDistance: wotData.hops,
            wotPathCount: wotData.pathCount,
            wotComputedAt: new Date(),
        },
    });
}

/**
 * Update WoT distance for a user (cached)
 */
export async function updateUserWoT(
    pubkey: string,
    wotDistance: number | null
): Promise<void> {
    await prisma.user.update({
        where: { pubkey },
        data: {
            wotDistance,
            wotComputedAt: new Date(),
        },
    });
}
```

---

## Task 7: Update Reviews API to Return WoT Data

**Files:**
- Modify: `lib/db/services/reviews.ts`

**Step 1: Update getReviewsWithTrustByOsmId**

Find the `getReviewsWithTrustByOsmId` function and update the select to include WoT fields:

In the `select` object for reviews, add:

```typescript
wotDistance: true,
wotPathCount: true,
wotComputedAt: true,
```

**Step 2: Update ReviewWithTrust type**

Find or add the `ReviewWithTrust` type export and add:

```typescript
wotDistance: number | null;
wotPathCount: number | null;
wotComputedAt: Date | null;
```

---

## Task 8: Create WoT Distance API Endpoint

**Files:**
- Create: `app/api/wot/distance/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getWoTDistance, getMappingBitcoinBotPubkey } from "@/lib/wot/oracleClient";

/**
 * GET /api/wot/distance?pubkey={pubkey}
 * Get WoT distance from bot to target pubkey
 */
export async function GET(request: NextRequest) {
    const pubkey = request.nextUrl.searchParams.get("pubkey");

    if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
        return NextResponse.json(
            { error: "Invalid pubkey format" },
            { status: 400 }
        );
    }

    try {
        const result = await getWoTDistance(pubkey.toLowerCase());

        return NextResponse.json({
            pubkey: pubkey.toLowerCase(),
            distance: result.hops,
            pathCount: result.pathCount,
            mutual: result.mutual,
            fromPubkey: getMappingBitcoinBotPubkey(),
            source: "oracle",
        });
    } catch (error) {
        console.error("[WoT API] Error:", error);
        return NextResponse.json(
            { error: "Failed to compute WoT distance" },
            { status: 500 }
        );
    }
}
```

---

## Task 9: Create useWoT Hook

**Files:**
- Create: `hooks/useWoT.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Type definitions for nostr-wot-sdk
interface NostrWoTSDK {
    isConfigured: () => Promise<boolean>;
    getDistance: (pubkey: string) => Promise<number | null>;
    getTrustScore: (pubkey: string) => Promise<number>;
    getDistanceBatch: (pubkeys: string[]) => Promise<Map<string, number | null>>;
}

declare global {
    interface Window {
        nostrWoT?: NostrWoTSDK;
    }
}

export interface UseWoTResult {
    isExtensionAvailable: boolean;
    isLoading: boolean;
    source: "extension" | "oracle" | "none";
    getDistance: (pubkey: string) => Promise<number | null>;
    getDistanceBatch: (pubkeys: string[]) => Promise<Map<string, number | null>>;
}

/**
 * Hook for Web of Trust integration
 * Checks for browser extension first, falls back to backend oracle
 */
export function useWoT(): UseWoTResult {
    const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        const checkExtension = async () => {
            try {
                // Check if nostr-wot-sdk extension is available
                if (typeof window !== "undefined" && window.nostrWoT) {
                    const configured = await window.nostrWoT.isConfigured();
                    setIsExtensionAvailable(configured);
                } else {
                    // Try dynamic import of nostr-wot-sdk
                    const sdk = await import("nostr-wot-sdk").catch(() => null);
                    if (sdk && sdk.isConfigured) {
                        const configured = await sdk.isConfigured();
                        setIsExtensionAvailable(configured);
                    }
                }
            } catch {
                setIsExtensionAvailable(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkExtension();
    }, []);

    const getDistance = useCallback(async (pubkey: string): Promise<number | null> => {
        if (isExtensionAvailable) {
            try {
                const sdk = await import("nostr-wot-sdk");
                return await sdk.getDistance(pubkey);
            } catch {
                // Fall through to oracle
            }
        }

        // Fallback to backend oracle
        try {
            const response = await fetch(`/api/wot/distance?pubkey=${pubkey}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.distance;
        } catch {
            return null;
        }
    }, [isExtensionAvailable]);

    const getDistanceBatch = useCallback(async (
        pubkeys: string[]
    ): Promise<Map<string, number | null>> => {
        const results = new Map<string, number | null>();

        if (isExtensionAvailable) {
            try {
                const sdk = await import("nostr-wot-sdk");
                return await sdk.getDistanceBatch(pubkeys);
            } catch {
                // Fall through to oracle
            }
        }

        // Fallback: query each individually (could optimize with batch endpoint)
        await Promise.all(
            pubkeys.map(async (pubkey) => {
                const distance = await getDistance(pubkey);
                results.set(pubkey, distance);
            })
        );

        return results;
    }, [isExtensionAvailable, getDistance]);

    return {
        isExtensionAvailable,
        isLoading,
        source: isExtensionAvailable ? "extension" : "oracle",
        getDistance,
        getDistanceBatch,
    };
}
```

---

## Task 10: Create WoTBadge Component

**Files:**
- Create: `components/reviews/WoTBadge.tsx`

**Step 1: Create the component**

```typescript
"use client";

import React from "react";
import {
    CircleCheckFilledIcon,
    UserFilledIcon,
    QuestionCircleIcon,
} from "@/assets/icons/ui";

interface WoTBadgeProps {
    distance: number | null;
    source?: "extension" | "oracle";
    size?: "sm" | "md" | "lg";
    showSource?: boolean;
}

/**
 * Visual indicator for Web of Trust distance
 */
export default function WoTBadge({
    distance,
    source = "oracle",
    size = "md",
    showSource = false,
}: WoTBadgeProps) {
    const getWoTLevel = (dist: number | null): {
        label: string;
        color: string;
        bgColor: string;
        description: string;
    } => {
        if (dist === null) {
            return {
                label: "Unknown",
                color: "text-gray-400",
                bgColor: "bg-gray-500/10 border-gray-500/30 border-dashed",
                description: "Not connected to trust network",
            };
        }
        if (dist === 0) {
            return {
                label: "You",
                color: "text-green-400",
                bgColor: "bg-green-500/10 border-green-500/30",
                description: "This is you",
            };
        }
        if (dist === 1) {
            return {
                label: "Direct",
                color: "text-emerald-400",
                bgColor: "bg-emerald-500/10 border-emerald-500/30",
                description: "You follow this person",
            };
        }
        if (dist === 2) {
            return {
                label: "2nd°",
                color: "text-yellow-400",
                bgColor: "bg-yellow-500/10 border-yellow-500/30",
                description: "Friend of a friend",
            };
        }
        if (dist === 3) {
            return {
                label: "3rd°",
                color: "text-orange-400",
                bgColor: "bg-orange-500/10 border-orange-500/30",
                description: "3 hops away",
            };
        }
        return {
            label: `${dist}+`,
            color: "text-gray-400",
            bgColor: "bg-gray-500/10 border-gray-500/30",
            description: `${dist} hops away - distant connection`,
        };
    };

    const wot = getWoTLevel(distance);

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
    };

    const sourceLabel = source === "extension" ? "Your WoT" : "Community WoT";
    const tooltip = `${wot.description}${showSource ? ` (${sourceLabel})` : ""}`;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border ${wot.bgColor} ${wot.color} ${sizeClasses[size]} font-medium`}
            title={tooltip}
        >
            <WoTIcon distance={distance} size={size} />
            <span>{wot.label}</span>
            {showSource && (
                <span className="opacity-60 text-[0.65em]">
                    {source === "extension" ? "👤" : "🌐"}
                </span>
            )}
        </span>
    );
}

interface WoTIconProps {
    distance: number | null;
    size: "sm" | "md" | "lg";
}

function WoTIcon({ distance, size }: WoTIconProps) {
    const iconSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4";

    if (distance === null) {
        return <QuestionCircleIcon className={iconSize} />;
    }
    if (distance <= 1) {
        return <CircleCheckFilledIcon className={iconSize} />;
    }
    return <UserFilledIcon className={iconSize} />;
}
```

---

## Task 11: Integrate WoTBadge into ReviewCard

**Files:**
- Modify: `components/reviews/ReviewCard.tsx`

**Step 1: Import WoTBadge and useWoT**

Add at the top:

```typescript
import WoTBadge from "./WoTBadge";
import { useWoT } from "@/hooks/useWoT";
```

**Step 2: Add WoT state and effect**

Inside the `ReviewCard` component, after the existing state declarations:

```typescript
const { getDistance, source: wotSource, isLoading: wotLoading } = useWoT();
const [wotDistance, setWotDistance] = useState<number | null>(
    review.wotDistance ?? null
);

useEffect(() => {
    // If we have backend data, use it; otherwise fetch from extension/oracle
    if (review.wotDistance !== null && review.wotDistance !== undefined) {
        setWotDistance(review.wotDistance);
    } else if (!wotLoading) {
        getDistance(review.authorPubkey).then(setWotDistance);
    }
}, [review.authorPubkey, review.wotDistance, getDistance, wotLoading]);
```

**Step 3: Add WoTBadge to the author info section**

Find the line with `<TrustBadge score={review.trustScore} size="sm" />` (around line 94) and add WoTBadge after it:

```typescript
<TrustBadge score={review.trustScore} size="sm" />
{wotDistance !== null && (
    <WoTBadge distance={wotDistance} source={wotSource} size="sm" />
)}
```

---

## Task 12: Create WoT Recomputation Script

**Files:**
- Create: `scripts/recomputeWoT.ts`

**Step 1: Create the script**

```typescript
#!/usr/bin/env tsx
/**
 * Recompute WoT distances for all reviewers
 * Run daily via cron: npm run wot:recompute
 */

import "dotenv/config";
import prisma from "../lib/db/prisma";
import { getWoTDistanceBatch } from "../lib/wot/oracleClient";

const BATCH_SIZE = 100;

async function main() {
    console.log("[WoT Recompute] Starting...");

    // Get all unique reviewer pubkeys
    const reviewers = await prisma.review.findMany({
        select: { authorPubkey: true },
        distinct: ["authorPubkey"],
    });

    const pubkeys = reviewers.map((r) => r.authorPubkey);
    console.log(`[WoT Recompute] Found ${pubkeys.length} unique reviewers`);

    let updated = 0;

    // Process in batches
    for (let i = 0; i < pubkeys.length; i += BATCH_SIZE) {
        const batch = pubkeys.slice(i, i + BATCH_SIZE);
        console.log(`[WoT Recompute] Processing batch ${i / BATCH_SIZE + 1}...`);

        const results = await getWoTDistanceBatch(batch);

        // Update users and reviews
        for (const [pubkey, result] of results) {
            // Update user cache
            await prisma.user.updateMany({
                where: { pubkey },
                data: {
                    wotDistance: result.hops,
                    wotComputedAt: new Date(),
                },
            });

            // Update all reviews by this author
            await prisma.review.updateMany({
                where: { authorPubkey: pubkey },
                data: {
                    wotDistance: result.hops,
                    wotPathCount: result.pathCount,
                    wotComputedAt: new Date(),
                },
            });

            updated++;
        }

        // Rate limiting: wait between batches
        if (i + BATCH_SIZE < pubkeys.length) {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    console.log(`[WoT Recompute] Done. Updated ${updated} users.`);
}

main()
    .catch((err) => {
        console.error("[WoT Recompute] Error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
```

**Step 2: Add npm script**

Add to package.json scripts:

```json
"wot:recompute": "tsx scripts/recomputeWoT.ts"
```

---

## Task 13: Add Filter Controls to ReviewList

**Files:**
- Modify: `components/reviews/ReviewList.tsx`

**Step 1: Add filter state**

Find the component and add state for filtering:

```typescript
const [showTrustedOnly, setShowTrustedOnly] = useState(false);
const [sortBy, setSortBy] = useState<"recent" | "trusted" | "rating">("recent");
```

**Step 2: Add filter/sort logic**

Before rendering reviews, filter and sort:

```typescript
const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Filter by trust
    if (showTrustedOnly) {
        result = result.filter(r =>
            r.wotDistance !== null && r.wotDistance <= 3
        );
    }

    // Sort
    switch (sortBy) {
        case "trusted":
            result.sort((a, b) => {
                const aD = a.wotDistance ?? 999;
                const bD = b.wotDistance ?? 999;
                return aD - bD;
            });
            break;
        case "rating":
            result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
            break;
        case "recent":
        default:
            result.sort((a, b) =>
                new Date(b.eventCreatedAt).getTime() - new Date(a.eventCreatedAt).getTime()
            );
    }

    return result;
}, [reviews, showTrustedOnly, sortBy]);
```

**Step 3: Add filter UI**

Add above the reviews list:

```tsx
<div className="flex items-center gap-4 mb-4">
    <label className="flex items-center gap-2 text-sm text-text-light cursor-pointer">
        <input
            type="checkbox"
            checked={showTrustedOnly}
            onChange={(e) => setShowTrustedOnly(e.target.checked)}
            className="rounded border-border-light"
        />
        Show trusted only
    </label>

    <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        className="text-sm bg-surface border border-border-light rounded px-2 py-1 text-text"
    >
        <option value="recent">Most recent</option>
        <option value="trusted">Most trusted</option>
        <option value="rating">Highest rated</option>
    </select>
</div>
```

---

## Task 14: Export WoTBadge from Index

**Files:**
- Modify: `components/reviews/index.ts`

**Step 1: Add export**

```typescript
export { default as WoTBadge } from "./WoTBadge";
```

---

## Summary of Files

**New files:**
- `lib/wot/oracleClient.ts` - Backend oracle client
- `app/api/wot/distance/route.ts` - WoT distance API
- `hooks/useWoT.ts` - Frontend WoT hook
- `components/reviews/WoTBadge.tsx` - WoT badge component
- `scripts/recomputeWoT.ts` - Daily recomputation script

**Modified files:**
- `package.json` - Add nostr-wot-sdk, npm scripts
- `prisma/schema.prisma` - Add WoT fields
- `.env` - Add WOT_ORACLE_URL
- `lib/Environment.ts` - Add env vars
- `lib/db/services/reviews.ts` - Add WoT update functions, include in queries
- `scripts/reviewListener.ts` - Compute WoT on new reviews
- `components/reviews/ReviewCard.tsx` - Display WoTBadge
- `components/reviews/ReviewList.tsx` - Add filter controls
- `components/reviews/index.ts` - Export WoTBadge

---

## Verification Checklist

- [ ] nostr-wot-sdk installed
- [ ] Prisma migration applied
- [ ] Oracle client fetches distances
- [ ] Review listener computes WoT for new reviews
- [ ] Reviews API returns wotDistance
- [ ] WoTBadge displays correctly
- [ ] Extension detection works (if user has extension)
- [ ] Fallback to oracle works (if no extension)
- [ ] Filter controls work
- [ ] Recomputation script runs successfully
