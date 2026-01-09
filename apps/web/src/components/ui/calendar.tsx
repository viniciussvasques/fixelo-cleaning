'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    isBefore,
    startOfToday,
    addMonths,
    subMonths,
} from 'date-fns';

interface CalendarProps {
    selected?: Date;
    onSelect?: (date: Date) => void;
    disabled?: (date: Date) => boolean;
    className?: string;
}

export function Calendar({ selected, onSelect, disabled, className = '' }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-2 py-3">
                <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h2 className="text-base font-semibold text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>

                <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        return (
            <div className="grid grid-cols-7 mb-1">
                {days.map((day) => (
                    <div
                        key={day}
                        className="text-center py-2 text-xs font-medium text-gray-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, 'd');
                const cloneDay = day;
                const isDisabled = disabled ? disabled(cloneDay) : isBefore(cloneDay, startOfToday());
                const isSelected = selected && isSameDay(cloneDay, selected);
                const isTodayDate = isToday(cloneDay);
                const isCurrentMonth = isSameMonth(cloneDay, monthStart);

                days.push(
                    <button
                        type="button"
                        key={day.toString()}
                        onClick={() => !isDisabled && onSelect && onSelect(cloneDay)}
                        disabled={isDisabled}
                        className={`
              relative w-full h-10 rounded-lg text-sm font-medium transition-all
              ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
              ${isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
              ${isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-lg ring-2 ring-blue-600 ring-offset-2 hover:bg-blue-700'
                                : isDisabled
                                    ? ''
                                    : 'hover:bg-blue-50 hover:text-blue-600'
                            }
              ${isTodayDate && !isSelected ? 'border-2 border-blue-600 font-bold' : ''}
            `}
                    >
                        {formattedDate}
                    </button>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        return <div className="space-y-1">{rows}</div>;
    };

    return (
        <div className={`bg-white rounded-lg ${className}`}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}
