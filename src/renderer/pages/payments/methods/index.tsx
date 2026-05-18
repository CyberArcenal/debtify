import React, { useState } from 'react';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';
import Button from '../../../components/UI/Button';
import usePaymentMethods from './hooks/usePaymentMethods';
import MethodCard from './components/MethodCard';
import MethodFormModal from './components/MethodFormModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const PaymentMethodsPage: React.FC = () => {
  const { methods, loading, refresh, create, update, remove, setDefault, getUsageCount } = usePaymentMethods();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (data: any) => { await create(data); setFormOpen(false); };
  const handleEdit = (method: any) => { setSelectedMethod(method); setFormMode('edit'); setFormOpen(true); };
  const handleUpdate = async (data: any) => { await update(selectedMethod.id, data); setFormOpen(false); setSelectedMethod(null); };
  const handleDelete = (method: any) => { setDeletingMethod(method); setDeleteOpen(true); };
  const confirmDelete = async () => { if (deletingMethod) { setDeleteLoading(true); await remove(deletingMethod.id); setDeleteLoading(false); setDeleteOpen(false); setDeletingMethod(null); } };
  const handleSetDefault = async (id: number) => { await setDefault(id); };

  return (
    <div className="p-4">
      <div className="rounded-md shadow-md border p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" /><h1 className="text-xl font-bold">Payment Methods</h1></div>
          <div className="flex gap-2"><button onClick={refresh} disabled={loading} className="px-3 py-2 border rounded"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button><Button onClick={() => { setFormMode('create'); setSelectedMethod(null); setFormOpen(true); }} variant="success" icon={Plus}>Add Method</Button></div>
        </div>
        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
        {!loading && methods.length === 0 && <div className="text-center py-12 text-gray-500">No payment methods. Click Add Method to create.</div>}
        {!loading && methods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map(m => <MethodCard key={m.id} method={m} usageCount={getUsageCount(m.id)} onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m)} onSetDefault={() => handleSetDefault(m.id)} isAdmin={true} />)}
          </div>
        )}
      </div>
      <MethodFormModal isOpen={formOpen} mode={formMode} method={selectedMethod} onClose={() => { setFormOpen(false); setSelectedMethod(null); }} onSubmit={formMode === 'create' ? handleCreate : handleUpdate} />
      <DeleteConfirmationModal isOpen={deleteOpen} methodName={deletingMethod?.name} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} loading={deleteLoading} />
    </div>
  );
};

export default PaymentMethodsPage;