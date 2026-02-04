import { useState, useEffect, useMemo, useCallback } from "react";
import { fileApi } from "../api/file.api";
import apiClient from "../../../api/client"; 
import { useAuth } from "../../auth/hooks/useAuth";

export const useFileManager = (initialPath = null) => {
  const { refreshUser } = useAuth();
  
  // -- State --
  const [viewMode, setViewMode] = useState("grid"); 
  const [data, setData] = useState([]); 
  const [tree, setTree] = useState({ children: {} }); 
  const [loading, setLoading] = useState(true);
  
  const [activeFolder, setActiveFolder] = useState(initialPath); 
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeItem, setActiveItem] = useState(null); 
  const [previewItem, setPreviewItem] = useState(null);

  const [section, setSection] = useState("library");
  const [groupBy, setGroupBy] = useState("none");
  const [filters, setFilters] = useState({});

  // -- 0. Init Tree (Separated to prevent loops) --
  // [FIX] This effect handles tree fetching independently of content loading
  useEffect(() => {
    if (section === 'library') {
       fileApi.getTree()
         .then(res => {
             setTree(res.data || { children: {} });
         })
         .catch(err => console.error("Failed to load directory tree:", err));
    }
  }, [section]);

  // -- 1. Load Content --
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      // Recycle Bin Logic
      if (section === 'recycle') {
          try {
              const res = await apiClient.get('/recycle-bin');
              const binItems = (res.data.data || []).map(item => {
                  let meta = item.metadata;
                  if (typeof meta === 'string') {
                      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
                  }

                  return {
                      id: item.id,
                      name: item.name, 
                      originalName: item.name,
                      size: meta?.size || 0,
                      mimetype: meta?.mimeType || meta?.mimetype || 'unknown',
                      createdAt: item.createdAt, 
                      deleter: item.deleter,
                      isRecycleBin: true,
                      resourceType: item.resourceType,
                      metadata: meta
                  };
              });
              setData(binItems);
          } catch (e) {
              console.error("Failed to load recycle bin:", e);
              if (e.response && e.response.status === 403) {
                  setSection("library");
              }
              setData([]);
          }
          setLoading(false);
          return;
      }

      // Library Logic
      let currentTree = tree;
      // [FIX] Removed the "if tree empty then fetch" logic block here

      let folderItems = [];
      let nodes = currentTree.children || {};

      if (activeFolder) {
        const parts = activeFolder.split('/');
        let currentNode = currentTree;
        for (const part of parts) {
            currentNode = currentNode?.children?.[part];
            if (!currentNode) break;
        }
        nodes = currentNode?.children || {};
      }

      folderItems = Object.entries(nodes).map(([key, node]) => ({
        id: `folder-${activeFolder ? activeFolder + '/' : ''}${node.pathSegment || key}`,
        path: activeFolder ? `${activeFolder}/${node.pathSegment || key}` : (node.pathSegment || key),
        originalName: node.name || key,
        name: node.name || key, 
        isFolder: true,
        type: 'folder'
      }));

      let fileItems = [];
      if (activeFolder) {
          try {
              const res = await fileApi.getList(activeFolder, { limit: 1000, ...filters });
              fileItems = (res.data.data || []).map(f => ({
                  ...f,
                  name: f.originalName
              }));
          } catch (e) {
              fileItems = [];
          }
      }

      setData([...folderItems, ...fileItems]);
      setSelectedIds(new Set());
      setActiveItem(null);

    } catch (err) {
      console.error("FileManager Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, tree, section, filters]);

  useEffect(() => { loadContent(); }, [loadContent]);

  // -- 2. Filtering --
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(item => (item.originalName || item.name || "").toLowerCase().includes(lower));
  }, [data, searchTerm]);

  // Grouping
  const groupedItems = useMemo(() => {
    if (section === 'recycle') {
        return { "Deleted Items": filteredData };
    }
    return { "Files": filteredData };
  }, [filteredData, section]);

  // -- Actions --
  const navigateTo = (path) => {
    setActiveFolder(path);
    setSearchTerm("");
  };

  const navigateUp = () => {
    if (!activeFolder) return;
    const parts = activeFolder.split('/');
    parts.pop();
    setActiveFolder(parts.length > 0 ? parts.join('/') : null);
  };

  const handleSelect = (id, multi) => {
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    
    if (newSet.size === 1) {
      const item = data.find(i => i.id === id);
      if (item) setActiveItem(item);
    } else {
      setActiveItem(null);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setActiveItem(null);
  };

  const executeAction = async (action, payload) => {
    try {
      if (action === 'delete') {
         await Promise.all(Array.from(selectedIds).map(id => fileApi.delete(id)));
      }
      else if (action === 'rename') {
         await fileApi.update(payload.id, { name: payload.newName });
      }
      else if (action === 'move') {
         await Promise.all(Array.from(selectedIds).map(id => fileApi.move(id, payload)));
      }
      else if (action === 'visibility') {
         await fileApi.updateVisibility(Array.from(selectedIds), payload.visibility);
      }
      else if (action === 'access') {
         await fileApi.update(payload.id, { allowedRoles: payload.allowedRoles });
      }
      else if (action === 'restore') {
         const ids = payload.ids ? Array.from(payload.ids) : Array.from(selectedIds);
         await Promise.all(ids.map(id => apiClient.post(`/recycle-bin/${id}/restore`)));
      }
      else if (action === 'forceDelete') {
         const ids = payload.ids ? Array.from(payload.ids) : Array.from(selectedIds);
         await Promise.all(ids.map(id => apiClient.delete(`/recycle-bin/${id}`)));
      }
      
      // Refresh logic: Refresh tree if we moved/deleted folders, otherwise just content
      if (action === 'move' || action === 'delete' || action === 'restore') {
          if (section === 'library') {
             const treeRes = await fileApi.getTree();
             setTree(treeRes.data || { children: {} });
          }
      }
      await loadContent();
      return true;
    } catch (err) {
      console.error(err);
      alert("Action failed: " + (err.response?.data?.message || err.message));
      return false;
    }
  };

  return {
    data: filteredData,
    tree, loading,
    viewMode, setViewMode,
    activeFolder, navigateTo, navigateUp,
    searchTerm, setSearchTerm,
    selectedIds, handleSelect, setSelectedIds, clearSelection,
    activeItem, setActiveItem,
    previewItem, setPreviewItem,
    executeAction,
    refresh: loadContent,
    section, setSection,
    groupBy, setGroupBy,
    filters, setFilters,
    groupedItems
  };
};