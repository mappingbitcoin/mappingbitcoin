export interface MaxMindCityRecord {
    country?: {
        iso_code?: string;
        names?: {
            [key: string]: string;
        };
    };
    subdivisions?: Array<{
        names?: {
            [key: string]: string;
        };
    }>;
    city?: {
        names?: {
            [key: string]: string;
        };
    };
    location?: {
        latitude?: number;
        longitude?: number;
    };
}

export interface GeoIPResponse {
    country: string | null;
    countryName: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
}
