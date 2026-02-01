import React, { useRef, useEffect } from "react";
import { Eye, Info, Edit2, Globe, Lock, Trash2, RefreshCw, Shield } from "lucide-react";

export const FileContextMenu = ({ contextMenu, onClose, onAction, section }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  if (!contextMenu) return null;

  const { x, y, item } = contextMenu;
  const style = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 200),
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-base-100 shadow-xl border border-base-200 rounded-lg py-1 min-w-[180px] animate-in fade-in zoom-in duration-100"
      style={style}
    >
      {section === 'library' ? (
        <>
          <button onClick={() => onAction('preview', item)} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm">
            <Eye size={14} /> Preview
          </button>
          <button onClick={() => onAction('details', item)} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm">
            <Info size={14} /> Details
          </button>
          <button onClick={() => onAction('rename', item)} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm">
            <Edit2 size={14} /> Rename
          </button>
          
          <div className="divider my-0"></div>
          
          {/* [NEW] Role Management Option */}
          <button onClick={() => onAction('access', item)} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm font-medium text-primary">
            <Shield size={14} /> Manage Access
          </button>
          
          <div className="divider my-0"></div>
          
          <button onClick={() => onAction('visibility', { item, val: 'public' })} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm text-info">
            <Globe size={14} /> Make Public
          </button>
          <button onClick={() => onAction('visibility', { item, val: 'private' })} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm text-warning">
            <Lock size={14} /> Make Private
          </button>
          
          <div className="divider my-0"></div>
          
          <button onClick={() => onAction('delete', item)} className="w-full text-left px-4 py-2 hover:bg-error/10 text-error flex items-center gap-2 text-sm">
            <Trash2 size={14} /> Delete
          </button>
        </>
      ) : (
        <>
          <button onClick={() => onAction('restore', item)} className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2 text-sm text-success">
            <RefreshCw size={14} /> Restore
          </button>
          <div className="divider my-0"></div>
          <button onClick={() => onAction('forceDelete', item)} className="w-full text-left px-4 py-2 hover:bg-error/10 text-error flex items-center gap-2 text-sm">
            <Trash2 size={14} /> Delete Permanently
          </button>
        </>
      )}
    </div>
  );
};