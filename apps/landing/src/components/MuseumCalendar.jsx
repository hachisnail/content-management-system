import React, { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * @param {object} props
 * @param {import('../data/store').Event[]} [props.events]
 */
export default function MuseumCalendar({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date("2025-10-01")); // Default to mock data month

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper to find event for a specific day
  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="bg-neutral-900 border border-white/10 p-6 md:p-10 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-serif text-3xl text-white">
          {MONTHS[month]} <span className="text-museum-gold">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="btn btn-sm btn-outline text-white hover:bg-museum-gold hover:text-black rounded-none"
          >
            ←
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="btn btn-sm btn-outline text-white hover:bg-museum-gold hover:text-black rounded-none"
          >
            →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10">
        {/* Day Labels */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="bg-neutral-950 p-2 text-center text-xs uppercase tracking-widest text-gray-500 font-bold"
          >
            {day}
          </div>
        ))}

        {/* Empty Cells for offset */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="bg-neutral-950 min-h-[100px]"
          ></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={day}
              className="bg-neutral-950 min-h-[100px] p-2 border-t border-white/5 relative group hover:bg-white/5 transition-colors"
            >
              <span
                className={`text-sm font-bold ${dayEvents.length > 0 ? "text-white" : "text-gray-600"}`}
              >
                {day}
              </span>

              <div className="mt-2 space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`text-[10px] p-1 truncate rounded-sm mb-1 cursor-pointer
                    ${ev.type === "holiday" ? "bg-red-900/50 text-red-200 border border-red-800" : ""}
                    ${ev.type === "exhibit" ? "bg-museum-gold/20 text-museum-gold border border-museum-gold/50" : ""}
                    ${ev.type === "lecture" || ev.type === "workshop" ? "bg-blue-900/50 text-blue-200 border border-blue-800" : ""}
                  `}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6 text-xs text-gray-400 uppercase tracking-wider justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-museum-gold/20 border border-museum-gold/50"></div>{" "}
          Exhibition
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-900/50 border border-red-800"></div>{" "}
          Holiday/Closed
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-900/50 border border-blue-800"></div>{" "}
          Event/Workshop
        </div>
      </div>
    </div>
  );
}