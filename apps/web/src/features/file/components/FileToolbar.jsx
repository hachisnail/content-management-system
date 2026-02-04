import {
  Search,
  LayoutGrid,
  List as ListIcon,
  FolderInput,
} from "lucide-react";

export function FileToolbar({
  state,
  onSearch,
  onViewChange,
  onMove,
  onClearSelection,
}) {
  const { viewMode, searchTerm, selectedIds } = state;

  return (
    <div className="p-2 border-b border-base-200 flex flex-wrap gap-2 items-center justify-between bg-base-100 shrink-0">
      {/* LEFT: Search & Selection Info */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <div className="join w-full max-w-xs">
          <div className="join-item flex items-center justify-center bg-base-200 px-3 border border-base-300 border-r-0">
            <Search size={16} className="opacity-50" />
          </div>
          <input
            type="text"
            placeholder="Search files..."
            className="input input-sm join-item input-bordered w-full focus:outline-none"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2">
            <span className="badge badge-primary badge-outline">
              {selectedIds.size} selected
            </span>
            <button
              onClick={onClearSelection}
              className="btn btn-xs btn-ghost text-error"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Actions & View Toggles */}
      <div className="flex items-center gap-2">
        {selectedIds.size > 0 && (
          <div className="join">
            <button
              onClick={onMove}
              className="btn btn-sm btn-neutral join-item"
              title="Move"
            >
              <FolderInput size={16} />
              <span className="hidden sm:inline">Move</span>
            </button>
          </div>
        )}

        <div className="divider divider-horizontal mx-0 my-1"></div>

        <div className="join bg-base-200 p-1 rounded-lg">
          <button
            onClick={() => onViewChange("grid")}
            className={`btn btn-xs join-item border-none ${viewMode === "grid" ? "btn-white shadow-sm" : "btn-ghost opacity-50"}`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`btn btn-xs join-item border-none ${viewMode === "list" ? "btn-white shadow-sm" : "btn-ghost opacity-50"}`}
            title="List View"
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
