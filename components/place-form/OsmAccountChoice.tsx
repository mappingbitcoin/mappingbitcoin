"use client";

import { useTranslations } from "next-intl";
import { OSMIcon } from "@/assets/icons/social";
import { CheckmarkIcon } from "@/assets/icons";

interface OsmAccountChoiceProps {
    mode: "mappingbitcoin" | "personal";
    onModeChange: (mode: "mappingbitcoin" | "personal") => void;
    nostrAttribution: boolean;
    onNostrAttributionChange: (value: boolean) => void;
    osmUserName: string | null;
    nostrProfileName: string | null;
    isNostrLoggedIn: boolean;
    onNostrLoginClick: () => void;
}

export default function OsmAccountChoice({
    mode,
    onModeChange,
    nostrAttribution,
    onNostrAttributionChange,
    osmUserName,
    nostrProfileName,
    isNostrLoggedIn,
    onNostrLoginClick,
}: OsmAccountChoiceProps) {
    const t = useTranslations("venues.form");

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">{t("osmAccountChoice.title")}</h3>

            {/* Account choice radio cards */}
            <div className="grid grid-cols-2 gap-2">
                {/* MappingBitcoin account */}
                <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        mode === "mappingbitcoin"
                            ? "border-accent bg-accent/10"
                            : "border-border-light hover:border-accent/40"
                    }`}
                >
                    <input
                        type="radio"
                        name="osmAccountMode"
                        value="mappingbitcoin"
                        checked={mode === "mappingbitcoin"}
                        onChange={() => onModeChange("mappingbitcoin")}
                        className="sr-only"
                    />
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        mode === "mappingbitcoin" ? "border-accent" : "border-border-light"
                    }`}>
                        {mode === "mappingbitcoin" && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-white">{t("osmAccountChoice.mappingbitcoin")}</span>
                        <p className="text-xs text-text-light mt-0.5">{t("osmAccountChoice.mappingbitcoinDesc")}</p>
                    </div>
                </label>

                {/* Personal OSM account */}
                <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        mode === "personal"
                            ? "border-accent bg-accent/10"
                            : "border-border-light hover:border-accent/40"
                    }`}
                >
                    <input
                        type="radio"
                        name="osmAccountMode"
                        value="personal"
                        checked={mode === "personal"}
                        onChange={() => onModeChange("personal")}
                        className="sr-only"
                    />
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        mode === "personal" ? "border-accent" : "border-border-light"
                    }`}>
                        {mode === "personal" && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div className="flex items-start gap-1.5">
                        <OSMIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-white">{t("osmAccountChoice.personal")}</span>
                            <p className="text-xs text-text-light mt-0.5">
                                {osmUserName
                                    ? t("osmAccountChoice.personalLoggedIn", { name: osmUserName })
                                    : t("osmAccountChoice.personalDesc")
                                }
                            </p>
                        </div>
                    </div>
                </label>
            </div>

            {/* Nostr attribution */}
            <div className="flex items-center gap-2 pl-1">
                {isNostrLoggedIn ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={nostrAttribution}
                            onChange={(e) => onNostrAttributionChange(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            nostrAttribution ? "bg-accent border-accent" : "border-border-light"
                        }`}>
                            {nostrAttribution && <CheckmarkIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-xs text-text-light">
                            {t("nostrAttribution.label")}
                            {nostrProfileName && (
                                <span className="text-white ml-1">@{nostrProfileName}</span>
                            )}
                        </span>
                    </label>
                ) : (
                    <p className="text-xs text-text-light">
                        {t("nostrAttribution.loginPrompt")}{" "}
                        <button
                            type="button"
                            onClick={onNostrLoginClick}
                            className="text-accent hover:underline"
                        >
                            {t("nostrAttribution.loginLink")}
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
