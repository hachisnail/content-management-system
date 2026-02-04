import { useState } from "react";
import { Folder, ChevronRight, ChevronDown } from "lucide-react";

export function MoveFileModal({ isOpen, onClose, tree, onSubmit, isMoving }) {
  const [selectedPath, setSelectedPath] = useState(null);

  // Recursive Tree Renderer for Selection
  const renderTree = (nodes, parentPath = "") => {
    return Object.entries(nodes || {}).map(([key, node]) => {
      const currentPath = parentPath ? `${parentPath}/${node.pathSegment || key}` : node.pathSegment || key;
      // Only allow moving into actual folders (categories), not just grouping nodes
      const isSelectable = node.action === "fetch_files" || node.pathSegment === "Uncategorized";

      return (
        <div key={currentPath} className="ml-4 border-l border-base-200 pl-2">
          <div 
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors
              ${selectedPath === currentPath ? "bg-primary/10 text-primary font-bold" : "hover:bg-base-200"}
              ${!isSelectable ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onClick={() => isSelectable && setSelectedPath(currentPath)}
          >
            <Folder size={14} className={selectedPath === currentPath ? "fill-primary" : ""} />
            <span>{node.name}</span>
          </div>
          {node.children && <div className="mt-1">{renderTree(node.children, currentPath)}</div>}
        </div>
      );
    });
  };

  const handleSubmit = () => {
    if (!selectedPath) return;
    
    // Parse path to backend expected format: RecordType/RecordId/Category
    const parts = selectedPath.split('/');
    
    // Uncategorized is a special root folder
    if (selectedPath === 'Uncategorized') {
        onSubmit({
            targetRecordType: 'Uncategorized',
            targetRecordId: null,
            targetCategory: null
        });
        return;
    }

    if (parts.length < 3) {
       alert("Please select a valid destination category (e.g. User > Name > Avatar)");
       return;
    }
    
    const [targetRecordType, targetRecordId, targetCategory] = parts;
    
    onSubmit({
        targetRecordType,
        targetRecordId,
        targetCategory
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-base-200">
          <h3 className="font-bold text-lg">Move Selection</h3>
          <p className="text-xs text-base-content/60">Select a destination folder</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           <div className="text-xs font-bold uppercase mb-2 opacity-50">Directories</div>
           {renderTree(tree.children)}
        </div>

        <div className="p-4 border-t border-base-200 flex justify-end gap-2">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-sm btn-primary" 
            disabled={!selectedPath || isMoving}
            onClick={handleSubmit}
          >
            {isMoving ? <span className="loading loading-spinner loading-xs"/> : "Move Here"}
          </button>
        </div>
      </div>
    </div>
  );
}