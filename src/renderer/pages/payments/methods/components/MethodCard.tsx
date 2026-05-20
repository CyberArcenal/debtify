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
    <div className="border rounded-lg p-4 hover:shadow-md transition bg-white relative">
      {method.isDefault && <div className="absolute top-2 right-2 text-yellow-500"><Star className="w-5 h-5 fill-current" /></div>}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-blue-100"><IconComponent className="w-6 h-6 text-blue-600" /></div>
        <div className="flex-1">
          <h3 className="font-semibold">{method.name}</h3>
          <p className="text-sm text-gray-500">{method.description}</p>
          <p className="text-xs text-gray-400 mt-1">Used in {usageCount} transactions</p>
        </div>
        {isAdmin && !method.isDefault && (
          <div className="flex gap-1">
            <button onClick={onSetDefault} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Set as default"><Star className="w-4 h-4" /></button>
            <button onClick={onEdit} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodCard;