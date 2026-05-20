// src/renderer/pages/payments/methods/components/MethodFormModal.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../../../components/UI/Modal';
import Button from '../../../../components/UI/Button';
import type { PaymentMethod } from '../../../../api/core/payment_method';

interface MethodFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  method: PaymentMethod | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const MethodFormModal: React.FC<MethodFormModalProps> = ({ isOpen, mode, method, onClose, onSubmit }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', description: '', icon: 'CreditCard' }
  });

  useEffect(() => {
    if (method && mode === 'edit') reset({ name: method.name, description: method.description || '', icon: method.icon });
    else reset({ name: '', description: '', icon: 'CreditCard' });
  }, [method, mode, reset]);

  const iconOptions = ['Banknote', 'Building2', 'FileText', 'Smartphone', 'CreditCard', 'Landmark', 'Wallet', 'QrCode'];

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Add Payment Method' : 'Edit Payment Method'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Name *</label>
          <input {...register('name', { required: true })} className="w-full px-3 py-2 border rounded" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</label>
          <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border rounded" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Icon</label>
          <select {...register('icon')} className="w-full px-3 py-2 border rounded" style={inputStyle}>
            {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>{mode === 'create' ? 'Create' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MethodFormModal;