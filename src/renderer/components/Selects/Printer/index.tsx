// src/renderer/components/Selects/PrinterType/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Printer, X } from "lucide-react";
import printerAPI from "../../../api/core/printers";
import type { Printer as PrinterType } from "../../../api/core/printers";

interface PrinterSelectProps {
  value: number | null;
  onChange: (printerId: number | null, printer?: PrinterType) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const PrinterSelect: React.FC<PrinterSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select printer...",
  className = "w-full max-w-md",
}) => {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [filteredPrinters, setFilteredPrinters] = useState<PrinterType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPrinters = async () => {
      setLoading(true);
      try {
        const response = await printerAPI.getAll(1, 100); // page, limit
        if (response.status && response.data) {
          const list = response.data.data || [];
          setPrinters(list);
          setFilteredPrinters(list);
        }
      } catch (error) {
        console.error("Failed to load printers:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPrinters();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrinters(printers);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredPrinters(
      printers.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower)),
      ),
    );
  }, [searchTerm, printers]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (printer: PrinterType) => {
    onChange(printer.id, printer);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedPrinter = printers.find((p) => p.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors duration-200"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          minHeight: "42px",
        }}
      >
        <Printer
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedPrinter ? (
            <>
              <span className="font-medium truncate">
                {selectedPrinter.name}
              </span>
              <span
                className="text-xs truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                ({selectedPrinter.interface})
              </span>
            </>
          ) : (
            <span
              className="truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {placeholder}
            </span>
          )}
        </div>
        {selectedPrinter && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            title="Remove selected"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-lg shadow-lg overflow-hidden"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              maxHeight: "350px",
            }}
          >
            <div
              className="p-2 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search printers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{
                    backgroundColor: "var(--card-secondary-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
              {loading && printers.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredPrinters.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No printers found
                </div>
              ) : (
                filteredPrinters.map((printer) => (
                  <button
                    key={printer.id}
                    type="button"
                    onClick={() => handleSelect(printer)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)] ${
                      printer.id === value
                        ? "bg-[var(--accent-blue-light)]"
                        : ""
                    }`}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <Printer
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--primary-color)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{printer.name}</div>
                      <div className="text-xs truncate text-[var(--text-tertiary)]">
                        {printer.interface} | {printer.connectionString}
                      </div>
                    </div>
                    {printer.isDefault && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PrinterSelect;
