// src/renderer/pages/payments/transactions/components/DeleteConfirmationModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  transaction: any;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, transaction, onClose, onConfirm, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Transaction" size="sm">
    <div className="space-y-4">
      <p>Are you sure you want to delete this transaction?</p>
      <p className="text-sm text-gray-500">Reference: {transaction?.reference || "N/A"}<br />Amount: {transaction?.amount}</p>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>Delete</Button></div>
    </div>
  </Modal>
);

export default DeleteConfirmationModal;