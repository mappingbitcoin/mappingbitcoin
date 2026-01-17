export interface City {
    name: string;
    lat: number;
    lon: number;
    countryCode: string;
    admin1Code: string;
    population?: number;
    distance_km?: number; // Optional: computed dynamically
}
