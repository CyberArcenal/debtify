// src/renderer/pages/devices/hooks/usePrinters.ts
import { useState, useEffect, useCallback } from "react";
import type { Printer, AddPrinterData } from "../types";
import printerAPI from "../../../api/core/printers";

interface UsePrintersReturn {
  printers: Printer[];
  loading: boolean;
  error: string | null;
  addPrinter: (data: AddPrinterData) => Promise<Printer>;
  updatePrinter: (id: number, data: Partial<Printer>) => Promise<void>;
  setDefault: (id: number) => Promise<void>;
  deletePrinter: (id: number) => Promise<void>;
  testPrinter: (id: number) => Promise<boolean>;
  refresh: () => void;
}

const usePrinters = (): UsePrintersReturn => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await printerAPI.getAll();
      if (response.status) {
        setPrinters(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to load printers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const addPrinter = async (data: AddPrinterData): Promise<Printer> => {
    const response = await printerAPI.create(data);
    if (!response.status) throw new Error(response.message);
    await loadPrinters();
    return response.data;
  };

  const updatePrinterById = async (id: number, data: Partial<Printer>) => {
    const response = await printerAPI.update(id, data);
    if (!response.status) throw new Error(response.message);
    await loadPrinters();
  };

  const setDefault = async (id: number) => {
    const response = await printerAPI.setDefault(id);
    if (!response.status) throw new Error(response.message);
    await loadPrinters();
  };

  const deletePrinterById = async (id: number) => {
    const response = await printerAPI.delete(id);
    if (!response.status) throw new Error(response.message);
    await loadPrinters();
  };

  const testPrinterById = async (id: number): Promise<boolean> => {
    const response = await printerAPI.testPrint(id);
    if (!response.status) throw new Error(response.message);
    return response.data?.success || false;
  };

  const refresh = () => {
    loadPrinters();
  };

  return {
    printers,
    loading,
    error,
    addPrinter,
    updatePrinter: updatePrinterById,
    setDefault,
    deletePrinter: deletePrinterById,
    testPrinter: testPrinterById,
    refresh,
  };
};

export default usePrinters;