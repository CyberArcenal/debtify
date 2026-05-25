// src/renderer/pages/loans/active/components/ActiveLoanActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import { Eye, CreditCard, Calendar, Gift, MoreVertical, FileText } from "lucide-react";
import type { Debt } from "../../../../api/core/debt";

interface ActiveLoanActionsDropdownProps {
  loan: Debt;
  onView: (loan: Debt) => void;
  onRecordPayment: (loan: Debt) => void;
  onViewSchedule: (loan: Debt) => void;
  onForgiveness: (loan: Debt) => void;
  onViewAgreement: (loan: Debt) => void;
}

const ActiveLoanActionsDropdown: React.FC<ActiveLoanActionsDropdownProps> = ({
  loan,
  onView,
  onRecordPayment,
  onViewSchedule,
  onForgiveness,
  onViewAgreement,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 200;
    const windowHeight = window.innerHeight;
    if (rect.bottom + dropdownHeight > windowHeight) {
      return { bottom: `${windowHeight - rect.top + 5}px`, right: `${window.innerWidth - rect.right}px` };
    }
    return { top: `${rect.bottom + 5}px`, right: `${window.innerWidth - rect.right}px` };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>
      {isOpen && (
        <div
          className="fixed z-50 bg-[var(--card-bg)] rounded-lg shadow-xl border border-[var(--border-color)] w-48"
          style={getDropdownPosition()}
        >
          <div className="py-1">
            <button
              onClick={() => handleAction(() => onView(loan))}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--card-hover-bg)]"
            >
              <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => handleAction(() => onRecordPayment(loan))}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--card-hover-bg)]"
            >
              <CreditCard className="w-4 h-4 text-[var(--success-color)]" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={() => handleAction(() => onViewSchedule(loan))}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--card-hover-bg)]"
            >
              <Calendar className="w-4 h-4 text-[var(--accent-purple)]" />
              <span>Payment Schedule</span>
            </button>
            {loan.remainingAmount > 0 && (
              <button
                onClick={() => handleAction(() => onForgiveness(loan))}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--card-hover-bg)]"
              >
                <Gift className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>Apply Forgiveness</span>
              </button>
            )}
            <button
              onClick={() => handleAction(() => onViewAgreement(loan))}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--card-hover-bg)]"
            >
              <FileText className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>View Agreement</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveLoanActionsDropdown;