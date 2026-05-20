// src/renderer/pages/payments/methods/components/MethodCard.tsx
import React from 'react';
import { Edit, Trash2, Star } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { PaymentMethod } from '../../../../api/core/payment_method';

interface MethodCardProps {
  method: PaymentMethod;
  usageCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isAdmin?: boolean;
}

const MethodCard: React.FC<MethodCardProps> = ({ method, usageCount, onEdit, onDelete, onSetDefault, isAdmin = true }) => {
  const IconComponent = (Icons as any)[method.icon] || Icons.CreditCard;
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition relative" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      {method.isDefault && (
        <div className="absolute top-2 right-2" style={{ color: "var(--warning-color)" }}>
          <Star className="w-5 h-5 fill-current" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full" style={{ backgroundColor: "var(--accent-blue-light)", color: "var(--accent-blue)" }}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{method.name}</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{method.description}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Used in {usageCount} transactions</p>
        </div>
        {isAdmin && !method.isDefault && (
          <div className="flex gap-1">
            <button onClick={onSetDefault} className="p-1 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--warning-color)" }} title="Set as default"><Star className="w-4 h-4" /></button>
            <button onClick={onEdit} className="p-1 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--accent-blue)" }} title="Edit"><Edit className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--danger-color)" }} title="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodCard;