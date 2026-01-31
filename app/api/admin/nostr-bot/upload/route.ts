import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { serverEnv } from "@/lib/Environment";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { getPublicKey, getEventHash, signEvent, NostrEvent } from "@/lib/nostr/crypto";

// Public Blossom servers to try (in order of preference)
// Note: nostr.build is NOT a standard Blossom server, it has a different API
const BLOSSOM_SERVERS = [
    "https://blossom.primal.net",
    "https://files.v0l.io",
    "https://blossom.oxtr.dev",
    "https://cdn.satellite.earth",
    "https://blossom.nostr.hu",
];

interface UploadAttempt {
    server: string;
    success: boolean;
    error?: string;
    url?: string;
}

/**
 * Create a NIP-98 HTTP Auth event for Blossom upload
 */
async function createAuthEvent(
    privateKey: string,
    url: string,
    method: string,
    sha256Hash: string
): Promise<string> {
    const pubkey = getPublicKey(privateKey);

    const event: NostrEvent = {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 24242, // Blossom auth event kind
        tags: [
            ["t", "upload"],
            ["x", sha256Hash],
            ["expiration", String(Math.floor(Date.now() / 1000) + 300)], // 5 minutes
        ],
        content: "Upload file",
    };

    event.id = getEventHash(event);
    event.sig = await signEvent(event, privateKey);

    // Return base64 encoded event
    return Buffer.from(JSON.stringify(event)).toString("base64");
}

/**
 * POST /api/admin/nostr-bot/upload
 * Upload an image to Blossom servers with NIP-98 auth
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        return NextResponse.json(
            { error: "Bot private key not configured" },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            );
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);

        // Calculate SHA-256 hash
        const hash = bytesToHex(sha256(fileBytes));

        // Get file extension
        const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];

        // Try uploading to each Blossom server until one succeeds
        const attempts: UploadAttempt[] = [];

        for (const server of BLOSSOM_SERVERS) {
            console.log(`[Blossom] Trying to upload to ${server}...`);

            try {
                // Create NIP-98/Blossom auth header
                const authEvent = await createAuthEvent(
                    privateKey,
                    `${server}/upload`,
                    "PUT",
                    hash
                );

                // Try PUT /upload (standard Blossom with auth)
                let response = await fetch(`${server}/upload`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": file.type,
                        "Authorization": `Nostr ${authEvent}`,
                        "X-SHA-256": hash,
                    },
                    body: fileBytes,
                });

                // Some servers use POST instead of PUT
                if (response.status === 405) {
                    console.log(`[Blossom] ${server} returned 405, trying POST...`);
                    response = await fetch(`${server}/upload`, {
                        method: "POST",
                        headers: {
                            "Content-Type": file.type,
                            "Authorization": `Nostr ${authEvent}`,
                            "X-SHA-256": hash,
                        },
                        body: fileBytes,
                    });
                }

                if (response.ok) {
                    let uploadedUrl: string;

                    try {
                        const data = await response.json();
                        console.log(`[Blossom] Response from ${server}:`, data);

                        // Different servers return URL in different formats
                        // Standard Blossom returns { url: "..." } or { blob: { url: "..." } }
                        // Some return { sha256: "...", url: "..." }
                        if (data.url && data.url.startsWith("http")) {
                            uploadedUrl = data.url;
                        } else if (data.blob?.url && data.blob.url.startsWith("http")) {
                            uploadedUrl = data.blob.url;
                        } else if (data.sha256) {
                            // Construct URL from hash
                            uploadedUrl = `${server}/${data.sha256}`;
                        } else {
                            // Fallback: construct URL from our calculated hash
                            uploadedUrl = `${server}/${hash}`;
                        }
                    } catch {
                        // If response is not JSON, construct URL from hash
                        uploadedUrl = `${server}/${hash}`;
                    }

                    // Verify the URL looks like an image URL (not a webpage)
                    if (uploadedUrl.includes("/upload") || uploadedUrl.endsWith("/")) {
                        console.log(`[Blossom] URL looks like a webpage, constructing from hash: ${server}/${hash}`);
                        uploadedUrl = `${server}/${hash}`;
                    }

                    console.log(`[Blossom] Successfully uploaded to ${server}: ${uploadedUrl}`);

                    attempts.push({ server, success: true, url: uploadedUrl });

                    return NextResponse.json({
                        success: true,
                        url: uploadedUrl,
                        hash,
                        size: file.size,
                        type: file.type,
                        server,
                    });
                } else {
                    const errorText = await response.text().catch(() => "Unknown error");
                    const errorMsg = `HTTP ${response.status}: ${errorText.slice(0, 200)}`;
                    console.log(`[Blossom] Failed to upload to ${server}: ${errorMsg}`);
                    attempts.push({ server, success: false, error: errorMsg });
                    // Continue to next server
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Network error";
                console.log(`[Blossom] Error uploading to ${server}: ${errorMsg}`);
                attempts.push({ server, success: false, error: errorMsg });
                // Continue to next server
            }
        }

        // All servers failed
        const errorDetails = attempts
            .map((a) => `${a.server}: ${a.error}`)
            .join("; ");

        console.error(`[Blossom] All servers failed. Attempts: ${JSON.stringify(attempts)}`);

        return NextResponse.json(
            {
                error: "Failed to upload to any Blossom server",
                details: errorDetails,
                attempts,
            },
            { status: 502 }
        );
    } catch (error) {
        console.error("Failed to upload to Blossom:", error);
        return NextResponse.json(
            { error: "Failed to process upload" },
            { status: 500 }
        );
    }
}
