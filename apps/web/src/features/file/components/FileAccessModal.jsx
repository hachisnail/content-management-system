import React, { useState, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { usePermission } from '../../../providers/PermissionProvider'; // [FIX] Use Provider

export const FileAccessModal = ({ isOpen, onClose, file, onSave }) => {
  const { rolesConfig } = usePermission(); // [FIX] Get roles from configuration
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    if (file && file.allowedRoles) {
      const roles = Array.isArray(file.allowedRoles) ? file.allowedRoles : [];
      setSelectedRoles(roles);
    } else {
      setSelectedRoles([]);
    }
  }, [file]);

  const toggleRole = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const handleSubmit = () => {
    onSave(file.id, selectedRoles);
    onClose();
  };

  if (!isOpen) return null;

  // [FIX] Generate available roles dynamically
  // 1. Get all role values
  // 2. Filter out SUPERADMIN (they always have access, no need to check)
  // 3. Map to UI format
  const availableRoles = Object.values(rolesConfig || {})
    .filter(role => role !== rolesConfig.SUPERADMIN)
    .map(role => ({
      key: role,
      // Capitalize first letter for label (e.g., 'admin' -> 'Admin')
      label: role.charAt(0).toUpperCase() + role.slice(1)
    }));

  return (
    <div className="modal modal-open z-[999]">
      <div className="modal-box relative">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          <X size={18} />
        </button>
        
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Shield className="text-primary" size={20} />
          Manage File Access
        </h3>
        
        <p className="text-sm opacity-70 mb-4">
          Select which roles are allowed to view and download <span className="font-bold">{file?.originalName}</span>.
          <br/>
          <span className="text-xs italic text-warning">Note: Public files are visible to everyone regardless of these settings. Superadmins always have access.</span>
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {availableRoles.length > 0 ? (
            availableRoles.map((role) => {
              const isSelected = selectedRoles.includes(role.key);
              return (
                <div 
                  key={role.key} 
                  onClick={() => toggleRole(role.key)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected ? 'border-primary bg-primary/10' : 'border-base-200 hover:bg-base-200/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-base-content/30'}`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="font-medium">{role.label}</span>
                  </div>
                  {isSelected && <span className="text-xs text-primary font-bold">Allowed</span>}
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-sm opacity-50">Loading roles...</div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};