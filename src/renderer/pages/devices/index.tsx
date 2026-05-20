// src/renderer/pages/devices/index.tsx
import React, { useState } from "react";
import { Printer, Plus, RefreshCw } from "lucide-react";
import Button from "../../components/UI/Button";
import usePrinters from "./hooks/usePrinters";
import PrinterTable from "./components/PrinterTable";
import PrinterFormModal from "./components/PrinterFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { dialogs } from "../../utils/dialogs";

const DevicesPage: React.FC = () => {
  const { printers, loading, error, addPrinter, updatePrinter, setDefault, deletePrinter, testPrinter, refresh } = usePrinters();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editPrinter, setEditPrinter] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleTest = async (id: number) => {
    setTestingId(id);
    const success = await testPrinter(id);
    dialogs.success(success ? "Test print sent successfully!" : "Printer test failed. Check connection.");
    setTestingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deletePrinter(deleteTarget.id);
      dialogs.success(`Printer "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async (data: any) => {
    await addPrinter(data);
    dialogs.success("Printer added.");
  };

  const handleUpdate = async (data: any) => {
    if (editPrinter) {
      await updatePrinter(editPrinter.id, data);
      dialogs.success("Printer updated.");
      setEditPrinter(null);
    }
  };

  if (error) return <div className="p-4 text-center" style={{ color: "var(--danger-color)" }}>Error: {error}</div>;

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Printer Manager</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 border rounded flex items-center gap-1"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Button onClick={() => setAddModalOpen(true)} variant="success" icon={Plus}>Add Printer</Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div>
          </div>
        )}

        {!loading && printers.length === 0 && (
          <div className="text-center py-12 border rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <Printer className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No printers configured.</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Click "Add Printer" to create one.</p>
          </div>
        )}

        {!loading && printers.length > 0 && (
          <PrinterTable
            printers={printers}
            onSetDefault={setDefault}
            onEdit={setEditPrinter}
            onDelete={setDeleteTarget}
            onTest={handleTest}
            testingId={testingId}
          />
        )}
      </div>

      <PrinterFormModal isOpen={addModalOpen} printer={null} onClose={() => setAddModalOpen(false)} onSave={handleAdd} />
      <PrinterFormModal isOpen={!!editPrinter} printer={editPrinter} onClose={() => setEditPrinter(null)} onSave={handleUpdate} />
      <DeleteConfirmationModal isOpen={!!deleteTarget} printerName={deleteTarget?.name || ""} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={actionLoading} />
    </div>
  );
};

export default DevicesPage;