"use client";

import React, { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { CloudUploadIcon } from "@/assets/icons/ui";

interface AssetUploaderProps {
    onUploadComplete: (data: {
        filename: string;
        storageKey: string;
        mimeType: string;
        size: number;
    }) => void;
    onError: (error: string) => void;
}

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function AssetUploader({ onUploadComplete, onError }: AssetUploaderProps) {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);

    const uploadFile = useCallback(async (file: File) => {
        if (!authToken) {
            onError(t("uploader.authRequired"));
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            onError(t("uploader.invalidType", { type: file.type }));
            return;
        }

        if (file.size > MAX_SIZE) {
            onError(t("uploader.fileTooLarge"));
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            // Get signed upload URL
            const signedUrlResponse = await fetch("/api/storage/signed-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    assetType: "marketing",
                    contentType: file.type,
                    filename: file.name,
                }),
            });

            if (!signedUrlResponse.ok) {
                const data = await signedUrlResponse.json();
                throw new Error(data.error || "Failed to get upload URL");
            }

            const { uploadUrl, key } = await signedUrlResponse.json();

            // Upload file directly to storage
            const xhr = new XMLHttpRequest();

            await new Promise<void>((resolve, reject) => {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Upload failed"));

                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.send(file);
            });

            onUploadComplete({
                filename: file.name,
                storageKey: key,
                mimeType: file.type,
                size: file.size,
            });
        } catch (err) {
            onError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [authToken, onUploadComplete, onError, t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    }, [uploadFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${dragOver ? "border-primary bg-primary/10" : "border-border-light hover:border-primary/50"}
                ${uploading ? "pointer-events-none opacity-75" : ""}
            `}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <input
                type="file"
                onChange={handleFileChange}
                accept={ALLOWED_TYPES.join(",")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
            />

            {uploading ? (
                <div className="space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
                    <div>
                        <p className="text-white">{t("common.uploading")}</p>
                        <div className="mt-2 h-2 bg-surface-light rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-text-light mt-1">{progress}%</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <CloudUploadIcon className="w-12 h-12 text-text-light mx-auto" />
                    <div>
                        <p className="text-white">{t("uploader.dropHere")}</p>
                        <p className="text-sm text-text-light mt-1">
                            {t("uploader.allowedTypes")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
