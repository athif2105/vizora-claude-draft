import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfQuarter, subMonths, subYears } from 'date-fns';
import 'react-day-picker/dist/style.css';

export interface DateRangeOption {
  label: string;
  value: string;
  startDate?: Date;
  endDate?: Date;
  isCustom?: boolean;
  isComparison?: boolean;
}

interface DateRangeFilterProps {
  onDateRangeChange: (option: DateRangeOption) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, className = '' }) => {
  const today = new Date();

  const dateRangeOptions: DateRangeOption[] = [
    { label: 'Custom', value: 'custom', isCustom: true },
    { label: 'Today', value: 'today', startDate: today, endDate: today },
    { label: 'Yesterday', value: 'yesterday', startDate: subDays(today, 1), endDate: subDays(today, 1) },
    {
      label: 'This week (Sun - Today)',
      value: 'this-week',
      startDate: startOfWeek(today, { weekStartsOn: 0 }),
      endDate: today
    },
    { label: 'Last 7 days', value: 'last-7-days', startDate: subDays(today, 6), endDate: today },
    {
      label: 'Last week (Sun - Sat)',
      value: 'last-week',
      startDate: startOfWeek(subDays(today, 7), { weekStartsOn: 0 }),
      endDate: endOfWeek(subDays(today, 7), { weekStartsOn: 0 })
    },
    { label: 'Last 14 days', value: 'last-14-days', startDate: subDays(today, 13), endDate: today },
    { label: 'Last 28 days', value: 'last-28-days', startDate: subDays(today, 27), endDate: today },
    { label: 'Last 30 days', value: 'last-30-days', startDate: subDays(today, 29), endDate: today },
    { label: 'Last 90 days', value: 'last-90-days', startDate: subDays(today, 89), endDate: today },
    {
      label: 'Quarter to date',
      value: 'quarter-to-date',
      startDate: startOfQuarter(today),
      endDate: today
    },
    { label: 'Last 12 months', value: 'last-12-months', startDate: subMonths(today, 12), endDate: today },
    { label: 'This year (Jan - Today)', value: 'this-year', startDate: startOfYear(today), endDate: today },
    {
      label: 'Last calendar year',
      value: 'last-calendar-year',
      startDate: startOfYear(subYears(today, 1)),
      endDate: endOfYear(subYears(today, 1))
    },
    { label: 'Compare', value: 'compare', isComparison: true }
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>(dateRangeOptions[7]); // Default: Last 28 days
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: DateRangeOption) => {
    if (option.isCustom) {
      setShowCalendar(true);
      return;
    }

    if (option.isComparison) {
      // Handle comparison mode - will implement later
      setSelectedOption(option);
      setIsOpen(false);
      onDateRangeChange(option);
      return;
    }

    setSelectedOption(option);
    setIsOpen(false);
    setShowCalendar(false);
    onDateRangeChange(option);
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);

    if (range?.from && range?.to) {
      const customOption: DateRangeOption = {
        label: 'Custom',
        value: 'custom',
        startDate: range.from,
        endDate: range.to,
        isCustom: true
      };
      setSelectedOption(customOption);
      setShowCalendar(false);
      setIsOpen(false);
      onDateRangeChange(customOption);
    }
  };

  const formatDateLabel = () => {
    if (selectedOption.isComparison) {
      return 'Compare';
    }

    if (selectedOption.isCustom && customRange?.from && customRange?.to) {
      return `${format(customRange.from, 'MMM d, yyyy')} - ${format(customRange.to, 'MMM d, yyyy')}`;
    }

    if (selectedOption.startDate && selectedOption.endDate) {
      return `${format(selectedOption.startDate, 'MMM d, yyyy')} - ${format(selectedOption.endDate, 'MMM d, yyyy')}`;
    }

    return selectedOption.label;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium">{formatDateLabel()}</span>
        <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !showCalendar && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[240px] max-h-[400px] overflow-y-auto">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                selectedOption.value === option.value && !showCalendar
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Picker for Custom Range */}
      {showCalendar && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select Date Range</h3>
            <button
              onClick={() => {
                setShowCalendar(false);
                setIsOpen(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <DayPicker
            mode="range"
            selected={customRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            className="date-range-picker"
            classNames={{
              months: "flex gap-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-gray-900 dark:text-white",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-700 dark:text-gray-300",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 dark:[&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md",
              day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold",
              day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
              day_disabled: "text-gray-400 dark:text-gray-600 opacity-50",
              day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-700 dark:aria-selected:text-white",
              day_hidden: "invisible"
            }}
          />

          {customRange?.from && customRange?.to && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Selected Range:</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {format(customRange.from, 'MMM d, yyyy')} - {format(customRange.to, 'MMM d, yyyy')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
