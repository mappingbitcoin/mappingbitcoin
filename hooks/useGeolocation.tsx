import { useEffect, useState } from 'react';
import { City } from '@/models/City';
import { findOne } from 'country-codes-list';
import {GeoIPResponse} from "@/models/GEOIpResponse";

interface LocationInfo {
    lat: number;
    lon: number;
    city?: string;
    country?: string;
    currency?: string;
}

interface UseGeolocationOptions {
    handleLocation: (info: LocationInfo) => void | Promise<void>;
    handleFallback?: () => void | Promise<void>;
    enrichLocation?: boolean;
}

export function useGeolocation({
                                   handleLocation,
                                   handleFallback,
                                   enrichLocation = false
                               }: UseGeolocationOptions) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const enrichAndHandle = async (lat: number, lon: number) => {
            let info: LocationInfo = { lat, lon };

            if (enrichLocation) {
                try {
                    const res = await fetch(`/api/nearest-city?lat=${lat}&lon=${lon}`);
                    if (res.ok) {
                        const city: City = await res.json();
                        const countryInfo = findOne('countryCode', city.countryCode);
                        info = {
                            ...info,
                            ...city,
                            currency: countryInfo?.currencyCode
                        };
                    }
                } catch (err) {
                    console.error('Enrichment failed', err);
                }
            }

            if (!cancelled) {
                await handleLocation(info);
                setLoading(false);
            }
        };

        const fallbackToIP = async () => {
            try {
                const res = await fetch('/api/geoip');
                if (!res.ok) throw new Error('Failed to fetch IP-based location');
                const data: GeoIPResponse = await res.json();

                if (data.latitude && data.longitude) {
                    await enrichAndHandle(data.latitude, data.longitude);
                } else {
                    throw new Error('Missing coordinates in IP-based data');
                }
            } catch (err) {
                console.warn('IP fallback failed', err);
                if (!cancelled && handleFallback) await handleFallback();
                setLoading(false);
            }
        };

        const tryGeolocation = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    enrichAndHandle(latitude, longitude);
                },
                () => {
                    fallbackToIP();
                },
                { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
            );
        };

        if ('permissions' in navigator && navigator.permissions?.query) {
            navigator.permissions
                .query({ name: 'geolocation' as PermissionName })
                .then((result) => {
                    if (result.state === 'granted') {
                        tryGeolocation();
                    } else {
                        fallbackToIP();
                    }
                })
                .catch(() => fallbackToIP());
        } else {
            // Safari fallback (no Permissions API)
            tryGeolocation();
        }

        return () => {
            cancelled = true;
        };
    }, []);

    return { loading };
}
