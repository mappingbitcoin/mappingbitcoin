"use client";

import { createContext, useContext, useEffect, useState } from "react";

type OsmUser = {
    id: string;
    display_name: string;
    image_url?: string;
};

type OsmAuthContextType = {
    user: OsmUser | null;
    loading: boolean;
};

const OsmAuthContext = createContext<OsmAuthContextType>({
    user: null,
    loading: true,
});

export const OsmAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<OsmUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/me")
            .then((res) => {
                if (!res.ok) throw new Error("Not logged in");
                return res.json();
            })
            .then((data) => {
                setUser(data);
            })
            .catch(() => {
                setUser(null);
            }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <OsmAuthContext.Provider value={{ user, loading }}>
            {children}
        </OsmAuthContext.Provider>
    );
};

export const useOsmUser = () => useContext(OsmAuthContext);
