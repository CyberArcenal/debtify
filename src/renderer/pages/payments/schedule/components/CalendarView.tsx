// src/renderer/pages/payments/schedule/components/CalendarView.tsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

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
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const paymentsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPayment[]>();
    payments.forEach(p => {
      const dateKey = p.dueDate.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(p);
    });
    return map;
  }, [payments]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const goToToday = () => setCurrentMonth(new Date());

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="border rounded-md p-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button onClick={goToToday} className="px-2 py-1 text-sm border rounded">Today</button>
          <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={handleNextMonth} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-24 border rounded bg-gray-50"></div>;
          const dateKey = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayPayments = paymentsByDate.get(dateKey) || [];
          const isToday = today.toISOString().slice(0, 10) === dateKey;
          return (
            <div
              key={day}
              onClick={() => dayPayments.length > 0 && onDateClick(dateKey, dayPayments)}
              className={`h-24 border rounded p-1 overflow-y-auto cursor-pointer hover:shadow-md transition ${isToday ? "border-blue-500 bg-blue-50" : "bg-white"}`}
              style={{ borderColor: dayPayments.length ? "var(--primary-color)" : "var(--border-color)" }}
            >
              <div className={`text-right text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>{day}</div>
              {dayPayments.slice(0, 3).map(p => (
                <div key={p.debtId} className="text-xs truncate flex items-center gap-1 mt-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span title={p.debtName}>{p.borrowerName}</span>
                </div>
              ))}
              {dayPayments.length > 3 && <div className="text-xs text-gray-500 mt-1">+{dayPayments.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;