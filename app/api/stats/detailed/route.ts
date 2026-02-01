import { NextResponse } from "next/server";
import { getVenueCache } from "@/app/api/cache/VenueCache";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600; // Cache for 1 hour

interface MonthlyData {
    month: string;
    count: number;
    cumulative: number;
}

export async function GET() {
    try {
        const venues = await getVenueCache();

        // Count venues by country
        const countryMap: Record<string, number> = {};
        const categoryMap: Record<string, number> = {};
        const monthlyAddedMap: Record<string, number> = {};

        for (const venue of venues) {
            // By country
            const country = venue.country || "Unknown";
            countryMap[country] = (countryMap[country] || 0) + 1;

            // By category
            const category = venue.category || "Other";
            categoryMap[category] = (categoryMap[category] || 0) + 1;

            // By month added (using enrichedAt as proxy for when venue was added)
            if (venue.enrichedAt) {
                const date = new Date(venue.enrichedAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                monthlyAddedMap[monthKey] = (monthlyAddedMap[monthKey] || 0) + 1;
            }
        }

        // Sort countries by count and take top 10
        const topCountries = Object.entries(countryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Sort categories by count and take top 10
        const topCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Generate monthly growth data (last 12 months)
        const now = new Date();
        const monthlyGrowth: MonthlyData[] = [];
        let cumulative = 0;

        // Get all months sorted
        const sortedMonths = Object.keys(monthlyAddedMap).sort();

        // Calculate cumulative up to 12 months ago
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const twelveMonthsAgoKey = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

        for (const month of sortedMonths) {
            if (month < twelveMonthsAgoKey) {
                cumulative += monthlyAddedMap[month];
            }
        }

        // Generate last 12 months data
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            const count = monthlyAddedMap[monthKey] || 0;
            cumulative += count;

            monthlyGrowth.push({
                month: monthName,
                count,
                cumulative,
            });
        }

        // Get verified venues stats from database
        let verifiedCount = 0;
        let verifiedMonthlyGrowth: MonthlyData[] = [];

        // Initialize with empty data first
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            verifiedMonthlyGrowth.push({
                month: monthName,
                count: 0,
                cumulative: 0,
            });
        }

        try {
            // Total verified count
            const countResult = await prisma.placeVerification.count({
                where: { status: "VERIFIED" },
            });
            verifiedCount = countResult ?? 0;

            // Get all verified entries with dates
            const verifiedEntries = await prisma.placeVerification.findMany({
                where: {
                    status: "VERIFIED",
                    verifiedAt: { not: null },
                },
                select: {
                    verifiedAt: true,
                },
            });

            if (verifiedEntries && verifiedEntries.length > 0) {
                // Process verified monthly data
                const verifiedMonthlyMap: Record<string, number> = {};
                for (const entry of verifiedEntries) {
                    if (entry.verifiedAt) {
                        const date = new Date(entry.verifiedAt);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                        verifiedMonthlyMap[monthKey] = (verifiedMonthlyMap[monthKey] || 0) + 1;
                    }
                }

                // Generate last 12 months verified data
                let verifiedCumulative = 0;
                const sortedVerifiedMonths = Object.keys(verifiedMonthlyMap).sort();

                for (const month of sortedVerifiedMonths) {
                    if (month < twelveMonthsAgoKey) {
                        verifiedCumulative += verifiedMonthlyMap[month];
                    }
                }

                verifiedMonthlyGrowth = [];
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    const count = verifiedMonthlyMap[monthKey] || 0;
                    verifiedCumulative += count;

                    verifiedMonthlyGrowth.push({
                        month: monthName,
                        count,
                        cumulative: verifiedCumulative,
                    });
                }
            }
        } catch (dbError) {
            console.error("Error fetching verified stats:", dbError);
            // Keep the empty initialized data
        }

        return NextResponse.json({
            totalMerchants: venues.length,
            totalCountries: Object.keys(countryMap).length,
            totalCategories: Object.keys(categoryMap).length,
            verifiedCount,
            topCountries,
            topCategories,
            monthlyGrowth,
            verifiedMonthlyGrowth,
        });
    } catch (error) {
        console.error("Error fetching detailed stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
