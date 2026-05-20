// src/renderer/pages/devices/components/RevokeConfirmationModal.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface RevokeConfirmationModalProps {
  isOpen: boolean;
  device: { name: string; deviceId: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const RevokeConfirmationModal: React.FC<RevokeConfirmationModalProps> = ({ isOpen, device, onClose, onConfirm, loading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revoke Device" size="sm">
      <div className="space-y-4">
        <p>Are you sure you want to revoke <strong>{device?.name}</strong>?</p>
        <p className="text-sm text-red-500">This device will no longer be able to access the system.</p>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>Revoke</Button></div>
      </div>
    </Modal>
  );
};

export default RevokeConfirmationModal;