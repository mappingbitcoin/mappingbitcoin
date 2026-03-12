import {NextRequest, NextResponse} from 'next/server';
import { open } from 'maxmind';
import path from "path";
import {GeoIPResponse, MaxMindCityRecord} from "@/models/GEOIpResponse";
import { checkRateLimit, getClientIP } from "@/lib/rateLimit";

const DB_PATH = path.resolve(process.cwd(), 'data', 'GeoLite2-City.mmdb');
const geoipRateLimit = { maxRequests: 20, windowMs: 60000 };

let readerPromise: ReturnType<typeof open> | null = null;

async function getReader() {
    if (!readerPromise) {
        readerPromise = open(DB_PATH);
    }
    return readerPromise;
}

export async function GET(req: NextRequest) {
    const ip = getClientIP(req);

    // Rate limit by client IP
    const rateLimitResult = checkRateLimit(`geoip:${ip}`, geoipRateLimit);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
        );
    }

    // Handle localhost/loopback IPs - return default 0,0 coordinates
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'localhost') {
        const location: GeoIPResponse = {
            country: null,
            countryName: null,
            region: null,
            city: null,
            latitude: 0,
            longitude: 0,
        };
        return NextResponse.json(location);
    }

    try {
        const reader = await getReader();
        const result: MaxMindCityRecord | null = reader.get(ip) as MaxMindCityRecord | null ;

        if (!result || typeof result !== 'object') {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        const location: GeoIPResponse = {
            country: result?.country?.iso_code || null,
            countryName: result?.country?.names?.en || null,
            region: result?.subdivisions?.[0]?.names?.en || null,
            city: result?.city?.names?.en || null,
            latitude: result?.location?.latitude || null,
            longitude: result?.location?.longitude || null,
        };

        return NextResponse.json(location);
    } catch (err) {
        console.error('GeoIP lookup error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
