// src/renderer/pages/payments/schedule/components/ViewModeToggle.tsx
import React from "react";
import { CalendarDays, List } from "lucide-react";

interface ViewModeToggleProps {
  mode: "calendar" | "list";
  onChange: (mode: "calendar" | "list") => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex gap-1 border rounded-md p-1" style={{ borderColor: "var(--border-color)" }}>
      <button onClick={() => onChange("list")} className={`p-1.5 rounded ${mode === "list" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--card-hover-bg)]"}`} style={{ color: mode === "list" ? "white" : "var(--text-primary)" }}><List className="w-4 h-4" /></button>
      <button onClick={() => onChange("calendar")} className={`p-1.5 rounded ${mode === "calendar" ? "bg-[var(--primary-color)] text-white" : "hover:bg-[var(--card-hover-bg)]"}`} style={{ color: mode === "calendar" ? "white" : "var(--text-primary)" }}><CalendarDays className="w-4 h-4" /></button>
    </div>
  );
};

export default ViewModeToggle;