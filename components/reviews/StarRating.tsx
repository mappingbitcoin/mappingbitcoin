"use client";

import React, { useState } from "react";

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
};

const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
};

export default function StarRating({
    value,
    onChange,
    readOnly = false,
    size = "md",
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue ?? value;
    const isInteractive = !readOnly && onChange;

    const handleClick = (starValue: number) => {
        if (isInteractive) {
            onChange(starValue);
        }
    };

    const handleMouseEnter = (starValue: number) => {
        if (isInteractive) {
            setHoverValue(starValue);
        }
    };

    const handleMouseLeave = () => {
        if (isInteractive) {
            setHoverValue(null);
        }
    };

    return (
        <div
            className={`inline-flex items-center ${gapClasses[size]}`}
            onMouseLeave={handleMouseLeave}
        >
            {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= displayValue;
                const isHovered = hoverValue !== null && starValue <= hoverValue;

                return (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => handleMouseEnter(starValue)}
                        disabled={readOnly}
                        className={`
                            ${sizeClasses[size]}
                            ${isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default"}
                            transition-all duration-150
                            disabled:cursor-default
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                            rounded
                        `}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                        <Star
                            filled={isFilled}
                            hovered={isHovered && !isFilled}
                            className={sizeClasses[size]}
                        />
                    </button>
                );
            })}
        </div>
    );
}

interface StarProps {
    filled: boolean;
    hovered?: boolean;
    className?: string;
}

function Star({ filled, hovered, className }: StarProps) {
    if (filled) {
        return (
            <svg
                className={`${className} text-yellow-400`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        );
    }

    if (hovered) {
        return (
            <svg
                className={`${className} text-yellow-400/50`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        );
    }

    return (
        <svg
            className={`${className} text-gray-500`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
        </svg>
    );
}
