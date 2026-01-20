import { useState, useMemo, useRef } from "react"; // Added useRef for file clearing
import { UploadCloud } from "lucide-react";

import { useFileUpload } from "../../../hooks/useFileUpload";
import { useConfig } from "../../../context/ConfigContext";
import Select from "../forms/Select";
import Button from "../buttons/Button";
import Alert from "../feedback/Alert";

const FileUploadWidget = ({
  relatedType,
  relatedId,
  onSuccess,
  className = "",
}) => {
  const { upload, uploading, error } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("general");
  const fileInputRef = useRef(null); // Ref to clear input value after upload

  // 1. Get Limits
  const { FILE_LIMITS } = useConfig();

  // 2. Determine Max Size based on the 'relatedType' of this widget instance
  const maxSize = useMemo(() => {
    if (!FILE_LIMITS) return 25 * 1024 * 1024; // Safe default 25MB

    // Specific Limit? (e.g. 'audit_logs')
    if (FILE_LIMITS[relatedType]) return FILE_LIMITS[relatedType];

    // Default Document Limit
    return FILE_LIMITS.DOCUMENTS || 20 * 1024 * 1024;
  }, [FILE_LIMITS, relatedType]);

  const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "contracts", label: "Contracts & Legal" },
    { value: "invoices", label: "Invoices & Receipts" },
    { value: "gallery", label: "Gallery Images" },
    { value: "reports", label: "Reports" },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await upload(
        selectedFile,
        {
          relatedType,
          relatedId,
          category,
        },
        {
          maxSize: maxSize,
        }
      );

      // Reset state and clear the actual input DOM element
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      
      if (onSuccess) onSuccess();
    } catch (err) {
      // Error handled by hook
    }
  };

  const limitLabel = (maxSize / (1024 * 1024)).toFixed(0);

  return (
    <div
      className={`bg-zinc-50 border border-zinc-200 rounded-lg p-4 ${className}`}
    >
      <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
        <UploadCloud size={16} /> Upload Attachment
      </h4>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => {}}
          className="mb-3"
        />
      )}

      {/* LAYOUT FIX: 
         1. 'sm:items-end' ensures bottom alignment only on desktop.
         2. On mobile (default), items stretch or stack naturally.
      */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
            File{" "}
            <span className="text-zinc-400 font-normal normal-case">
              (Max {limitLabel}MB)
            </span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            label="Category"
            options={CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* LAYOUT FIX: 
           Added 'w-full sm:w-auto' to make button full-width on mobile 
           but auto-width on desktop.
        */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          isLoading={uploading}
          className="w-full sm:w-auto"
        >
          Upload
        </Button>
      </div>
    </div>
  );
};

export default FileUploadWidget;