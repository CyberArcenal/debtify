// src/renderer/pages/devices/components/DeleteConfirmationModal.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  printerName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, printerName, onClose, onConfirm, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Printer" size="sm">
    <div className="space-y-4"><p>Permanently delete printer <strong>{printerName}</strong>?</p><p className="text-sm text-red-500">This action cannot be undone.</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>Delete</Button></div></div>
  </Modal>
);
export default DeleteConfirmationModal;