import { useEffect, useState, useRef } from 'react';
import {EnrichedVenue} from "@/models/Overpass";


export function useGooglePlaceMatch(venue: EnrichedVenue | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [place, setPlace] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const lastFetchedId = useRef<number | null>(null);

    useEffect(() => {
        if (!venue?.id || !venue?.tags?.name || !venue?.lat || !venue?.lon) {
            setPlace(null);
            return;
        }

        // Skip if we already fetched for this venue
        if (lastFetchedId.current === venue.id) {
            return;
        }

        const fetchMatchAndReviews = async () => {
            lastFetchedId.current = venue.id;
            setLoading(true);
            setError(null);

            try {
                const placeId = venue.tags['google:place_id'] ?? venue.placeId

                const response = await fetch(`/api/map/places?id=${venue.id}&placeId=${placeId}&name=${encodeURIComponent(venue.tags.name)}&lat=${venue.lat}&lon=${venue.lon}&country=${venue.country}`);
                const data = await response.json();

                if (response.ok && data) {
                    setPlace(data);
                    return;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                setError(err);
                setPlace(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMatchAndReviews();
    }, [venue?.id, venue?.tags, venue?.lat, venue?.lon, venue?.placeId, venue?.country]);

    return { place, loading, error };
}
