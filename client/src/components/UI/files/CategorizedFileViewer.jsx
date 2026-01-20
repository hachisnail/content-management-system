import FileCard from "./FileCard";
 
const CategorizedFileViewer = ({ files = [], className = "", onDelete }) => {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
        <p className="text-zinc-400 text-sm">No files attached yet.</p>
      </div>
    );
  }

  let grouped = {};
  if (Array.isArray(files)) {
    grouped = { general: files };
  } else {
    grouped = files;
  }

  const categories = Object.keys(grouped).filter(cat => grouped[cat] && grouped[cat].length > 0);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
        <p className="text-zinc-400 text-sm">No files attached yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {categories.map((cat) => (
        <div key={cat}>
          <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 pl-1">
            {cat.replace(/_/g, " ")} <span className="text-zinc-300 font-normal ml-1">({grouped[cat].length})</span>
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {grouped[cat].map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDelete={onDelete} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategorizedFileViewer;