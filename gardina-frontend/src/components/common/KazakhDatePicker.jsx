import React, { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * Custom Date & Time Picker in Kazakh
 * Visual style: Premium, card-based, horizontal scrolling for dates
 */
const KazakhDatePicker = ({ value, onChange, error, occupiedSlots = [] }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    // Generate upcoming 14 days (using local time, not UTC)
    const dates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setHours(12, 0, 0, 0); // Set to noon to avoid date shift issues
        date.setDate(date.getDate() + i);
        return date;
    });

    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    const KZ_DAYS = ['Жек', 'Дүй', 'Сей', 'Сәр', 'Бей', 'Жұм', 'Сен'];
    const KZ_MONTHS = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Helper to check if a time is in the past (for today)
    const isTimeInPast = (timeStr) => {
        if (!selectedDate) return false;

        // If not today, time is not in past (unless date is in past, but we only show future dates)
        if (!isToday(new Date(selectedDate))) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const [slotHour] = timeStr.split(':').map(Number);

        // Hide if slot hour is less than or equal to current hour
        return slotHour <= currentHour;
    };

    // Helper to check if time is occupied
    const isTimeOccupied = (timeStr) => {
        if (!selectedDate || !occupiedSlots.length) return false;

        const currentSelected = new Date(selectedDate);
        const [targetHour] = timeStr.split(':').map(Number);

        return occupiedSlots.some(slotIso => {
            // occupiedSlots are ISO strings (likely UTC) e.g. "2023-12-14T10:00:00.000Z"
            const slotDate = new Date(slotIso);

            // Compare Local Year/Month/Date/Hour
            return slotDate.getFullYear() === currentSelected.getFullYear() &&
                slotDate.getMonth() === currentSelected.getMonth() &&
                slotDate.getDate() === currentSelected.getDate() &&
                slotDate.getHours() === targetHour;
        });
    };

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            // Handle invalid dates
            if (!isNaN(date.getTime())) {
                // Use local date formatting instead of UTC
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                setSelectedDate(dateStr);

                const hours = String(date.getHours()).padStart(2, '0');
                // Try to find exact match
                let validSlot = timeSlots.find(t => t.startsWith(hours));

                if (!validSlot) validSlot = '09:00'; // Fallback

                setSelectedTime(validSlot);
            }
        } else {
            // Default logic: Auto-select next available valid slot
            const now = new Date();
            const currentHour = now.getHours();

            // Default: select Today if possible, else Tomorrow
            let defaultDate = now;

            // Check if today has ANY available slots
            const hasSlotsToday = timeSlots.some(t => {
                const [h] = t.split(':').map(Number);
                if (h <= currentHour) return false;

                // Manual occupation check for 'now' (today) without relying on selectedDate state
                // We use logic similar to isTimeOccupied but with 'now'
                return !occupiedSlots.some(slotIso => {
                    const slotDate = new Date(slotIso);
                    return slotDate.getFullYear() === now.getFullYear() &&
                        slotDate.getMonth() === now.getMonth() &&
                        slotDate.getDate() === now.getDate() &&
                        slotDate.getHours() === h;
                });
            });

            if (!hasSlotsToday) {
                // Determine tomorrow
                const tmr = new Date();
                tmr.setHours(12, 0, 0, 0);
                tmr.setDate(tmr.getDate() + 1);
                defaultDate = tmr;
            }

            // Use local date formatting instead of UTC
            const year = defaultDate.getFullYear();
            const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const day = String(defaultDate.getDate()).padStart(2, '0');
            const defaultDateStr = `${year}-${month}-${day}`;
            setSelectedDate(defaultDateStr);

            // Now find first valid slot for this defaultDate
            const firstValid = timeSlots.find(t => {
                // Check past
                if (isToday(defaultDate)) {
                    const [h] = t.split(':').map(Number);
                    if (h <= currentHour) return false;
                }
                // Check occupied
                return !occupiedSlots.some(slotIso => {
                    const slotDate = new Date(slotIso);
                    const [h] = t.split(':').map(Number);
                    return slotDate.getFullYear() === defaultDate.getFullYear() &&
                        slotDate.getMonth() === defaultDate.getMonth() &&
                        slotDate.getDate() === defaultDate.getDate() &&
                        slotDate.getHours() === h;
                });
            });

            if (firstValid) {
                setSelectedTime(firstValid);
            } else {
                setSelectedTime(null);
            }
        }
    }, [value, occupiedSlots]); // Re-run if occupiedSlots changes! Important!

    // Re-validate when DATE changes or OCCUPIED SLOTS change
    // If selected time is no longer valid, clear it
    useEffect(() => {
        if (selectedDate && selectedTime) {
            const isOccupied = isTimeOccupied(selectedTime);
            const isPast = isTimeInPast(selectedTime);

            if (isOccupied || isPast) {
                // Current selection is invalid -> Clear it
                setSelectedTime(null);
                onChange(null); // Clear parent value
            } else {
                // Valid -> update parent
                // Create proper ISO string with timezone offset for Almaty (UTC+6)
                const localDate = new Date(`${selectedDate}T${selectedTime}:00`);
                const isoString = localDate.toISOString();
                onChange(isoString);
            }
        } else if (selectedDate && !selectedTime) {
            // Date selected but time cleared -> ensure parent knows
            // onChange(null); 
        }
    }, [selectedDate, selectedTime, occupiedSlots]);

    const isSelected = (date) => {
        if (!selectedDate) return false;
        const s = new Date(selectedDate);
        return date.getDate() === s.getDate() &&
            date.getMonth() === s.getMonth();
    };

    const isTomorrow = (date) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear();
    };

    // Derived state for available slots to check if ALL are hidden/busy
    const visibleSlots = timeSlots.filter(time => !isTimeInPast(time));

    return (
        <div className="space-y-4">
            {/* Horizontal Date Scroller */}
            <div>
                <label className="block text-sm font-bold mb-3 text-foreground">Күні</label>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                    {dates.map((date, index) => {
                        const active = isSelected(date);
                        const label = isToday(date) ? 'Бүгін' : isTomorrow(date) ? 'Ертең' : KZ_DAYS[date.getDay()];
                        // Use local date formatting instead of UTC
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        // Check if day is fully booked
                        const isFullyBooked = timeSlots.every(t => {
                            // Check past
                            if (isToday(date)) {
                                const currentHour = new Date().getHours();
                                const [h] = t.split(':').map(Number);
                                if (h <= currentHour) return true; // Effectively unavailable
                            }
                            // Check occupied
                            return occupiedSlots.some(slotIso => {
                                const slotDate = new Date(slotIso);
                                const [h] = t.split(':').map(Number);
                                return slotDate.getFullYear() === date.getFullYear() &&
                                    slotDate.getMonth() === date.getMonth() &&
                                    slotDate.getDate() === date.getDate() &&
                                    slotDate.getHours() === h;
                            });
                        });

                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => setSelectedDate(dateStr)}
                                disabled={isFullyBooked}
                                className={`
                                    flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-2xl border-2 transition-all flex-shrink-0
                                    ${active
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 transform scale-105'
                                        : isFullyBooked
                                            ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-60'
                                            : 'bg-muted text-muted-foreground border-transparent hover:bg-muted'}
                                `}
                            >
                                <span className="text-[10px] font-bold uppercase mb-1">
                                    {label}
                                </span>
                                <span className={`text-2xl font-black ${active ? 'text-white' : 'text-foreground'}`}>
                                    {date.getDate()}
                                </span>
                                <span className="text-[9px] font-medium truncate max-w-full px-1">
                                    {KZ_MONTHS[date.getMonth()]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Grid */}
            <div>
                <label className="block text-sm font-bold mb-3 text-foreground">Уақыты</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {visibleSlots.length === 0 && (
                        <p className="col-span-4 text-sm text-muted-foreground py-2">Бүгінге бос уақыт жоқ</p>
                    )}
                    {visibleSlots.map(time => {
                        const isOccupied = isTimeOccupied(time);
                        const isActive = selectedTime === time;

                        return (
                            <button
                                type="button"
                                key={time}
                                onClick={() => !isOccupied && setSelectedTime(time)}
                                disabled={isOccupied}
                                className={`
                                    py-2 rounded-xl text-sm font-bold transition-all border-2 relative overflow-hidden
                                    ${isActive
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : isOccupied
                                            ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                                            : 'bg-card text-muted-foreground border-border hover:border-border'}
                                `}
                            >
                                {time}
                                {isOccupied && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                        <div className="h-0.5 w-full bg-gray-300 rotate-45 transform scale-x-150"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Summary */}
            {(selectedDate && selectedTime) && (
                <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between border border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="event_available" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Таңдалды</p>
                            <p className="text-sm font-bold text-foreground">
                                {new Date(selectedDate).getDate()} {KZ_MONTHS[new Date(selectedDate).getMonth()]}, {selectedTime}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-red-500 font-medium">{error.message}</p>}
        </div>
    );
};

export default KazakhDatePicker;
