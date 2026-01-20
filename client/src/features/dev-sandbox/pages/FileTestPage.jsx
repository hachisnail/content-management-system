import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import socket from "@/lib/socket";
import { useRealtimeResource } from "@/hooks/useRealtimeResource";
import {
  Button,
  Input,
  Card,
  CategorizedFileViewer,
  FileUploadWidget,
  DataTable,
  Badge,
  ConfirmationModal,
} from "@/components/UI";
import {
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Database,
  Info, // Added icon for metadata
} from "lucide-react";

const FileTestPage = () => {
  const [newItemName, setNewItemName] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  // Realtime hook for active items
  const { data: items, loading: itemsLoading } = useRealtimeResource("test_items");

  const fetchActiveItem = async (id) => {
    try {
      const res = await api.get(`/test_items/${id}`);
      setActiveItem(res.data);
    } catch (err) {
      console.error(err);
      if (err.status === 404) setActiveItem(null);
    }
  };

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    const handleUpdate = (data) => {
      if (activeItem && data.id === activeItem.id) {
        fetchActiveItem(activeItem.id);
      }
    };

    const handleDelete = (data) => {
      if (activeItem && (data.id === activeItem.id || data.ids?.includes(activeItem.id))) {
        setActiveItem(null);
      }
    };

    socket.on("test_items_updated", handleUpdate);
    socket.on("test_items_deleted", handleDelete);

    return () => {
      socket.off("test_items_updated", handleUpdate);
      socket.off("test_items_deleted", handleDelete);
    };
  }, [activeItem]);

  const createTestResource = async () => {
    if (!newItemName) return;
    try {
      await api.post("/test_items", { name: newItemName });
      setNewItemName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    const { type, id, payload } = confirmState;

    try {
      if (type === "delete_resource") {
        await api.delete(`/test_items/${id}`);
        if (activeItem?.id === id) setActiveItem(null);
      } else if (type === "delete_file") {
        await api.delete(`/files/${id}`, {
          params: { relatedType: "test_items", relatedId: payload.parentId },
        });
      }
    } catch (err) {
      console.error("Action failed", err);
      alert("Action failed: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmState(null);
    }
  };

  const runSystemCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await api.get("/test_items/cleanup");
      alert(res.message || "Cleanup complete");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  const activeColumns = [
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <span className="font-medium text-zinc-900">{row.name}</span>
      ),
    },
    {
      header: "Files",
      accessor: "fileCount",
      render: (row) => <Badge variant="neutral">{row.fileCount}</Badge>,
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Button
            size="xs"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              fetchActiveItem(row.id);
            }}
          >
            View
          </Button>
          <Button
            size="xs"
            variant="danger"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmState({ type: "delete_resource", id: row.id });
            }}
          />
        </div>
      ),
    },
  ];

  const getModalContent = () => {
    switch (confirmState?.type) {
      case "delete_resource":
        return {
          title: "Delete Resource?",
          msg: "This action cannot be undone immediately.",
          btn: "Delete",
          danger: true,
        };
      case "delete_file":
        return {
          title: "Remove File?",
          msg: "File will be detached.",
          btn: "Remove",
          danger: true,
        };
      default:
        return {
          title: "Confirm",
          msg: "Are you sure?",
          btn: "Confirm",
          danger: false,
        };
    }
  };
  const modalContent = getModalContent();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Resource Manager</h1>
          <p className="text-zinc-500 text-sm">
            Realtime State Management Test
          </p>
        </div>
        <Button
          variant="secondary"
          icon={Database}
          onClick={runSystemCleanup}
          isLoading={isCleaning}
        >
          Run Maintenance
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input + List */}
        <div className="lg:col-span-4 space-y-6">
          <Card title="New Resource">
            <div className="flex gap-2">
              <Input
                placeholder="Name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Button onClick={createTestResource} icon={Plus}>
                Add
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <DataTable
              columns={activeColumns}
              data={items}
              isLoading={itemsLoading}
              onRowClick={(row) => fetchActiveItem(row.id)}
            />
          </Card>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8">
          {activeItem ? (
            <div className="space-y-6">
              <Card
                title={activeItem.name}
                action={
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={RefreshCw}
                    onClick={() => fetchActiveItem(activeItem.id)}
                  >
                    Refresh
                  </Button>
                }
              >
                {/* --- LAYOUT REFACTOR START --- */}
                <div className="space-y-6">
                  
                  {/* 1. Metadata Bar (Full Width) */}
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Info size={14} />
                      <span className="font-mono text-xs select-all">{activeItem.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Status</span>
                       <Badge variant="success">Active</Badge>
                    </div>
                  </div>

                  {/* 2. Upload Widget (Full Width - Solves the Squeeze) */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      Upload Attachment
                    </h4>
                    <div className="bg-white">
                        <FileUploadWidget
                          relatedType="test_items"
                          relatedId={activeItem.id}
                          onSuccess={() => { /* Socket handles update */ }}
                        />
                    </div>
                  </div>

                  {/* 3. File Viewer */}
                  <div className="pt-2 border-t border-zinc-100">
                    <CategorizedFileViewer
                      files={activeItem.files || []}
                      onDelete={(file) =>
                        setConfirmState({
                          type: "delete_file",
                          id: file.id,
                          payload: { parentId: activeItem.id },
                        })
                      }
                    />
                  </div>
                </div>
                {/* --- LAYOUT REFACTOR END --- */}
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Select an item to view details</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        title={modalContent.title}
        message={modalContent.msg}
        confirmLabel={modalContent.btn}
        isDangerous={modalContent.danger}
      />
    </div>
  );
};

export default FileTestPage;