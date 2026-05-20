// src/renderer/pages/devices/components/AddDeviceModal.tsx
import React, { useState } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; deviceId: string }) => Promise<void>;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deviceId.trim()) return;
    setLoading(true);
    try {
      await onAdd({ name: name.trim(), deviceId: deviceId.trim() });
      setName("");
      setDeviceId("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Device" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Device Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., Laptop - Office" /></div>
        <div><label className="block text-sm font-medium mb-1">Device ID / Serial</label><input type="text" required value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., PC-12345 or MAC address" /></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={loading}>Add Device</Button></div>
      </form>
    </Modal>
  );
};

export default AddDeviceModal;