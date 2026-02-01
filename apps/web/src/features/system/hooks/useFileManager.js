import { useState, useEffect, useMemo } from "react";
import apiClient from "../../../api/client";
import { fileApi } from "../../../api/file.api";
import { useAuth } from "../../auth/hooks/useAuth";

export const useFileManager = () => {
  const { refreshUser } = useAuth();
  
  // State
  const [section, setSection] = useState("library");
  const [viewMode, setViewMode] = useState("grid"); 
  const [groupBy, setGroupBy] = useState("none"); 
  
  const [data, setData] = useState([]); 
  const [tree, setTree] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeItem, setActiveItem] = useState(null); 
  const [previewItem, setPreviewItem] = useState(null);

  // Fetch
  const loadData = async () => {
    setLoading(true);
    try {
      if (section === 'library') {
        const filesRes = await apiClient.get("/files", { params: { limit: 1000, ...filters } });
        setTree({}); 
        setData(filesRes.data.items || []); 
      } else {
        const res = await apiClient.get("/recycle-bin");
        setData(res.data.data || res.data || []);
      }
      setSelectedIds(new Set());
      setActiveItem(null); 
    } catch (err) {
      console.error("Load failed", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [section, filters]);

  // Filtering (No Change)
  const filteredItems = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(item => {
      const name = item.originalName || item.name || "Unknown";
      return name.toLowerCase().includes(lower);
    });
  }, [data, searchTerm]);

  // Grouping (No Change)
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') return { "All Files": filteredItems };
    return filteredItems.reduce((groups, item) => {
      let key = "Uncategorized";
      if (section === 'library') {
        if (item.links && item.links.length > 0) {
          const link = item.links[0];
          key = `${link.recordType.charAt(0).toUpperCase() + link.recordType.slice(1)}` 
              + (link.category ? ` - ${link.category}` : "");
        }
      } else {
        let meta = item.metadata;
        if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch (e) { meta = {}; } }
        if (item.resourceType === 'files' && meta?.category) {
             const type = meta.linkedRecordType || 'Files';
             const category = meta.category;
             key = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${category.charAt(0).toUpperCase() + category.slice(1)}`;
        } else {
             key = item.resourceType.toUpperCase();
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }, [filteredItems, groupBy, section]);

  // Selection
  const handleSelect = (id, multi, shouldActivate = true) => {
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    if (shouldActivate && newSet.size === 1) {
      setActiveItem(data.find(i => i.id === id));
    } else if (newSet.size === 0) {
      setActiveItem(null);
    }
  };

  const clearSelection = () => { setSelectedIds(new Set()); setActiveItem(null); };

  const executeAction = async (actionType, payload) => {
    try {
      switch (actionType) {
        case 'delete':
          await Promise.all([...selectedIds].map(id => apiClient.delete(`/files/${id}`)));
          break;
        case 'restore':
          await Promise.all([...payload.ids].map(id => apiClient.post(`/recycle-bin/${id}/restore`)));
          await refreshUser(); 
          break;
        case 'forceDelete':
          await Promise.all([...payload.ids].map(id => apiClient.delete(`/recycle-bin/${id}`)));
          break;
        case 'rename':
          await fileApi.rename(payload.id, payload.newName);
          break;
        case 'visibility':
          await Promise.all([...payload.ids].map(id => 
            fileApi.update(id, { visibility: payload.visibility })
          ));
          break;
        case 'access': // [NEW] Role updates
          await fileApi.update(payload.id, { allowedRoles: payload.allowedRoles });
          break;
      }
      loadData();
      return true;
    } catch (err) {
      alert("Action failed: " + err.message);
      console.error(err);
      return false;
    }
  };

  return {
    section, setSection,
    viewMode, setViewMode,
    groupBy, setGroupBy,
    tree,
    loading,
    filters, setFilters,
    searchTerm, setSearchTerm,
    selectedIds, setSelectedIds,
    activeItem, setActiveItem,
    previewItem, setPreviewItem,
    groupedItems,
    handleSelect,
    clearSelection,
    executeAction
  };
};