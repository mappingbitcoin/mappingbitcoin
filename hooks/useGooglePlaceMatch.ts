import { useEffect, useState } from 'react';
import {EnrichedVenue} from "@/models/Overpass";


export function useGooglePlaceMatch(venue: EnrichedVenue | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [place, setPlace] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setPlace(null)
        if (!venue?.tags?.name || !venue?.lat || !venue?.lon) return;

        const fetchMatchAndReviews = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!venue.tags.name || !venue?.lat || !venue?.lon) {
                    setPlace(null);
                    return;
                }

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
    }, [venue]);

    return { place, loading, error };
}
