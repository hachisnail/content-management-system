import React from 'react';
import ErrorBoundary from '../common/ErrorBoundary';

export const PageContainer = ({ 
  title, 
  children, 
  actions = null,
  className = ""
}) => {
  return (
    // [UX FIX] Added 'animate-fade-in' to smooth out component mounting/unmounting
    <div className={`w-full h-full flex flex-col bg-base-100 rounded-b-2xl border-x border-b border-base-300 p-4 md:p-6 animate-fade-in ${className}`}>
      {/* --- Page Header --- */}
      {(title || actions) && (
        <div className="flex px-4 flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight text-base-content">{title}</h1>}
          </div>

          {/* Actions Toolbar */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* --- Page Content (Protected by Error Boundary) --- */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};