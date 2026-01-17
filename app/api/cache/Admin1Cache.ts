import path from "path";
import fs from "fs/promises";

const ADMIN1_FILE = path.resolve(process.cwd(), "data", "admin1CodesASCII.txt");
let _map: Map<string, string> | null = null;

// Load the file once at startup
async function loadAdmin1Cache() {
    if (_map) return _map;
    _map = new Map<string, string>()
    const raw = await fs.readFile(ADMIN1_FILE, "utf8");
    for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        const [code, name] = line.split("\t");
        if (code && name) _map.set(code.trim(), name.trim());
    }
    return _map
}

/**
 * Gets the admin1 name (e.g. state/province) from its code.
 * @param countryCode The ISO country code (e.g. "US")
 * @param admin1Code The admin1 numeric or string code (e.g. "CA" or "06")
 */
export async function getAdmin1Name(countryCode: string, admin1Code: string): Promise<string | undefined> {
    return (await loadAdmin1Cache()).get(`${countryCode}.${admin1Code}`);
}
