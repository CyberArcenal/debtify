// src/renderer/pages/devices/components/PrinterFormModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface PrinterFormModalProps {
  isOpen: boolean;
  printer: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

type FormData = {
  name: string;
  description: string;
  interface: "usb" | "network" | "bluetooth";
  connectionString: string;
};

const PrinterFormModal: React.FC<PrinterFormModalProps> = ({ isOpen, printer, onClose, onSave }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { name: "", description: "", interface: "usb", connectionString: "" },
  });

  useEffect(() => {
    if (printer) {
      reset({ name: printer.name, description: printer.description || "", interface: printer.interface, connectionString: printer.connectionString });
    } else {
      reset({ name: "", description: "", interface: "usb", connectionString: "" });
    }
  }, [printer, reset]);

  const onSubmit = (data: FormData) => {
    onSave(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={printer ? "Edit Printer" : "Add Printer"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Printer Name *</label><input {...register("name", { required: "Name required" })} className="w-full px-3 py-2 border rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea {...register("description")} rows={2} className="w-full px-3 py-2 border rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Interface *</label><select {...register("interface", { required: true })} className="w-full px-3 py-2 border rounded"><option value="usb">USB</option><option value="network">Network (Ethernet/WiFi)</option><option value="bluetooth">Bluetooth</option></select></div>
        <div><label className="block text-sm font-medium mb-1">Connection String *</label><input {...register("connectionString", { required: "Connection string required" })} className="w-full px-3 py-2 border rounded" placeholder="e.g., USB001, 192.168.1.100:9100, 00:11:22:33:44:55" /></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={isSubmitting}>{printer ? "Update" : "Add"}</Button></div>
      </form>
    </Modal>
  );
};

export default PrinterFormModal;