import { Metadata } from "next";
import VerifiedPlacesClient from "./VerifiedPlacesClient";

export const metadata: Metadata = {
    title: "Verified Places | Mapping Bitcoin",
    description: "Browse all verified Bitcoin-accepting businesses. Each place has been verified by its owner through email or domain verification.",
};

export default function VerifiedPlacesPage() {
    return <VerifiedPlacesClient />;
}
