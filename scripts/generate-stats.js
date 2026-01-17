const path = require('path');
const fs = require('fs');

const VENUES_FILE = path.resolve(__dirname, '..', 'data', 'EnrichedVenues.json');
const STATS_OUTPUT_FILE = path.resolve(__dirname, '..', 'public', 'data', 'stats.json');

const countries = require('i18n-iso-countries');
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const CONTINENT_MAP = {
    'US': 'North America', 'CA': 'North America', 'MX': 'North America',
    'GT': 'North America', 'BZ': 'North America', 'SV': 'North America',
    'HN': 'North America', 'NI': 'North America', 'CR': 'North America',
    'PA': 'North America', 'CU': 'North America', 'JM': 'North America',
    'HT': 'North America', 'DO': 'North America', 'PR': 'North America',
    'TT': 'North America', 'BB': 'North America', 'BS': 'North America',
    'LC': 'North America', 'GD': 'North America', 'VC': 'North America',
    'AG': 'North America', 'DM': 'North America', 'KN': 'North America',
    'AW': 'North America', 'CW': 'North America', 'SX': 'North America',
    'BM': 'North America', 'KY': 'North America', 'VI': 'North America',
    'VG': 'North America', 'AI': 'North America', 'MS': 'North America',
    'TC': 'North America', 'GL': 'North America',
    'BR': 'South America', 'AR': 'South America', 'CO': 'South America',
    'PE': 'South America', 'VE': 'South America', 'CL': 'South America',
    'EC': 'South America', 'BO': 'South America', 'PY': 'South America',
    'UY': 'South America', 'GY': 'South America', 'SR': 'South America',
    'GF': 'South America', 'FK': 'South America',
    'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe',
    'ES': 'Europe', 'PT': 'Europe', 'NL': 'Europe', 'BE': 'Europe',
    'AT': 'Europe', 'CH': 'Europe', 'PL': 'Europe', 'CZ': 'Europe',
    'SE': 'Europe', 'NO': 'Europe', 'DK': 'Europe', 'FI': 'Europe',
    'IE': 'Europe', 'GR': 'Europe', 'HU': 'Europe', 'RO': 'Europe',
    'BG': 'Europe', 'HR': 'Europe', 'SK': 'Europe', 'SI': 'Europe',
    'RS': 'Europe', 'UA': 'Europe', 'BY': 'Europe', 'LT': 'Europe',
    'LV': 'Europe', 'EE': 'Europe', 'IS': 'Europe', 'LU': 'Europe',
    'MT': 'Europe', 'CY': 'Europe', 'AL': 'Europe', 'MK': 'Europe',
    'BA': 'Europe', 'ME': 'Europe', 'XK': 'Europe', 'MD': 'Europe',
    'MC': 'Europe', 'LI': 'Europe', 'AD': 'Europe', 'SM': 'Europe',
    'VA': 'Europe', 'GI': 'Europe', 'IM': 'Europe', 'JE': 'Europe',
    'GG': 'Europe', 'FO': 'Europe', 'AX': 'Europe', 'SJ': 'Europe',
    'CN': 'Asia', 'JP': 'Asia', 'KR': 'Asia', 'IN': 'Asia',
    'ID': 'Asia', 'TH': 'Asia', 'VN': 'Asia', 'PH': 'Asia',
    'MY': 'Asia', 'SG': 'Asia', 'HK': 'Asia', 'TW': 'Asia',
    'PK': 'Asia', 'BD': 'Asia', 'LK': 'Asia', 'NP': 'Asia',
    'MM': 'Asia', 'KH': 'Asia', 'LA': 'Asia', 'MN': 'Asia',
    'KZ': 'Asia', 'UZ': 'Asia', 'TM': 'Asia', 'KG': 'Asia',
    'TJ': 'Asia', 'AF': 'Asia', 'IR': 'Asia', 'IQ': 'Asia',
    'SA': 'Asia', 'AE': 'Asia', 'IL': 'Asia', 'JO': 'Asia',
    'LB': 'Asia', 'SY': 'Asia', 'TR': 'Asia', 'YE': 'Asia',
    'OM': 'Asia', 'KW': 'Asia', 'QA': 'Asia', 'BH': 'Asia',
    'PS': 'Asia', 'GE': 'Asia', 'AM': 'Asia', 'AZ': 'Asia',
    'BN': 'Asia', 'TL': 'Asia', 'MO': 'Asia', 'BT': 'Asia',
    'MV': 'Asia', 'RU': 'Asia',
    'ZA': 'Africa', 'EG': 'Africa', 'NG': 'Africa', 'KE': 'Africa',
    'MA': 'Africa', 'GH': 'Africa', 'TZ': 'Africa', 'ET': 'Africa',
    'UG': 'Africa', 'DZ': 'Africa', 'SD': 'Africa', 'AO': 'Africa',
    'MZ': 'Africa', 'MG': 'Africa', 'CM': 'Africa', 'CI': 'Africa',
    'NE': 'Africa', 'BF': 'Africa', 'ML': 'Africa', 'MW': 'Africa',
    'ZM': 'Africa', 'SN': 'Africa', 'ZW': 'Africa', 'RW': 'Africa',
    'GN': 'Africa', 'BJ': 'Africa', 'TN': 'Africa', 'SS': 'Africa',
    'TD': 'Africa', 'SL': 'Africa', 'LY': 'Africa', 'TG': 'Africa',
    'CF': 'Africa', 'MR': 'Africa', 'ER': 'Africa', 'GM': 'Africa',
    'BW': 'Africa', 'NA': 'Africa', 'GA': 'Africa', 'LS': 'Africa',
    'GW': 'Africa', 'GQ': 'Africa', 'MU': 'Africa', 'SZ': 'Africa',
    'DJ': 'Africa', 'RE': 'Africa', 'KM': 'Africa', 'CV': 'Africa',
    'ST': 'Africa', 'SC': 'Africa', 'SO': 'Africa', 'BI': 'Africa',
    'CG': 'Africa', 'CD': 'Africa', 'LR': 'Africa', 'YT': 'Africa',
    'AU': 'Oceania', 'NZ': 'Oceania', 'PG': 'Oceania', 'FJ': 'Oceania',
    'SB': 'Oceania', 'VU': 'Oceania', 'NC': 'Oceania', 'PF': 'Oceania',
    'WS': 'Oceania', 'GU': 'Oceania', 'KI': 'Oceania', 'FM': 'Oceania',
    'TO': 'Oceania', 'AS': 'Oceania', 'MP': 'Oceania', 'PW': 'Oceania',
    'MH': 'Oceania', 'CK': 'Oceania', 'TV': 'Oceania', 'NR': 'Oceania',
    'NU': 'Oceania', 'TK': 'Oceania', 'WF': 'Oceania', 'NF': 'Oceania',
    'PN': 'Oceania', 'CC': 'Oceania', 'CX': 'Oceania', 'HM': 'Oceania',
};

function getFlagEmoji(countryCode) {
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function getCountrySlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const raw = fs.readFileSync(VENUES_FILE, 'utf8');
const venues = JSON.parse(raw);

const countryCounts = new Map();
const regionCounts = new Map();
const continentsSet = new Set();

for (const venue of venues) {
    const countryCode = venue.country;
    if (!countryCode) continue;
    countryCounts.set(countryCode, (countryCounts.get(countryCode) || 0) + 1);
    const continent = CONTINENT_MAP[countryCode];
    if (continent) {
        regionCounts.set(continent, (regionCounts.get(continent) || 0) + 1);
        continentsSet.add(continent);
    }
}

const regions = Array.from(regionCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

const topCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([code, count]) => {
        const name = countries.getName(code, 'en', { select: 'official' }) || code;
        return { code, name, flag: getFlagEmoji(code), count, slug: getCountrySlug(name) };
    });

const stats = {
    totalVenues: venues.length,
    countries: countryCounts.size,
    continents: continentsSet.size,
    regions,
    topCountries,
    generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(STATS_OUTPUT_FILE), { recursive: true });
fs.writeFileSync(STATS_OUTPUT_FILE, JSON.stringify(stats, null, 2));
console.log('✅ Stats generated:', stats.totalVenues, 'venues,', stats.countries, 'countries,', stats.continents, 'continents');
