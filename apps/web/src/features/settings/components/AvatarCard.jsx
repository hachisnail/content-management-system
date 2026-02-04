import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import AvatarUpload from '../../../components/common/AvatarUpload';

export const AvatarCard = () => {
  const { user, refreshUser } = useAuth();

  const handleAvatarSuccess = async () => {
    if (refreshUser) {
      await refreshUser();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6 flex flex-col items-center gap-4 text-center">
        <AvatarUpload user={user} onUploadSuccess={handleAvatarSuccess} />
        
        <div className="overflow-hidden w-full">
          <h3 className="font-bold text-lg truncate text-base-content">
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-sm text-base-content/60 truncate mb-2">
            {user?.email}
          </p>
          <div className="badge badge-secondary badge-outline capitalize">
            {user?.roles?.[0]}
          </div>
        </div>
      </div>
    </div>
  );
};