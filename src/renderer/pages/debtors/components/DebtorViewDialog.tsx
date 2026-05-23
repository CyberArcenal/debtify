// src/renderer/pages/debtors/components/DebtorViewDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { User, Mail, Phone, MapPin, FileText, DollarSign, Loader2 } from "lucide-react";
import borrowersAPI from "../../../api/core/borrower";
import type { Borrower } from "../../../api/core/borrower";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface DebtorViewDialogProps {
  debtorId: number | null;
  isOpen: boolean;
  editable?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const DebtorViewDialog: React.FC<DebtorViewDialogProps> = ({ debtorId, editable, isOpen, onClose, onEdit }) => {
  const [debtor, setDebtor] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && debtorId) {
      const fetchDebtor = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await borrowersAPI.getById(debtorId);
          if (response.status) {
            setDebtor(response.data);
          } else {
            throw new Error(response.message);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load debtor details");
          setDebtor(null);
        } finally {
          setLoading(false);
        }
      };
      fetchDebtor();
    } else if (!isOpen) {
      // reset when modal closes
      setDebtor(null);
      setError(null);
    }
  }, [debtorId, isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-color)]" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button variant="secondary" onClick={onClose} className="mt-4">Close</Button>
        </div>
      );
    }

    if (!debtor) {
      return (
        <div className="text-center py-8 text-[var(--text-tertiary)]">
          No debtor data available.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-16 h-16 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--primary-color)]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{debtor.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">ID: {debtor.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Phone className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Contact</p>
              <p className="font-medium">{debtor.contact || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Mail className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Email</p>
              <p className="font-medium">{debtor.email || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)] md:col-span-2">
            <MapPin className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Address</p>
              <p className="font-medium">{debtor.address || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <DollarSign className="w-5 h-5 text-[var(--debt-high)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Outstanding Debt</p>
              <p className="font-bold text-lg" style={{ color: "var(--debt-high)" }}>
                {/* Total debt not directly available from Borrower API; you can compute it if needed */}
                N/A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <FileText className="w-5 h-5 text-[var(--accent-amber)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Status</p>
              <p className="font-medium">
                {debtor.deletedAt ? (
                  <span className="text-red-500">Deleted</span>
                ) : (
                  <span className="text-green-500">Active</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {debtor.notes && (
          <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Notes</p>
            <p className="whitespace-pre-wrap">{debtor.notes}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          {onEdit && !debtor.deletedAt && (
            <Button variant="primary" onClick={onEdit}>Edit Debtor</Button>
          )}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Debtor Details" size="lg">
      {renderContent()}
    </Modal>
  );
};

export default DebtorViewDialog;