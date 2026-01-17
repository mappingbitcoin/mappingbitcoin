import { useState, useMemo } from "react";
import { getCurrencyOptions } from "@/utils/CurrencyUtils";

export default function CurrencyInput({
                                          selectedCurrency,
                                          setSelectedCurrency,
                                      }: {
    selectedCurrency: string;
    setSelectedCurrency: (val: string) => void;
}) {
    const [input, setInput] = useState(selectedCurrency);
    const [focused, setFocused] = useState(false);
    const currencyOptions = useMemo(() => getCurrencyOptions(), []);

    const filtered = useMemo(() => {
        return currencyOptions.filter((opt) =>
            opt.code.toLowerCase().startsWith(input.toLowerCase()) ||
            opt.label.toLowerCase().includes(input.toLowerCase())
        );
    }, [input, currencyOptions]);

    return (
        <div className="relative w-full [&_input]:w-full [&_input]:py-2 [&_input]:px-3 [&_input]:border [&_input]:border-gray-300 [&_input]:rounded [&_input]:text-base [&_input]:outline-none [&_input:focus]:border-gray-600">
            <input
                type="text"
                value={input}
                placeholder="e.g. USD, EUR..."
                onChange={(e) => {
                    let value = e.target.value.toUpperCase();

                    // Allow only A–Z and limit to 3 characters
                    value = value.replace(/[^A-Z]/g, '').slice(0, 3);

                    setInput(value);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 100)} // allow list click
            />
            {focused && filtered.length > 0 && (
                <ul className="absolute top-full left-0 z-10 w-full max-h-[250px] overflow-y-auto bg-white border border-gray-300 border-t-0 rounded-b shadow-[0_4px_8px_rgba(0,0,0,0.05)] list-none m-0 p-0 [&_li]:py-2.5 [&_li]:px-3 [&_li]:cursor-pointer [&_li]:transition-colors [&_li]:duration-200 [&_li:hover]:bg-gray-100 [&_li_strong]:font-semibold">
                    {filtered.map((opt) => (
                        <li
                            key={opt.code}
                            onMouseDown={() => {
                                setInput(opt.code);
                                setSelectedCurrency(opt.code);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
