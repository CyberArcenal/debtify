// src/renderer/pages/payments/schedule/components/CalendarView.tsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface CalendarViewProps {
  payments: ScheduledPayment[];
  onDateClick: (date: string, paymentsOnDate: ScheduledPayment[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ payments, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const paymentsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPayment[]>();
    payments.forEach(p => {
      // Convert dueDate to YYYY-MM-DD safely (handles both string and Date)
      let dateKey: string;
      if (typeof p.dueDate === 'string') {
        dateKey = p.dueDate.slice(0, 10);
      } else if (p.dueDate instanceof Date) {
        dateKey = p.dueDate.toISOString().slice(0, 10);
      } else {
        return; // invalid date, skip
      }
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(p);
    });
    return map;
  }, [payments]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="border rounded-md p-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{monthName} {year}</h3>
        <div className="flex gap-2">
          <button onClick={goToToday} className="px-2 py-1 text-sm border rounded" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>Today</button>
          <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-[var(--card-hover-bg)]"><ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} /></button>
          <button onClick={handleNextMonth} className="p-1 rounded hover:bg-[var(--card-hover-bg)]"><ChevronRight className="w-5 h-5" style={{ color: "var(--text-primary)" }} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-24 border rounded" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}></div>;
          const dateKey = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayPayments = paymentsByDate.get(dateKey) || [];
          const isToday = today.toISOString().slice(0, 10) === dateKey;
          return (
            <div
              key={day}
              onClick={() => dayPayments.length > 0 && onDateClick(dateKey, dayPayments)}
              className="h-24 border rounded p-1 overflow-y-auto cursor-pointer hover:shadow-md transition"
              style={{ backgroundColor: "var(--card-bg)", borderColor: dayPayments.length ? "var(--primary-color)" : "var(--border-color)" }}
            >
              <div className={`text-right text-sm font-medium ${isToday ? "font-bold" : ""}`} style={{ color: isToday ? "var(--primary-color)" : "var(--text-primary)" }}>{day}</div>
              {dayPayments.slice(0, 3).map(p => (
                <div key={p.debtId} className="text-xs truncate flex items-center gap-1 mt-1">
                  <DollarSign className="w-3 h-3" style={{ color: "var(--success-color)" }} />
                  <span style={{ color: "var(--text-primary)" }} title={p.debtName}>{p.borrowerName}</span>
                </div>
              ))}
              {dayPayments.length > 3 && <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>+{dayPayments.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;