import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useRealtimeResource } from "../../../../hooks/useRealtimeResource";
import {
  Button,
  Card,
  Badge,
  Alert,
  PageHeader,
} from "../../../../components/UI";
import { LoadingSpinner } from "../../../../components/StateComponents";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  AlertTriangle,
  FileText,
  User,
  Box,
  HardDrive,
} from "lucide-react";
import api from "../../../../api";

const getIconForType = (type) => {
  switch (type) {
    case "users":
      return User;
    case "files":
      return FileText;
    case "test_items":
      return Box;
    default:
      return HardDrive;
  }
};

const TrashItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use the context to set breadcrumbs if available
  const { setBreadcrumbLabel } = useOutletContext() || {};

  // --- REALTIME HOOK ---
  const {
    data: rawData, // Rename to rawData to handle potential wrapping
    loading,
    error,
  } = useRealtimeResource("admin/trash", {
    id,
  });

  // UNWRAP LOGIC: The API might return { success: true, data: {...} }
  const item = useMemo(() => {
    if (!rawData) return null;
    return rawData.success && rawData.data ? rawData.data : rawData;
  }, [rawData]);

  // Update Breadcrumbs
  useEffect(() => {
    if (item && setBreadcrumbLabel) {
      setBreadcrumbLabel(item.label || "Unknown Item");
    }
    return () => setBreadcrumbLabel && setBreadcrumbLabel(null);
  }, [item, setBreadcrumbLabel]);

  // Handle Restore Action
  const handleRestore = async () => {
    try {
      await api.post(`/admin/trash/${item.resourceType}/${item.id}/restore`);
      navigate("/admin/trash");
    } catch (err) {
      alert("Restore failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle Permanent Delete
  const handlePurge = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/trash/${item.resourceType}/${item.id}`);
      navigate("/admin/trash");
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  // --- RENDER STATES ---

  if (loading) {
    return <LoadingSpinner message="Loading snapshot..." />;
  }

  if (error || !item) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/trash")}
          className="pl-0"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Trash
        </Button>
        <Alert
          type="error"
          title="Item Not Found"
          message={
            error || "This item may have been restored or permanently deleted."
          }
        />
      </div>
    );
  }

  const Icon = getIconForType(item.resourceType);
  // Safely extract snapshot data.
  // item.data is the actual snapshot content (e.g. { size: 123, path: "..." })
  const snapshotData = item.data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* TOP NAVIGATION */}
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/trash")}
        className="pl-0 text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Recycle Bin
      </Button>

      {/* HEADER */}
      <PageHeader
        title={item.label}
        description={`Deleted from ${item.resourceType} • Original ID: ${item.id}`}
        icon={Icon}
        actions={
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handlePurge}
            >
              Delete Forever
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              onClick={handleRestore}
            >
              Restore Item
            </Button>
          </div>
        }
      />

      <Alert
        type="warning"
        icon={AlertTriangle}
        message="This item is currently in the recycle bin. It is not visible in the active system."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: SNAPSHOT DATA */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Snapshot Data">
            <div className="space-y-3">
              {Object.keys(snapshotData).length > 0 ? (
                Object.entries(snapshotData).map(([key, val]) => (
                  <div
                    key={key}
                    className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-2 last:border-0"
                  >
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider self-center">
                      {key}
                    </span>
                    <span className="col-span-2 text-sm text-zinc-700 font-mono break-all">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 italic text-sm">
                  No snapshot data available.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: SYSTEM METADATA */}
        <div className="space-y-6">
          <Card title="System Metadata">
            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Deleted At
                </span>
                <span className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                  {item.deletedAt
                    ? new Date(item.deletedAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Resource Type
                </span>
                <Badge variant="neutral" className="uppercase">
                  {item.resourceType}
                </Badge>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Deleted By
                </span>
                <span className="text-sm font-mono text-zinc-600 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 block truncate">
                  {item.deletedBy || "System"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrashItemDetails;
