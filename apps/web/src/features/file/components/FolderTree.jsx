/**
 * web/src/features/file/components/FolderTree.jsx
 */
import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Archive, Layers, User, Database } from 'lucide-react';

const FolderNode = ({ node, nodeKey, parentPath = "", onSelect, activeFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Check if children object exists and has keys
  const hasChildren = node.children && Object.keys(node.children).length > 0;

  // Use pathSegment from node, or fallback to the key from the parent loop
  const segment = node.pathSegment || nodeKey;
  const fullPath = parentPath ? `${parentPath}/${segment}` : segment;
  const isActive = activeFolder === fullPath;

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(fullPath);
    if (hasChildren) setIsOpen(true);
  };

  let Icon = Folder;
  if (segment === 'users') Icon = User;
  if (segment === 'Uncategorized') Icon = Archive;
  if (segment === 'system') Icon = Database;

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm
          ${isActive ? 'bg-primary text-primary-content font-bold' : 'hover:bg-base-200 text-base-content/70'}
        `}
        style={{ paddingLeft: `${(parentPath.split('/').length || 1) * 0.5 + 0.5}rem` }}
        onClick={handleClick}
      >
        <button 
          className={`p-0.5 rounded-sm hover:bg-base-300 ${!hasChildren ? 'invisible' : ''}`}
          onClick={handleToggle}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        <Icon size={16} className={isActive ? 'text-primary-content' : 'text-primary'} />
        <span className="truncate">{node.name || segment}</span>
      </div>

      {isOpen && hasChildren && (
        <div>
          {Object.entries(node.children).map(([key, child]) => (
            <FolderNode 
              key={key} 
              nodeKey={key}
              node={child}
              parentPath={fullPath}
              onSelect={onSelect}
              activeFolder={activeFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree = ({ tree, onSelect, activeFolder }) => {
  if (!tree || !tree.children) return null;

  return (
    <div className="flex flex-col gap-1 py-2">
      {Object.entries(tree.children).map(([key, node]) => (
        <FolderNode 
          key={key} 
          nodeKey={key}
          node={node} 
          parentPath=""
          onSelect={onSelect} 
          activeFolder={activeFolder} 
        />
      ))}
    </div>
  );
};