import React from 'react';
import { File, FileImage, FileText, Globe, Lock, Trash2, Folder, Shield } from 'lucide-react';
import { fileApi } from '../../../../api/file.api';

const FileIcon = ({ mime, size = 24 }) => {
  if (!mime) return <File size={size} className="text-base-content/50" />;
  if (mime.startsWith("image/")) return <FileImage size={size} className="text-primary" />;
  if (mime === "application/pdf") return <FileText size={size} className="text-error" />;
  return <File size={size} className="text-base-content/50" />;
};

export const FileCard = ({ item, selected, onSelect, onContextMenu, onDoubleClick, isRecycleBin }) => {
  const name = isRecycleBin ? (item.name || "Unknown") : item.originalName;
  const size = isRecycleBin ? item.metadata?.size : item.size;
  const mime = isRecycleBin ? item.metadata?.mimeType : item.mimetype;
  const isImage = mime?.startsWith("image/");

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onSelect(e.ctrlKey || e.metaKey); }}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      className={`
        card card-compact border cursor-pointer group hover:shadow-md transition-all select-none
        ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-base-200 bg-base-100"}
      `}
    >
      <figure className="h-28 bg-base-200/50 relative flex items-center justify-center overflow-hidden">
        {!isRecycleBin && isImage ? (
          <img 
            src={fileApi.getUrl(item.id, item.visibility === "private")} 
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
          />
        ) : (
          isRecycleBin && item.resourceType !== 'files' ? (
             <Folder size={40} className="text-warning" />
          ) : (
             <FileIcon mime={mime} size={40} />
          )
        )}
      </figure>
      
      <div className="card-body p-2 gap-0">
        <h3 className="text-xs font-medium truncate w-full" title={name}>{name}</h3>
        <div className="flex justify-between items-center mt-1 text-[10px] opacity-60">
          <span>{size ? (size/1024).toFixed(0) + ' KB' : '-'}</span>
          {isRecycleBin ? (
             <span className="text-error flex items-center gap-1"><Trash2 size={10}/> Deleted</span>
          ) : (
             item.visibility === 'public' ? <Globe size={10} className="text-info"/> : 
             (item.allowedRoles?.length > 0 ? <Shield size={10} className="text-primary"/> : <Lock size={10} className="text-warning"/>)
          )}
        </div>
      </div>
    </div>
  );
};