"use client";

import React, { useState } from "react";
import { CloseIcon } from "@/assets/icons/ui";

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}

export default function TagInput({ tags, onChange, placeholder = "Add tag...", className = "" }: TagInputProps) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const addTag = () => {
        const trimmed = input.trim().replace(/^#/, ""); // Remove leading # if present
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput("");
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className={`flex flex-wrap gap-2 p-2 bg-surface-light border border-border-light rounded-lg min-h-[42px] ${className}`}>
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded text-sm"
                >
                    #{tag}
                    <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-red-400 transition-colors"
                    >
                        <CloseIcon className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[100px] bg-transparent text-white placeholder-text-light focus:outline-none text-sm"
            />
        </div>
    );
}
