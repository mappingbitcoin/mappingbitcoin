"use client";

import { useState } from "react";
import {getOpeningHoursSummary, parseOpeningHours, TimeRange} from "@/utils/OpeningHoursParser";

type Props = {
    openingHours: string;
};

const dayLabels = {
    Mo: "Monday",
    Tu: "Tuesday",
    We: "Wednesday",
    Th: "Thursday",
    Fr: "Friday",
    Sa: "Saturday",
    Su: "Sunday",
    PH: "Public Holiday",
};

export default function OpeningHoursDisplay({ openingHours }: Props) {
    const [expanded, setExpanded] = useState(false);
    const parsed = parseOpeningHours(openingHours);

    return (
        <div className="m-0 max-w-[500px]">
            <p className="m-0">{getOpeningHoursSummary(openingHours)}</p>
            {expanded && (
                <ul className="m-0 p-0 list-none border-t border-gray-200 pt-2 [&_li]:mb-1.5 [&_li]:w-full [&_strong]:min-w-[80px] [&_strong]:inline-block [&_strong]:font-semibold">
                    {parsed.map((dayHours) => (
                        <li key={dayHours.day}>
                            <strong>{dayLabels[dayHours.day]}:</strong>{" "}
                            {dayHours.hours.length === 0
                                ? "Closed"
                                : dayHours.hours.map((r: TimeRange) => `${r.from}–${r.to}`).join(", ")}
                        </li>
                    ))}
                </ul>
            )}
            <button
                className="bg-transparent border-none text-accent cursor-pointer p-0 text-sm mb-2 hover:underline hover:bg-transparent hover:text-accent-dark"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
            >
                {expanded ? "Hide hours" : "Show hours"}
            </button>
        </div>
    );
}
