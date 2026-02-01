import React from 'react';
import { Check, Shield } from 'lucide-react';
import { ROLES, ROLE_HIERARCHY, getRoleBadgeColor } from '../../../../config/roles';
import { useAuth } from '../../../../features/auth/hooks/useAuth';

export const RoleSelector = ({ selectedRoles = [], onChange, disabled = false }) => {
  const { user: currentUser } = useAuth();
  const currentUserRank = Math.max(...(currentUser?.roles || []).map(r => ROLE_HIERARCHY[r] || 0));

  const handleToggle = (role) => {
    if (disabled) return;
    
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // Prevent empty selection
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
          {Object.values(ROLES).map((role) => {
            const isSelected = selectedRoles.includes(role);
            
            // Security Check: Can current user assign this role?
            const roleRank = ROLE_HIERARCHY[role] || 0;
            const isRankAllowed = roleRank < currentUserRank || currentUser?.roles.includes(ROLES.SUPERADMIN);
            const isItemDisabled = disabled || !isRankAllowed;

            if (disabled && !isSelected) return null; // Hide unselected roles when disabled/view-only

            return (
              <button
                key={role}
                type="button"
                disabled={isItemDisabled}
                onClick={() => handleToggle(role)}
                className={`
                  btn btn-sm justify-start gap-2 relative transition-all h-auto py-2
                  ${isSelected ? getRoleBadgeColor(role) : 'btn-ghost border-base-300 bg-base-100'}
                  ${isItemDisabled ? 'opacity-50 cursor-not-allowed border-transparent' : 'hover:border-base-content/20'}
                `}
              >
                {isSelected && <Check size={14} />}
                <span className="uppercase text-[10px] font-bold tracking-wider">{role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};