"use client";

import React from "react";
import { Day, DayHours, DAYS } from "@/utils/OpeningHoursParser";
import { stringifyOpeningHours } from "@/utils/OpeningHoursParser";
import { CheckmarkIcon, PlusIcon, CloseIcon } from "@/assets/icons/ui";
import Button from "@/components/ui/Button";

const clonePreset = (value: DayHours[]): DayHours[] =>
    value.map(({ day, hours }) => ({
        day,
        hours: hours.map(({ from, to }) => ({ from, to })),
    }));

const presets: { label: string; value: DayHours[] }[] = [
    {
        label: "Mon-Fri 9-6",
        value: DAYS.slice(0, 5).map((day) => ({
            day,
            hours: [{ from: "09:00", to: "18:00" }],
        })),
    },
    {
        label: "Every day 10-22",
        value: DAYS.filter((d) => d !== "PH").map((day) => ({
            day,
            hours: [{ from: "10:00", to: "22:00" }],
        })),
    },
    {
        label: "24/7",
        value: DAYS.filter((d) => d !== "PH").map((day) => ({
            day,
            hours: [{ from: "00:00", to: "23:59" }],
        })),
    },
];

const DAY_LABELS: Record<Day, string> = {
    Mo: "Monday",
    Tu: "Tuesday",
    We: "Wednesday",
    Th: "Thursday",
    Fr: "Friday",
    Sa: "Saturday",
    Su: "Sunday",
    PH: "Holidays",
};

interface OpeningHoursPickerProps {
    value: DayHours[];
    onChange: (val: DayHours[]) => void;
}

export default function OpeningHoursPicker({ value, onChange }: OpeningHoursPickerProps) {
    const handleToggleDay = (day: Day) => {
        const found = value.find((d) => d.day === day);
        let updated: DayHours[];

        if (found) {
            updated = value.filter((d) => d.day !== day);
        } else {
            updated = [...value, { day, hours: [{ from: "09:00", to: "17:00" }] }];
        }

        const sorted = DAYS
            .map((d) => updated.find((v) => v.day === d))
            .filter(Boolean) as DayHours[];

        onChange([...sorted]);
    };

    const handleTimeChange = (day: Day, index: number, field: "from" | "to", time: string) => {
        const updated = value.map((d) => {
            if (d.day !== day) return d;
            const hours = [...d.hours];
            hours[index] = { ...hours[index], [field]: time };
            return { ...d, hours };
        });
        onChange(updated);
    };

    const handleAddRange = (day: Day) => {
        const updated = value.map((d) =>
            d.day === day
                ? { ...d, hours: [...d.hours, { from: "09:00", to: "17:00" }] }
                : d
        );
        onChange(updated);
    };

    const handleRemoveRange = (day: Day, index: number) => {
        const updated = value
            .map((d) => {
                if (d.day !== day) return d;
                const hours = d.hours.filter((_, i) => i !== index);
                return { ...d, hours };
            })
            .filter((d) => d.hours.length > 0);
        onChange(updated);
    };

    const handleClear = () => {
        onChange([]);
    };

    const isEnabled = (day: Day) => value.some((d) => d.day === day);
    const getHours = (day: Day) => value.find((d) => d.day === day)?.hours || [];

    return (
        <div className="space-y-4">
            {/* Presets */}
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                    const isActive = stringifyOpeningHours(preset.value) === stringifyOpeningHours(value);
                    return (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => onChange(clonePreset(preset.value))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${isActive
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-light text-white hover:bg-surface'
                                }
                            `}
                        >
                            {preset.label}
                        </button>
                    );
                })}
                {value.length > 0 && (
                    <Button
                        type="button"
                        onClick={handleClear}
                        variant="ghost"
                        color="danger"
                        size="xs"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Days Grid */}
            <div className="space-y-1">
                {DAYS.map((day) => {
                    const enabled = isEnabled(day);
                    const hours = getHours(day);

                    return (
                        <div
                            key={day}
                            className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${enabled ? 'bg-accent/5' : 'hover:bg-surface-light'}`}
                        >
                            {/* Day Toggle */}
                            <label className="flex items-center gap-2 min-w-[100px] cursor-pointer">
                                <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                        ${enabled ? 'bg-accent border-accent' : 'border-border-light'}
                                    `}
                                >
                                    {enabled && (
                                        <CheckmarkIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={() => handleToggleDay(day)}
                                    className="sr-only"
                                />
                                <span className={`text-sm font-medium ${enabled ? 'text-white' : 'text-text-light'}`}>
                                    {DAY_LABELS[day]}
                                </span>
                            </label>

                            {/* Time Ranges */}
                            {enabled && (
                                <div className="flex-1 flex flex-wrap gap-2">
                                    {hours.map((range, i) => (
                                        <div key={i} className="flex items-center gap-1.5 bg-surface rounded-lg border border-border-light p-1">
                                            <select
                                                value={range.from}
                                                onChange={(e) => handleTimeChange(day, i, "from", e.target.value)}
                                                className="px-2 py-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                                            >
                                                {generateTimeOptions().map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <span className="text-text-light text-xs">-</span>
                                            <select
                                                value={range.to}
                                                onChange={(e) => handleTimeChange(day, i, "to", e.target.value)}
                                                className="px-2 py-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                                            >
                                                {generateTimeOptions().map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <div className="flex items-center border-l border-border-light pl-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddRange(day)}
                                                    className="p-0.5 text-text-light hover:text-green-600 transition-colors"
                                                    title="Add time range"
                                                >
                                                    <PlusIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRange(day, i)}
                                                    className="p-0.5 text-text-light hover:text-red-500 transition-colors"
                                                    title="Remove"
                                                >
                                                    <CloseIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Closed label */}
                            {!enabled && (
                                <span className="text-xs text-text-light">Closed</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function generateTimeOptions(): string[] {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, "0");
            const minute = m.toString().padStart(2, "0");
            times.push(`${hour}:${minute}`);
        }
    }
    return times;
}
