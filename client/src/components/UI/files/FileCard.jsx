import { FileText, ExternalLink, Download, Trash2 } from "lucide-react";

 const FileCard = ({ file, onDelete }) => {
  const isImage = file.mimeType?.startsWith("image/");
  const fileUrl = `/api/files/${file.id}`; 

  return (
    <div className="group relative bg-white border border-zinc-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-zinc-300">
      <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img
            src={fileUrl}
            alt={file.originalName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-zinc-400">
            <FileText size={48} strokeWidth={1} />
          </div>
        )}

        {/* ACTIONS OVERLAY */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white rounded-full text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
            title="Download / View"
          >
            {isImage ? <ExternalLink size={16} /> : <Download size={16} />}
          </a>
          
          {onDelete && (
            <button
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onDelete(file); 
              }}
              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg"
              title="Remove File"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate" title={file.originalName}>
              {file.originalName}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(file.size / 1024).toFixed(0)} KB • {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default FileCard;