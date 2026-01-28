import { Metadata } from "next";
import MyVerificationsClient from "./MyVerificationsClient";

export const metadata: Metadata = {
    title: "My Verifications | Mapping Bitcoin",
    description: "View and manage your venue verification requests",
};

export default function MyVerificationsPage() {
    return <MyVerificationsClient />;
}
