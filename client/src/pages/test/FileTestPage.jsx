import React, { useState, useEffect } from "react";
import api from "../../api";
import socket from "../../socket";
import { useRealtimeResource } from "../../hooks/useRealtimeResource";
import {
  Button,
  Input,
  Card,
  CategorizedFileViewer,
  FileUploadWidget,
  DataTable,
  Badge,
  ConfirmationModal,
} from "../../components/UI";
import {
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Database,
  RotateCcw,
  Archive,
} from "lucide-react";

const FileTestPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [newItemName, setNewItemName] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Realtime hook for active items
  const { data: items, loading: itemsLoading } =
    useRealtimeResource("test_items");

  const [trashItems, setTrashItems] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const fetchTrash = async () => {
    setTrashLoading(true);
    try {
      // FIX: Updated endpoint to /test_items/trash
      const res = await api.get("/test_items/trash");
      setTrashItems(res.data || []);
    } catch (err) {
      console.error("Failed to load trash:", err);
    } finally {
      setTrashLoading(false);
    }
  };

  const fetchActiveItem = async (id) => {
    try {
      // FIX: Updated endpoint to /test_items/:id
      const res = await api.get(`/test_items/${id}`);
      setActiveItem(res.data);
    } catch (err) {
      console.error(err);
      if (err.status === 404) setActiveItem(null);
    }
  };

  // --- TAB SWITCH EFFECT ---
  useEffect(() => {
    if (activeTab === "trash") fetchTrash();
  }, [activeTab]);

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    const handleTrashRefresh = () => {
      // Refresh trash if we are on that tab
      if (activeTab === "trash") fetchTrash();

      // If the active item we are viewing gets deleted, close the view
      if (activeItem) {
        // We can do a quick check via ID if the event data is available,
        // but a generic re-fetch is safer for consistency.
        fetchActiveItem(activeItem.id);
      }
    };

    socket.on("test_items_deleted", handleTrashRefresh);
    socket.on("test_items_created", handleTrashRefresh); // Handles Restore
    socket.on("test_items_updated", handleTrashRefresh); // Handles File Attach/Detach

    return () => {
      socket.off("test_items_deleted", handleTrashRefresh);
      socket.off("test_items_created", handleTrashRefresh);
      socket.off("test_items_updated", handleTrashRefresh);
    };
  }, [activeTab, activeItem]);

  const createTestResource = async () => {
    if (!newItemName) return;
    try {
      // FIX: Updated endpoint to /test_items
      await api.post("/test_items", { name: newItemName });
      setNewItemName("");
    } catch (err) {
      console.error(err);
    }
  };

  const [confirmState, setConfirmState] = useState(null);

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    const { type, id, payload } = confirmState;

    try {
      if (type === "delete_resource") {
        // FIX: Updated endpoint to /test_items
        await api.delete(`/test_items/${id}`);
        if (activeItem?.id === id) setActiveItem(null);
      } else if (type === "restore_resource") {
        // FIX: Updated endpoint to /test_items
        await api.post(`/test_items/${id}/restore`);
      } else if (type === "delete_file") {
        // NOTE: This remains /files as it uses the File Controller
        await api.delete(`/files/${id}`, {
          params: { relatedType: "test_items", relatedId: payload.parentId },
        });
        // fetchActiveItem handled by socket update
      }

      if (activeTab === "trash") fetchTrash();
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
      // FIX: Updated endpoint to /test_items/cleanup
      const res = await api.get("/test_items/cleanup");
      alert(res.message || "Cleanup complete");
      if (activeTab === "trash") fetchTrash();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  // --- COLUMNS ---
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
        <div className="flex gap-2">
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

  const trashColumns = [
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <span className="font-medium text-zinc-500">{row.name}</span>
      ),
    },
    {
      header: "Deleted",
      accessor: "deletedAt",
      render: (row) => (
        <span className="text-xs text-red-500">
          {new Date(row.deletedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Files",
      accessor: "fileCount",
      render: (row) => <Badge variant="neutral">{row.fileCount}</Badge>,
    },
    {
      header: "Restore",
      accessor: "id",
      render: (row) => (
        <Button
          size="xs"
          variant="primary"
          icon={RotateCcw}
          onClick={() =>
            setConfirmState({ type: "restore_resource", id: row.id })
          }
        >
          Restore
        </Button>
      ),
    },
  ];

  // Modal Content Logic
  const getModalContent = () => {
    switch (confirmState?.type) {
      case "delete_resource":
        return {
          title: "Move to Trash?",
          msg: "Item will be moved to Recycle Bin.",
          btn: "Move to Trash",
          danger: true,
        };
      case "restore_resource":
        return {
          title: "Restore Item?",
          msg: "Item will be restored to active list.",
          btn: "Restore",
          danger: false,
        };
      case "delete_file":
        return {
          title: "Remove File?",
          msg: "File will be detached and moved to trash.",
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
        {/* Left Column: List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "active" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
              onClick={() => setActiveTab("active")}
            >
              Active
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "trash" ? "bg-white shadow-sm text-red-600" : "text-zinc-500"}`}
              onClick={() => setActiveTab("trash")}
            >
              Recycle Bin
            </button>
          </div>

          {activeTab === "active" ? (
            <>
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
                />
              </Card>
            </>
          ) : (
            <Card className="overflow-hidden border-red-100 bg-red-50/10">
              <DataTable
                columns={trashColumns}
                data={trashItems}
                isLoading={trashLoading}
              />
            </Card>
          )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-700">
                      Upload New File
                    </h4>
                    <FileUploadWidget
                      relatedType="test_items"
                      relatedId={activeItem.id}
                      onSuccess={() => {
                        /* Handled by socket update */
                      }}
                    />
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-lg text-sm space-y-2 border border-zinc-100">
                    <p>
                      <span className="font-semibold">ID:</span>{" "}
                      <span className="font-mono text-xs">{activeItem.id}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      <Badge variant="success">Active</Badge>
                    </p>
                  </div>
                </div>
                <div className="h-px bg-zinc-100 my-6" />
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
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400">
              {activeTab === "trash" ? (
                <Archive size={48} className="mb-4 opacity-20" />
              ) : (
                <FileText size={48} className="mb-4 opacity-20" />
              )}
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
