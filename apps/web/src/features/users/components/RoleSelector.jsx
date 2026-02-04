import React from 'react';
import { Check, Shield } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePermission } from '../../../providers/PermissionProvider'; 

const getRoleBadgeColor = (role) => {
    if (role === 'superadmin') return 'badge-error';
    if (role === 'admin') return 'badge-warning';
    if (role === 'curator') return 'badge-primary';
    if (role === 'editor') return 'badge-secondary';
    if (role === 'scheduler') return 'badge-accent';
    if (role === 'auditor') return 'badge-info';
    return 'badge-ghost';
};

export const RoleSelector = ({ selectedRoles = [], onChange, disabled = false }) => {
  const { user: currentUser } = useAuth();
  
  // [FIX] Destructure isLoading to handle the initialization phase
  const { rolesConfig, hierarchy, isLoading: isPermsLoading } = usePermission();

  // [UX] Skeleton Loader: Prevents rendering empty grid while fetching rules
  if (isPermsLoading) {
    return (
      <div className="form-control animate-pulse">
        <label className="label">
          <div className="h-4 w-32 bg-base-300 rounded"></div>
        </label>
        <div className="p-4 border rounded-lg border-base-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-8 bg-base-300 rounded opacity-50"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate Rank safely
  const currentUserRank = Math.max(...(currentUser?.roles || []).map(r => hierarchy[r] || 0));
  const isSuperAdmin = currentUser?.roles?.includes(rolesConfig?.SUPERADMIN);

  const handleToggle = (role) => {
    if (disabled) return;
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // Prevent removing the last role
      onChange(selectedRoles.filter(r => r !== role));
    } else {
      onChange([...selectedRoles, role]);
    }
  };

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text flex items-center gap-2 font-medium">
          <Shield size={16}/> Assigned Roles
        </span>
        <span className="label-text-alt opacity-60">Select all that apply</span>
      </label>
      
      <div className={`p-4 border rounded-lg transition-colors ${disabled ? 'bg-base-100 border-transparent p-0' : 'bg-base-200/30 border-base-300'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(rolesConfig || {}).map((role) => {
            const isSelected = selectedRoles.includes(role);
            
            // [LOGIC] Dynamic Rank Check using server hierarchy
            const roleRank = hierarchy[role] || 0;
            
            // Rule: You can only assign roles strictly lower than yours, unless you are Superadmin
            const isRankAllowed = isSuperAdmin || roleRank < currentUserRank;
            
            // Disable if parent is disabled OR if rank logic forbids it
            const isItemDisabled = disabled || !isRankAllowed;

            // Clean UI: If disabled (View Mode), only show the roles the user actually has
            if (disabled && !isSelected) return null; 

            return (
              <button
                key={role}
                type="button"
                disabled={isItemDisabled}
                onClick={() => handleToggle(role)}
                className={`
                  btn btn-sm justify-start gap-2 relative transition-all h-auto py-2 uppercase text-[10px] font-bold tracking-wider
                  ${isSelected ? getRoleBadgeColor(role) : 'btn-ghost border-base-300 bg-base-100'}
                  ${isItemDisabled ? 'opacity-50 cursor-not-allowed border-transparent' : 'hover:border-base-content/20'}
                `}
              >
                {isSelected && <Check size={14} />}
                {role}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};