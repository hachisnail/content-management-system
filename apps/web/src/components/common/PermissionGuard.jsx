import React from 'react';
import { usePermission } from '../../providers/PermissionProvider';
import { UnauthorizedPage } from '../../features/auth/pages/ErrorPages';

const PermissionGuard = ({ action, resource, children }) => {
  const { can, isLoading } = usePermission();

  // 1. Loading State: Prevent premature redirection while fetching roles
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // 2. Permission Check
  // The 'can' function handles the hierarchy checks internally using the config fetched from server
  const check = can(action, resource);

  // 3. Access Denied
  if (!check.granted) {
    return <UnauthorizedPage />;
  }

  // 4. Access Granted
  return children;
};

export default PermissionGuard;