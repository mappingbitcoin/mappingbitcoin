// - "24/7" -> all days, 00:00-24:00
// - "off" or "closed" -> no hours
// - "Mo 10:00-" -> open-ended ranges (ends at 24:00)
// - "09:00-15:00" -> applies to all days
// - "PH" -> public holidays support added
// - Supports multiple ranges per day

export type TimeRange = { from: string; to: string }

export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "PH"] as const;
export type Day = typeof DAYS[number];

export type DayHours = {
    day: Day;
    hours: { from: string; to: string }[];
};

export function parseOpeningHours(input: string): DayHours[] {
    input = input.trim();

    if (input === "24/7") {
        return DAYS.map((day) => ({
            day,
            hours: [{ from: "00:00", to: "24:00" }],
        }));
    }

    const result = DAYS.reduce((acc, d) => {
        acc[d] = { day: d, hours: [] };
        return acc;
    }, {} as Record<Day, DayHours>);

    const parts = input.split(";");

    for (const part of parts) {
        const trimmed = part.trim();

        // No day prefix → applies to all days
        const hourOnlyMatch = trimmed.match(/^([0-9]{1,2}:[0-9]{2})\s*-\s*([0-9]{1,2}:[0-9]{2})$/);
        if (hourOnlyMatch) {
            for (const day of DAYS) {
                // Only apply to PH if the string originally contains "PH"
                if (input.includes("PH") || day !== "PH") {
                    result[day].hours.push({ from: hourOnlyMatch[1], to: hourOnlyMatch[2] });
                }
            }
            continue;
        }

        const [daysPart, hoursPartRaw] = trimmed.split(" ");
        const hoursPart = (hoursPartRaw || "").trim();

        const dayMatches = [...daysPart.matchAll(/(PH|[A-Z][a-z]?)(?:-(PH|[A-Z][a-z]?))?/g)];

        const days: Day[] = [];

        for (const match of dayMatches) {
            const from = match[1] as Day;
            const to = match[2] as Day | undefined;

            if (!DAYS.includes(from)) continue;
            if (to && !DAYS.includes(to)) continue;

            if (to) {
                const fromIndex = DAYS.indexOf(from);
                const toIndex = DAYS.indexOf(to);
                for (let i = fromIndex; i <= toIndex; i++) {
                    days.push(DAYS[i]);
                }
            } else {
                days.push(from);
            }
        }

        const ranges = hoursPart.split(",").map((r) => r.trim());

        for (const range of ranges) {
            if (range === "off" || range === "closed") continue;

            const [from, to] = range.split("-");

            const fromTime = from.trim();
            const toTime = to ? to.trim() : "24:00";

            for (const d of days) {
                if (result[d]) {
                    result[d].hours.push({ from: fromTime, to: toTime });
                }
            }
        }
    }

    return Object.values(result).filter((r) => r.hours.length > 0);
}

export function stringifyOpeningHours(dayHours: DayHours[]): string {
    const grouped: Record<string, string[]> = {};
    let phLine: string | null = null;

    for (const { day, hours } of dayHours) {
        const key = hours.map((h) => `${h.from}-${h.to}`).join(",");

        if (day === "PH") {
            // PH will be handled separately
            phLine = `PH ${key}`;
            continue;
        }

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(day);
    }

    const parts = Object.entries(grouped).map(([range, days]) => {
        const dayStr = mergeDays(days);
        return `${dayStr} ${range}`;
    });

    if (phLine) {
        parts.push(phLine); // always put PH at the end
    }

    return parts.join("; ");
}

function mergeDays(days: string[]): string {
    const indices = days.map((d) => DAYS.indexOf(d as Day)).sort((a, b) => a - b);

    const ranges: string[] = [];
    let start = indices[0];
    let end = start;

    for (let i = 1; i < indices.length; i++) {
        if (indices[i] === end + 1) {
            end = indices[i];
        } else {
            ranges.push(start === end ? DAYS[start] : `${DAYS[start]}-${DAYS[end]}`);
            start = end = indices[i];
        }
    }

    ranges.push(start === end ? DAYS[start] : `${DAYS[start]}-${DAYS[end]}`);
    return ranges.join(", ");
}

const getToday = (): Day => {
    const days: Day[] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return days[new Date().getDay()];
};

export function getOpeningHoursSummary(raw: string): string {
    if (!raw) return "Unknown";

    if (raw.toLowerCase().includes("24/7")) return "Open 24/7";
    if (raw.toLowerCase().includes("appointment")) return "On appointment";
    if (raw.toLowerCase().includes("closed")) return "Closed";

    const hours = parseOpeningHours(raw);
    const today = getToday();
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const todayHours = hours.find((el) => el.day === today);
    if (!todayHours || todayHours.hours.length === 0) return "Closed today";

    for (const range of todayHours.hours) {
        const {from, to} = range

        const fromMinutes = calculateMinutesFromRange(from);
        const toMinutes = calculateMinutesFromRange(to);

        if (minutesNow >= fromMinutes && minutesNow < toMinutes) {
            return `Open now – until ${to}`;
        } else if (minutesNow < fromMinutes) {
            return `Closed – opens at ${from}`;
        }
    }

    return "Closed today";
}

function calculateMinutesFromRange(time: string) {
    const [hh, mm] = time.split(":").map(Number);
    return hh * 60 + mm;
}


const GOOGLE_DAY_TO_CUSTOM_DAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertGooglePeriodsToDayHours(periods: any[]): DayHours[] {
    const map = new Map<Day, { from: string; to: string }[]>();

    for (const period of periods) {
        const open = period.open;
        const close = period.close;

        if (!open || !close) continue;

        const day = GOOGLE_DAY_TO_CUSTOM_DAY[open.day] as Day;
        const from = `${open.time.slice(0, 2)}:${open.time.slice(2)}`;
        const to = `${close.time.slice(0, 2)}:${close.time.slice(2)}`;

        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push({ from, to });
    }

    return Array.from(map.entries()).map(([day, hours]) => ({ day, hours }));
}

