import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export const TableContextMenu = ({ item, actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!actions) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`btn btn-ghost btn-xs btn-square ${isOpen ? 'bg-base-200 text-primary' : 'text-base-content/60'}`}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-base-100 shadow-xl ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in duration-100 border border-base-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false); // Close on selection
          }}
        >
          <div className="py-1 flex flex-col">
            {React.Children.map(actions(item), (child, i) => (
              <div key={i} className="w-full [&>button]:w-full [&>button]:rounded-none [&>button]:justify-start [&>button]:btn-ghost [&>button]:btn-sm [&>button]:font-normal">
                {child}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};