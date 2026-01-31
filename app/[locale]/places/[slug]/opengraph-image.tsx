import { ImageResponse } from "next/og";
import { env } from "@/lib/Environment";
import { getLocalizedCountryName } from "@/utils/CountryUtils";
import { getSubcategoryLabel, matchPlaceSubcategory } from "@/constants/PlaceCategories";
import { EnrichedVenue } from "@/models/Overpass";
import { Locale } from "@/i18n/types";

export const runtime = "edge";

export const alt = "Place on MappingBitcoin";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

async function getVenueBySlug(slug: string): Promise<EnrichedVenue | null> {
    const base = env.siteUrl || "https://mappingbitcoin.com";
    const url = `${base}/api/places/${slug}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getLogoImageData(): Promise<ArrayBuffer | null> {
    const base = env.siteUrl || "https://mappingbitcoin.com";
    try {
        const res = await fetch(`${base}/assets/mappingbitcoin-logotipo.png`);
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch {
        return null;
    }
}

export default async function Image({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) {
    const { slug, locale } = await params;
    const [venue, logoData] = await Promise.all([
        getVenueBySlug(slug),
        getLogoImageData(),
    ]);

    const name = venue?.tags?.name || "Bitcoin Merchant";
    const city = venue?.city || "";
    const countryCode = venue?.country || "";
    const countryName = getLocalizedCountryName((locale || "en") as Locale, countryCode) || countryCode;
    const location = [city, countryName].filter(Boolean).join(", ");

    // Get subcategory label
    let subcategoryLabel = "";
    if (venue?.subcategory) {
        const match = matchPlaceSubcategory(venue.subcategory);
        if (match) {
            subcategoryLabel = getSubcategoryLabel((locale || "en") as Locale, match.category, match.subcategory) || venue.subcategory;
        } else {
            subcategoryLabel = venue.subcategory;
        }
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#0a0a0f",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background gradient effect */}
                <div
                    style={{
                        position: "absolute",
                        top: -200,
                        right: -200,
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(247,147,26,0.15) 0%, transparent 70%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -300,
                        left: -200,
                        width: 800,
                        height: 800,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(247,147,26,0.08) 0%, transparent 70%)",
                    }}
                />

                {/* Content container */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        padding: "60px 80px",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Top section - Logo */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        {logoData ? (
                            // eslint-disable-next-line @next/next/no-img-element


                            <img
                                src={`${env.siteUrl || "https://mappingbitcoin.com"}/assets/mappingbitcoin-logotipo.png`}
                                alt="MappingBitcoin"
                                width={54}
                                height={50}
                                style={{ width: 54, height: 50 }}
                            />
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 50,
                                    height: 50,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #f7931a 0%, #ff9500 100%)",
                                }}
                            >
                                <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>₿</span>
                            </div>
                        )}
                        <span
                            style={{
                                fontSize: 28,
                                fontWeight: 600,
                                color: "#ffffff",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            MappingBitcoin
                        </span>
                    </div>

                    {/* Middle section - Place info */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                        }}
                    >
                        {/* Subcategory badge */}
                        {subcategoryLabel && (
                            <div
                                style={{
                                    display: "flex",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 500,
                                        color: "#f7931a",
                                        textTransform: "uppercase",
                                        letterSpacing: "2px",
                                        background: "rgba(247,147,26,0.15)",
                                        padding: "8px 20px",
                                        borderRadius: 8,
                                        border: "1px solid rgba(247,147,26,0.3)",
                                    }}
                                >
                                    {subcategoryLabel}
                                </span>
                            </div>
                        )}

                        {/* Place name */}
                        <h1
                            style={{
                                fontSize: name.length > 30 ? 56 : 72,
                                fontWeight: 700,
                                color: "#ffffff",
                                margin: 0,
                                lineHeight: 1.1,
                                letterSpacing: "-2px",
                                maxWidth: "90%",
                            }}
                        >
                            {name}
                        </h1>

                        {/* Location */}
                        {location && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                {/* Location pin icon */}
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path
                                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                        fill="rgba(255,255,255,0.6)"
                                    />
                                </svg>
                                <span
                                    style={{
                                        fontSize: 28,
                                        color: "rgba(255,255,255,0.7)",
                                        fontWeight: 400,
                                    }}
                                >
                                    {location}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom section - Bitcoin accepted badge */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "rgba(34, 197, 94, 0.15)",
                                padding: "12px 24px",
                                borderRadius: 12,
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                    fill="#22c55e"
                                />
                            </svg>
                            <span
                                style={{
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: "#22c55e",
                                }}
                            >
                                Bitcoin Accepted Here
                            </span>
                        </div>

                        {/* URL hint */}
                        <span
                            style={{
                                fontSize: 18,
                                color: "rgba(255,255,255,0.4)",
                                marginLeft: "auto",
                            }}
                        >
                            mappingbitcoin.com
                        </span>
                    </div>
                </div>

                {/* Bottom accent line */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        background: "linear-gradient(90deg, #f7931a 0%, #ff9500 50%, #f7931a 100%)",
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
