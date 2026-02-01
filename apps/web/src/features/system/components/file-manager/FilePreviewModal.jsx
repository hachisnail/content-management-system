import React, { useState, useEffect } from "react";
import { X, Download, FileText, ExternalLink, Image as ImageIcon, Film } from "lucide-react";
import { fileApi } from "../../../../api/file.api";

export const FilePreviewModal = ({ file, isOpen, onClose }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize file data (handle Recycle Bin metadata structure vs Library structure)
  const isRecycleBin = !!file?.resourceType; // If it has resourceType, it's from Recycle Bin
  
  // Safe Accessors
  const fileId = file?.id;
  const fileName = isRecycleBin ? (file.name || "Unknown") : file?.originalName;
  const mimeType = isRecycleBin 
    ? (typeof file?.metadata === 'string' ? JSON.parse(file.metadata).mimeType : file?.metadata?.mimeType)
    : file?.mimetype;
  const isPrivate = isRecycleBin ? true : file?.visibility === 'private'; // Recycle bin files are effectively private/system

  // Reset state when file changes
  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setImgSrc(fileApi.getUrl(fileId, isPrivate));
    }
  }, [fileId, isOpen, isPrivate]);

  if (!isOpen || !file) return null;

  const isImage = mimeType?.startsWith("image/");
  const isVideo = mimeType?.startsWith("video/");
  const isPdf = mimeType === "application/pdf";

  const handleDownload = () => {
    fileApi.download(fileId, fileName, isPrivate);
  };

  return (
    <dialog className="modal modal-open bg-black/80 backdrop-blur-sm z-50">
      <div className="modal-box w-11/12 max-w-5xl h-[90vh] p-0 bg-base-100 flex flex-col overflow-hidden relative shadow-2xl rounded-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-100 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
               {isImage ? <ImageIcon size={20}/> : isVideo ? <Film size={20}/> : <FileText size={20}/>}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-lg truncate pr-4">{fileName}</h3>
              <span className="text-xs text-base-content/50 font-mono uppercase">{mimeType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn btn-sm btn-ghost gap-2 hidden sm:flex">
              <Download size={16}/> Download
            </button>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-base-200/50 flex items-center justify-center relative overflow-hidden p-4">
          
          {loading && isImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {isImage ? (
            <img 
              src={imgSrc} 
              alt={fileName} 
              className={`max-w-full max-h-full object-contain shadow-lg rounded-md transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : isVideo ? (
            <video controls className="max-w-full max-h-full rounded-lg shadow-lg bg-black">
              <source src={imgSrc} type={mimeType} />
              Your browser does not support the video tag.
            </video>
          ) : isPdf ? (
            <iframe src={imgSrc} className="w-full h-full rounded-lg shadow-sm bg-white" title="PDF Preview"></iframe>
          ) : (
            <div className="text-center p-8">
              <div className="bg-base-100 p-6 rounded-full inline-flex mb-4 shadow-sm">
                <FileText size={48} className="text-base-content/30" />
              </div>
              <p className="text-lg font-medium mb-2">No preview available</p>
              <p className="text-base-content/50 mb-6 max-w-xs mx-auto">
                This file type cannot be previewed directly in the browser.
              </p>
              <button onClick={handleDownload} className="btn btn-primary gap-2">
                <Download size={18} /> Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer (Mobile Actions) */}
        <div className="p-4 border-t border-base-200 bg-base-100 sm:hidden flex justify-end">
           <button onClick={handleDownload} className="btn btn-primary btn-sm w-full gap-2">
              <Download size={16}/> Download
            </button>
        </div>
      </div>
      
      {/* Backdrop Click to Close */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};