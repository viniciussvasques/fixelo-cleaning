"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CounterProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
    label?: string;
}

export function Counter({
    value,
    onChange,
    min = 0,
    max = 10,
    className,
    label,
}: CounterProps) {
    const increment = () => {
        if (value < max) onChange(value + 1);
    };

    const decrement = () => {
        if (value > min) onChange(value - 1);
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={decrement}
                    disabled={value <= min}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center font-semibold text-lg min-w-[3rem]">
                    {value}
                </div>
                <button
                    type="button"
                    onClick={increment}
                    disabled={value >= max}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
