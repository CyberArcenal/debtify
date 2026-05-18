// src/renderer/pages/debtors/group/components/GroupFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { DebtorGroup } from "../types";

interface GroupFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  group: DebtorGroup | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => void;
}

const GroupFormDialog: React.FC<GroupFormDialogProps> = ({ isOpen, mode, group, onClose, onSubmit }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: "", description: "", color: "#3b82f6" },
  });

  const selectedColor = watch("color");

  useEffect(() => {
    if (mode === "edit" && group) {
      reset({ name: group.name, description: group.description || "", color: group.color });
    } else {
      reset({ name: "", description: "", color: "#3b82f6" });
    }
  }, [mode, group, reset]);

  const handleFormSubmit = async (data: { name: string; description: string; color: string }) => {
    await onSubmit(data);
    onClose();
  };

  const presetColors = ["#10b981", "#3b82f6", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4898"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Create Group" : "Edit Group"} size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>Group Name *</label>
          <input
            {...register("name", { required: "Name is required" })}
            className="w-full px-3 py-2 border rounded-md"
            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>Description</label>
          <textarea {...register("description")} rows={2} className="w-full px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>Color</label>
          <div className="flex gap-2 flex-wrap">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${selectedColor === c ? "border-white ring-2 ring-offset-2 ring-[var(--primary-color)]" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                onClick={() => setValue("color", c)}
              />
            ))}
            <input {...register("color")} type="color" className="w-8 h-8 rounded border" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {mode === "create" ? "Create Group" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GroupFormDialog;