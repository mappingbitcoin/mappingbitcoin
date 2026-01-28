import { escape } from "lodash";
import { VenueForm } from "@/models/VenueForm";
import {PLACE_TO_OSM_TAG_KEY} from "@/constants/PlaceOsmDictionary";
import {PLACE_SUBTYPE_MAP, PlaceCategory} from "@/constants/PlaceCategories";
import {EnrichedVenue} from "@/models/Overpass";
import {Locale} from "@/i18n/types";
import addressFormatter from "@fragaria/address-formatter";
import {getLocalizedCountryName} from "@/utils/CountryUtils";

export function buildTagsFromForm(form: VenueForm): Record<string, string> {
    const tags: Record<string, string> = {};

    if (form.role && form.role !== '')
        tags["note:submitted_by_role"] = form.role;

    // Type from subcategory
    if (form.subcategory !== '') {
        const typeKey = PLACE_TO_OSM_TAG_KEY[form.subcategory as (typeof PLACE_SUBTYPE_MAP)[PlaceCategory][number]];
        if (typeKey) {
            tags[typeKey] = form.subcategory;
        }
    }

    if (form.name?.trim()) {
        tags.name = form.name.trim();
    }

    // Add custom category
    tags.category = form.category;

    // Address
    Object.entries(form.address).forEach(([key, value]) => {
        if (value?.trim()) tags[`addr:${key}`] = value.trim();
    });

    // Description field
    if (form.about?.trim()) tags.description = escape(form.about); // may override

    // Note field
    if (form.notes?.trim()) tags.note = escape(form.notes);

    // Google PlaceId if any
    if (form.placeId?.trim()) tags['google:place_id'] = escape(form.placeId);

    // Payment
    Object.entries(form.payment).forEach(([key, val]) => {
        if (val) {
            if (key === "onchain" || key === "lightning") {
                tags[`payment:${key}`] = "yes";
                tags["payment:bitcoin"] = "yes";
                tags["currency:XBT"] = "yes";
            } else {
                tags[`payment:${key}`] = "yes";
            }
        }
    });

    // Contact
    Object.entries(form.contact).forEach(([key, value]) => {
        if (value?.trim()) tags[`contact:${key}`] = escape(value);
    });

    // Opening hours
    if (form.opening_hours?.trim()) tags.opening_hours = escape(form.opening_hours);

    // Additional tags
    Object.entries(form.additionalTags || {}).forEach(([key, value]) => {
        if (!value?.trim()) return;
        value.split(";").map((v) => v.trim()).filter(Boolean).forEach((entry) => {
            tags[key] = tags[key] ? `${tags[key]};${entry}` : entry;
        });
    });

    // Source
    tags.source = "MappingBitcoin.com user submission";

    return tags;
}

export function buildOsmChangeXML(lat: number, lon: number, tags: Record<string, string>): string {
    const tagXml = Object.entries(tags)
        .map(([k, v]) => `<tag k="${k}" v="${v}" />`)
        .join("\n        ");

    return `<?xml version="1.0" encoding="UTF-8"?>
                <osmChange version="0.6" generator="mappingbitcoin.com">
                  <create>
                    <node id="-1" lat="${lat}" lon="${lon}" changeset="CHANGESET_ID">
                        ${tagXml}
                    </node>
                  </create>
                </osmChange>`;
}

export async function openOsmChangeset(token: string): Promise<string> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
            <osm>
              <changeset>
                <tag k="created_by" v="mappingbitcoin.com" />
                <tag k="comment" v="Venue submitted from mappingbitcoin.com" />
              </changeset>
            </osm>`;

    const res = await fetch("https://api.openstreetmap.org/api/0.6/changeset/create", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/xml",
        },
        body,
    });

    if (!res.ok) throw new Error(`Failed to open changeset, ${await res.text()}`);
    return await res.text();
}

export async function uploadOsmNode(changesetId: string, xml: string, token: string) {
    const updatedXml = xml.replace("CHANGESET_ID", changesetId);

    const res = await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/xml",
        },
        body: updatedXml,
    });

    if (!res.ok) throw new Error(`Failed to upload node, ${await res.text()}`);
    return await res.text();
}

export async function closeOsmChangeset(changesetId: string, token: string) {
    await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export async function fetchOsmNode(nodeId: number): Promise<{ version: number; lat: number; lon: number; tags: Record<string, string> }> {
    const res = await fetch(`https://api.openstreetmap.org/api/0.6/node/${nodeId}.json`);
    if (!res.ok) throw new Error(`Failed to fetch node ${nodeId}: ${await res.text()}`);

    const data = await res.json();
    const node = data.elements[0];

    return {
        version: node.version,
        lat: node.lat,
        lon: node.lon,
        tags: node.tags || {}
    };
}

export function buildOsmModifyXML(
    nodeId: number,
    version: number,
    lat: number,
    lon: number,
    tags: Record<string, string>
): string {
    const tagXml = Object.entries(tags)
        .map(([k, v]) => `<tag k="${k}" v="${v}" />`)
        .join("\n        ");

    return `<?xml version="1.0" encoding="UTF-8"?>
                <osmChange version="0.6" generator="mappingbitcoin.com">
                  <modify>
                    <node id="${nodeId}" version="${version}" lat="${lat}" lon="${lon}" changeset="CHANGESET_ID">
                        ${tagXml}
                    </node>
                  </modify>
                </osmChange>`;
}

export async function openOsmChangesetForEdit(token: string): Promise<string> {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
            <osm>
              <changeset>
                <tag k="created_by" v="mappingbitcoin.com" />
                <tag k="comment" v="Venue edited from mappingbitcoin.com" />
              </changeset>
            </osm>`;

    const res = await fetch("https://api.openstreetmap.org/api/0.6/changeset/create", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/xml",
        },
        body,
    });

    if (!res.ok) throw new Error(`Failed to open changeset, ${await res.text()}`);
    return await res.text();
}

export function parseVenue(locale: Locale, venue: EnrichedVenue) {

    if (!venue.tags) return {
        formattedAddress: "",
        paymentMethods: {},
        contact: {},
        name: "",
        address: {},
        openingHours: "",
        source: "",
        description: "",
        descriptionsByLocale: {},
        note: "",
        notesByLocale: {},
        specialTags: {},
        amenitiesTags: {}
    }
    return {
        ...parseTags(venue.tags),
        formattedAddress: addressFormatter
            .format({
                street: venue.tags["addr:street"],
                housenumber: venue.tags["addr:housenumber"],
                district: venue.tags["addr:district"],
                subdistrict: venue.tags["addr:subdistrict"],
                city: venue.city,
                state: venue.state,
                province: venue.tags["addr:province"],
                postcode: venue.tags["addr:postcode"],
                countryCode: venue.country,
                country: getLocalizedCountryName(locale, venue.country)
            }, { output: "array" })
            .join(", ")
    }
}

/**
 * Format OSM opening hours into a more human-readable format
 * Handles various OSM opening_hours formats:
 * - 24/7
 * - Mo-Fr 09:00-17:00
 * - Mo-Fr 09:00-12:00,14:00-18:00 (multiple time ranges)
 * - Mo-Fr 09:00-17:00; Sa 10:00-14:00; Su off
 * - sunrise-sunset
 * - Mo-Fr 09:00+ (open-ended)
 * - PH off (public holidays)
 * - "by appointment" comments
 */
export function formatOpeningHours(hours: string | undefined): string | null {
    if (!hours) return null;

    const trimmed = hours.trim();

    // Handle empty string
    if (!trimmed) return null;

    // Handle 24/7 variations
    if (trimmed === "24/7" || trimmed.toLowerCase() === "24/7") {
        return "Open 24 hours";
    }

    // Handle "open" or "closed"
    if (trimmed.toLowerCase() === "open") return "Open";
    if (trimmed.toLowerCase() === "closed") return "Closed";

    // Day name mappings (OSM format to readable)
    const dayMap: Record<string, string> = {
        'Mo': 'Mon',
        'Tu': 'Tue',
        'We': 'Wed',
        'Th': 'Thu',
        'Fr': 'Fri',
        'Sa': 'Sat',
        'Su': 'Sun',
        'PH': 'Holidays'
    };

    // Common day range patterns for simplification
    const dayRangeMap: Record<string, string> = {
        'Mo-Su': 'Daily',
        'Mo-Fr': 'Weekdays',
        'Sa-Su': 'Weekends',
        'Mo-Sa': 'Mon-Sat',
        'Mo-Th': 'Mon-Thu',
        'Tu-Sa': 'Tue-Sat',
        'Tu-Fr': 'Tue-Fri',
    };

    // Format time from 24h to 12h format
    const formatTime = (time: string): string => {
        // Handle special cases
        if (time === '00:00' || time === '24:00') return '12am';
        if (time === '12:00') return '12pm';

        const match = time.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return time;

        let hour = parseInt(match[1], 10);
        const minutes = match[2];
        const period = hour >= 12 ? 'pm' : 'am';

        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;

        return minutes === '00' ? `${hour}${period}` : `${hour}:${minutes}${period}`;
    };

    // Replace OSM day codes with readable names
    const replaceDayCodes = (str: string): string => {
        let result = str;

        // First replace day ranges with friendly names
        Object.entries(dayRangeMap).forEach(([osm, readable]) => {
            result = result.replace(new RegExp(`\\b${osm}\\b`, 'g'), readable);
        });

        // Then replace individual day codes
        Object.entries(dayMap).forEach(([osm, readable]) => {
            result = result.replace(new RegExp(`\\b${osm}\\b`, 'g'), readable);
        });

        return result;
    };

    // Format a time range like "09:00-17:00" or "09:00-12:00,14:00-18:00"
    const formatTimeRange = (timeStr: string): string => {
        // Handle multiple time ranges separated by comma
        if (timeStr.includes(',')) {
            return timeStr.split(',').map(t => formatTimeRange(t.trim())).join(', ');
        }

        // Handle open-ended times like "09:00+"
        if (timeStr.endsWith('+')) {
            const startTime = timeStr.slice(0, -1);
            return `from ${formatTime(startTime)}`;
        }

        // Handle sunrise/sunset
        if (timeStr.includes('sunrise') || timeStr.includes('sunset')) {
            return timeStr.replace('sunrise', 'sunrise').replace('sunset', 'sunset');
        }

        // Handle regular time range
        const timeMatch = timeStr.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
        if (timeMatch) {
            return `${formatTime(timeMatch[1])}-${formatTime(timeMatch[2])}`;
        }

        // Handle single time
        const singleTimeMatch = timeStr.match(/^(\d{1,2}:\d{2})$/);
        if (singleTimeMatch) {
            return formatTime(singleTimeMatch[1]);
        }

        return timeStr;
    };

    // Format a single rule like "Mo-Fr 09:00-17:00" or "Sa off"
    const formatRule = (rule: string): string => {
        const trimmedRule = rule.trim();

        // Handle "off" rules
        if (trimmedRule.toLowerCase().endsWith(' off') || trimmedRule.toLowerCase() === 'off') {
            const days = trimmedRule.toLowerCase().replace(' off', '').replace('off', '').trim();
            if (days) {
                return `${replaceDayCodes(days)} closed`;
            }
            return 'Closed';
        }

        // Handle quoted comments like "by appointment"
        const commentMatch = trimmedRule.match(/"([^"]+)"/);
        const comment = commentMatch ? ` (${commentMatch[1]})` : '';
        const withoutComment = trimmedRule.replace(/"[^"]+"/g, '').trim();

        // Handle pattern: days + time range
        // Match: Mo-Fr 09:00-17:00 or Mo,We,Fr 09:00-17:00 or Mo-Fr 09:00-12:00,14:00-18:00
        const dayTimeMatch = withoutComment.match(/^([A-Za-z,\-]+)\s+(.+)$/);
        if (dayTimeMatch) {
            const days = dayTimeMatch[1];
            const times = dayTimeMatch[2];

            const formattedDays = replaceDayCodes(days);
            const formattedTimes = formatTimeRange(times);

            return `${formattedDays} ${formattedTimes}${comment}`;
        }

        // Handle just times without days (applies to all days)
        const justTimeMatch = withoutComment.match(/^(\d{1,2}:\d{2}[-,\d:]+)$/);
        if (justTimeMatch) {
            return formatTimeRange(justTimeMatch[1]) + comment;
        }

        // Handle just days without times
        const justDaysMatch = withoutComment.match(/^[A-Za-z,\-]+$/);
        if (justDaysMatch) {
            return replaceDayCodes(withoutComment) + comment;
        }

        // Fallback: just replace day codes and times
        let result = replaceDayCodes(withoutComment);
        result = result.replace(/(\d{1,2}):(\d{2})/g, (match) => formatTime(match));
        return result + comment;
    };

    try {
        // Split by semicolon for multiple rules
        const rules = trimmed.split(';').map(r => r.trim()).filter(r => r);

        if (rules.length === 0) return null;

        // Format each rule
        const formattedRules = rules.map(formatRule);

        // Join with separator
        if (formattedRules.length === 1) {
            return formattedRules[0];
        }

        // For multiple rules, use bullet separator
        return formattedRules.join(' · ');
    } catch {
        // If parsing fails, do basic replacements
        let result = replaceDayCodes(trimmed);
        result = result.replace(/(\d{1,2}):(\d{2})/g, (match) => formatTime(match));
        return result;
    }
}

export function parseTags(tags: Record<string, string>): {
    paymentMethods: Record<string, string>,
    contact: Record<string, string>,
    name: string,
    address: Record<string, string>,
    openingHours: string,
    source: string,
    description: string,
    descriptionsByLocale: Record<string, string>,
    note: string,
    notesByLocale: Record<string, string>,
    specialTags: Record<string, string>,
    amenitiesTags: Record<string, string>
} {
    if (!tags) {
        return {
            paymentMethods: {},
            contact: {},
            name: "",
            address: {},
            openingHours: "",
            source: "",
            description: "",
            descriptionsByLocale: {},
            note: "",
            notesByLocale: {},
            specialTags: {},
            amenitiesTags: {}
        }
    }

    const tagEntries = Object.entries(tags)
    const paymentMethods = Object.fromEntries(
        tagEntries
            .filter(([k]) => k.startsWith("payment:"))
            .map(([key, value]) => [key.replace("payment:", ""), value])
    );

    // Add 'onchain' if 'currency:XBT' exists and is truthy
    if (tags["currency:XBT"]?.toLowerCase() === "yes") {
        paymentMethods["onchain"] = "yes";
    }

    const descriptionsByLocale = Object.fromEntries(
        tagEntries
            .filter(([k]) => k.startsWith("description:"))
            .map(([key, value]) => [key.split(":")[1], value])
    );

    const notesByLocale = Object.fromEntries(
        tagEntries
            .filter(([k]) => k.startsWith("note:"))
            .map(([key, value]) => [key.split(":")[1], value])
    );

    const specialTags: Record<string, string> = {}

    if (tags['cuisine']) specialTags.cuisine = tags['cuisine']
    if (tags['operator']) specialTags.operator = tags['operator']
    if (tags['leisure']) specialTags.leisure = tags['leisure']
    if (tags['office']) specialTags.office = tags['office']

    const amenitiesTags: Record<string, string> = {}
    if (tags['internet_access']) amenitiesTags.internet_access = tags['internet_access']
    if (tags['wheelchair']) amenitiesTags.wheelchair = tags['wheelchair']
    if (tags['lgbt'] || tags['lgbtq']) amenitiesTags.lgbt = tags['lgbt'] ?? tags['lgbtq']
    if (tags['outdoor_seating']) amenitiesTags.outdoor_seating = tags['outdoor_seating']
    if (tags['indoor_seating']) amenitiesTags.indoor_seating = tags['indoor_seating']
    if (tags['takeaway']) amenitiesTags.takeaway = tags['takeaway']
    if (tags['smoking']) amenitiesTags.smoking = tags['smoking']
    if (tags['reservation']) amenitiesTags.reservation = tags['reservation']
    if (tags['air_conditioning']) amenitiesTags.air_conditioning = tags['air_conditioning']
    if (tags['drive_through']) amenitiesTags.drive_through = tags['drive_through']

    // Build contact object from contact: prefixed tags
    const contact: Record<string, string> = Object.fromEntries(
        tagEntries.filter(([k]) => k.startsWith("contact:")).map(([key, value]) => [key.replace("contact:", ""), value])
    );

    // Also check for direct website, email, phone tags (fallback if not in contact:)
    if (!contact.website && tags['website']) contact.website = tags['website'];
    if (!contact.email && tags['email']) contact.email = tags['email'];
    if (!contact.phone && tags['phone']) contact.phone = tags['phone'];

    return {
        paymentMethods,
        contact,
        address: Object.fromEntries(
            tagEntries
                .filter(([k]) => k.startsWith("addr:"))
                .map(([key, value]) => [key.replace("addr:", ""), value])
        ),
        name: tags?.name,
        openingHours: tags?.opening_hours,
        source: tags?.source,
        description: tags["description"] || "",
        descriptionsByLocale,
        note: tags["note"] || "",
        notesByLocale,
        specialTags,
        amenitiesTags
    }
}

