// src/renderer/pages/payments/methods/index.tsx
import React, { useState } from "react";
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import Button from "../../../components/UI/Button";
import usePaymentMethods from "./hooks/usePaymentMethods";
import MethodCard from "./components/MethodCard";
import MethodFormModal from "./components/MethodFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { dialogs } from "../../../utils/dialogs";

const PaymentMethodsPage: React.FC = () => {
  const { methods, stats, loading, refresh, create, update, setDefault, remove } = usePaymentMethods();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (data: any) => {
    await create(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingMethod) {
      await update(editingMethod.id, data);
      setEditingMethod(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    await setDefault(id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await remove(deletingId);
      setDeletingId(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Payment Methods</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Button onClick={() => setFormOpen(true)} variant="success" icon={Plus}>Add Method</Button>
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}

        {!loading && methods.length === 0 && (
          <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
            <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No payment methods</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Click "Add Method" to create one.</p>
          </div>
        )}

        {!loading && methods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map(method => {
              const methodStats = stats[method.id];
              return (
                <MethodCard
                  key={method.id}
                  method={method}
                  usageCount={methodStats?.transactionCount || 0}
                  onEdit={() => setEditingMethod(method)}
                  onDelete={() => setDeletingId(method.id)}
                  onSetDefault={() => handleSetDefault(method.id)}
                  isAdmin={true}
                />
              );
            })}
          </div>
        )}
      </div>

      <MethodFormModal isOpen={formOpen} mode="create" method={null} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      <MethodFormModal isOpen={!!editingMethod} mode="edit" method={editingMethod} onClose={() => setEditingMethod(null)} onSubmit={handleUpdate} />
      <DeleteConfirmationModal isOpen={!!deletingId} methodName={methods.find(m => m.id === deletingId)?.name || ""} onClose={() => setDeletingId(null)} onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
};

export default PaymentMethodsPage;