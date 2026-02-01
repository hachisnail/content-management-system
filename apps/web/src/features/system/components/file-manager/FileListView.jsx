import React from 'react';
import { File, FileImage, FileText, Globe, Lock, Trash2, Folder, RefreshCw } from 'lucide-react';
import { fileApi } from '../../../../api/file.api';
import { Avatar } from '../../../../components/common';

const FileIcon = ({ mime, size = 20 }) => {
  if (!mime) return <File size={size} className="text-base-content/50" />;
  if (mime.startsWith("image/")) return <FileImage size={size} className="text-primary" />;
  if (mime === "application/pdf") return <FileText size={size} className="text-error" />;
  return <File size={size} className="text-base-content/50" />;
};

export const FileListView = ({ items, selectedIds, onSelect, onContextMenu, onDoubleClick, isRecycleBin, onRestore, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm table-pin-rows bg-base-100 border border-base-200 rounded-lg">
        <thead>
          <tr className="bg-base-200/50">
            <th>Name</th>
            {isRecycleBin ? (
              <>
                <th>Category</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th className="text-right">Actions</th>
              </>
            ) : (
              <>
                <th>Size</th>
                <th>Visibility</th>
                <th>Date</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const name = isRecycleBin ? (item.name || "Unknown") : item.originalName;
            const size = isRecycleBin ? item.metadata?.size : item.size;
            const mime = isRecycleBin ? item.metadata?.mimeType : item.mimetype;

            return (
              <tr 
                key={item.id}
                onContextMenu={(e) => onContextMenu(e, item)}
                onDoubleClick={() => onDoubleClick && onDoubleClick(item)}
                onClick={(e) => { e.stopPropagation(); onSelect(item.id, e.ctrlKey || e.metaKey); }}
                className={`cursor-pointer hover:bg-base-100 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
              >
                {/* NAME COLUMN */}
                <td>
                  <div className="flex items-center gap-3">
                     {isRecycleBin && item.resourceType !== 'files' ? (
                        <Folder size={20} className="text-warning shrink-0" />
                     ) : (
                        <div className="w-8 h-8 rounded bg-base-200 flex items-center justify-center shrink-0 overflow-hidden">
                           {mime?.startsWith('image/') && !isRecycleBin ? (
                             <img src={fileApi.getUrl(item.id, item.visibility === 'private')} className="w-full h-full object-cover"/>
                           ) : (
                             <FileIcon mime={mime} />
                           )}
                        </div>
                     )}
                     <span className="font-medium truncate max-w-xs" title={name}>{name}</span>
                  </div>
                </td>

                {/* METADATA COLUMNS */}
                {isRecycleBin ? (
                  <>
                    <td className="text-xs uppercase font-bold opacity-60">
                        {/* [FIX] Display specific category from metadata if available */}
                        {item.metadata?.category || item.resourceType}
                    </td>
                    <td>
                      {item.deleter ? (
                         <div className="flex items-center gap-2">
                           <Avatar user={item.deleter} size="w-5 h-5" textSize="text-[10px]" />
                           <span className="text-xs opacity-70">{item.deleter.firstName}</span>
                         </div>
                      ) : <span className="text-xs opacity-50">System</span>}
                    </td>
                    <td className="text-xs opacity-50">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                       <div className="flex justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onRestore(item); }} className="btn btn-xs btn-ghost text-success"><RefreshCw size={14}/></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="btn btn-xs btn-ghost text-error"><Trash2 size={14}/></button>
                       </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="font-mono text-xs opacity-60">{size ? (size/1024).toFixed(0) + ' KB' : '-'}</td>
                    <td>
                      <span className={`badge badge-xs gap-1 ${item.visibility === 'public' ? 'badge-info' : 'badge-warning'}`}>
                        {item.visibility === 'public' ? <Globe size={10}/> : <Lock size={10}/>}
                        {item.visibility}
                      </span>
                    </td>
                    <td className="text-xs opacity-50">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};