import React, { useCallback, useState } from "react";
import { Upload, File, X, Image as ImageIcon } from "lucide-react";

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  currentFile?: File | null;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  currentFile = null,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 5,
  disabled = false,
  label = "Drag & drop a file here, or click to select",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const acceptedTypes = accept.split(",").map((t) => t.trim());
    if (!acceptedTypes.includes(fileExt)) {
      setError(`Invalid file type. Please upload ${accept}`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max size is ${maxSizeMB} MB`);
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    if (disabled) return;
    if (validateFile(file)) {
      onFileSelect(file);
    } else {
      onFileSelect(null);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, accept, maxSizeMB]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!currentFile ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragging ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10" : "border-[var(--border-color)] bg-[var(--card-secondary-bg)]"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--card-hover-bg)]"}
          `}
        >
          <Upload className="w-10 h-10 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Accepted: {accept} • Max {maxSizeMB} MB
          </p>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="border rounded-md p-3 bg-[var(--card-secondary-bg)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentFile.type.startsWith("image/") ? (
              <ImageIcon className="w-5 h-5 text-[var(--primary-color)]" />
            ) : (
              <File className="w-5 h-5 text-[var(--primary-color)]" />
            )}
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">{currentFile.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {(currentFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 rounded-full hover:bg-red-100 text-red-500"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;