import { Metadata } from "next";
import StatsClient from "./StatsClient";

export const metadata: Metadata = {
    title: "Bitcoin Merchant Statistics | MappingBitcoin",
    description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends over time.",
    openGraph: {
        title: "Bitcoin Merchant Statistics | MappingBitcoin",
        description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants worldwide.",
    },
};

export default function StatsPage() {
    return <StatsClient />;
}
