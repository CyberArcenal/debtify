// src/renderer/pages/debtors/components/DebtorFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { dialogs } from "../../../utils/dialogs";
import type { Borrower, BorrowerCreateData, BorrowerUpdateData } from "../../../api/core/borrower";
import borrowersAPI from "../../../api/core/borrower";

interface DebtorFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  debtorId: number | null;
  initialData: Partial<Borrower> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  contact: string;
  email: string;
  address: string;
  notes: string;
};

const DebtorFormDialog: React.FC<DebtorFormDialogProps> = ({
  isOpen,
  mode,
  debtorId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { name: "", contact: "", email: "", address: "", notes: "" },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        contact: initialData.contact || "",
        email: initialData.email || "",
        address: initialData.address || "",
        notes: initialData.notes || "",
      });
    } else {
      reset();
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        await borrowersAPI.create(data as BorrowerCreateData);
        dialogs.success("Debtor created successfully");
      } else {
        if (!debtorId) throw new Error("Debtor ID missing");
        await borrowersAPI.update(debtorId, data as BorrowerUpdateData);
        dialogs.success("Debtor updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save debtor");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Add New Debtor" : "Edit Debtor"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Full Name *
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Contact Number
            </label>
            <input
              {...register("contact")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Address
            </label>
            <textarea
              {...register("address")}
              rows={2}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "add" ? "Create Debtor" : "Update Debtor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DebtorFormDialog;