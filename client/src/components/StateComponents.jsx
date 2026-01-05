import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { Badge, Alert, Button, Card } from "./UI"; // Assuming UI components are in the same directory

// --- LOADING COMPONENT ---
export const LoadingSpinner = ({ 
  message = 'Loading data...',
  subtitle = 'Syncing with server...',
  className = '',
  size = 'lg' // sm, md, lg
}) => {
  const sizeConfig = {
    sm: { spinner: 20, text: 'text-sm', container: 'min-h-[200px]' },
    md: { spinner: 32, text: 'text-base', container: 'min-h-[300px]' },
    lg: { spinner: 48, text: 'text-lg', container: 'min-h-[400px]' },
  };

  const config = sizeConfig[size];

  return (
    <Card className={`flex flex-col items-center justify-center p-8 ${config.container} ${className}`}>
      <div className="relative mb-6">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-50" 
             style={{ 
               width: config.spinner + 16, 
               height: config.spinner + 16,
               top: -8,
               left: -8
             }}></div>
        
        {/* Main spinner */}
        <div className="relative">
          <Loader2 
            size={config.spinner} 
            className="animate-spin text-indigo-600" 
          />
          
          {/* Inner checkmark (subtle) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-indigo-50"></div>
          </div>
        </div>
      </div>
      
      {/* Message with subtle pulse */}
      <div className="text-center space-y-3 max-w-sm">
        <p className={`font-medium text-zinc-700 font-sans ${config.text}`}>{message}</p>
        <p className="text-sm text-zinc-400 font-sans">{subtitle}</p>
      </div>
      
      {/* Status indicator */}
      <div className="mt-8 flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full text-xs font-medium text-zinc-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        Connecting...
      </div>
      
      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-zinc-200 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          ></div>
        ))}
      </div>
    </Card>
  );
};

// --- ERROR COMPONENT ---
export const ErrorAlert = ({ 
  message, 
  onRetry,
  title = "Sync Error",
  className = "",
  showDetails = true,
  errorCode
}) => {
  const generatedErrorCode = errorCode || Date.now().toString(36).toUpperCase();
  
  return (
    <div className={`animate-in fade-in duration-500 ${className}`}>
      <Card 
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-200 opacity-50" 
                     style={{ width: 24, height: 24 }}></div>
                <div className="relative w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 font-sans">{title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-600 font-sans">Connection Issue</span>
                </div>
              </div>
            </div>
            
            {/* Status badge */}
            <Badge variant="error" className="px-3 py-1 border border-red-200">
              <Activity className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          </div>
        }
        className="border-red-200"
      >
        <div className="space-y-4">
          {/* Error message */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm text-red-800 font-sans leading-relaxed">
                  <p className="font-medium mb-1">Failed to load data from server</p>
                  <p className="opacity-90">{message || "An unexpected error occurred while syncing with the server."}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Technical details */}
          {showDetails && (
            <div className="pt-3 border-t border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Technical Details</span>
                <span className="text-xs text-red-500 font-mono">ERR:{generatedErrorCode}</span>
              </div>
              <div className="bg-white border border-red-100 rounded p-3">
                <pre className="text-xs text-red-600 font-mono overflow-x-auto whitespace-pre-wrap">
                  {message?.substring(0, 200) || "No additional details available"}
                </pre>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="primary"
                className="inline-flex items-center gap-2"
                icon={RefreshCw}
              >
                Retry Connection
              </Button>
            )}
            
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              className="text-sm"
            >
              Refresh Page
            </Button>
          </div>
          
          {/* Additional help text */}
          <div className="pt-4 border-t border-zinc-100">
            <Alert 
              type="info" 
              message={
                <div className="flex items-center justify-between">
                  <span>If the problem persists, contact your system administrator.</span>
                  <span className="text-xs font-mono text-zinc-500">Last attempt: {new Date().toLocaleTimeString()}</span>
                </div>
              }
              className="bg-blue-50 border-blue-200"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Optional: Loading Table Skeleton ---
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar Skeleton */}
      <div className="p-3 border-b border-zinc-200 flex flex-col sm:flex-row gap-3 justify-between bg-zinc-50/50">
        <div className="h-10 bg-zinc-200 rounded-lg w-72 animate-pulse"></div>
        <div className="h-10 bg-zinc-200 rounded-lg w-32 animate-pulse"></div>
      </div>
      
      {/* Table Header Skeleton */}
      <div className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="flex p-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div 
              key={i} 
              className="h-4 bg-zinc-300 rounded animate-pulse"
              style={{ width: `${Math.random() * 100 + 80}px` }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Table Rows Skeleton */}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-3 bg-zinc-100 rounded animate-pulse"
                style={{ 
                  width: `${Math.random() * 100 + 60}px`,
                  animationDelay: `${rowIndex * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Pagination Skeleton */}
      <div className="p-3 border-t border-zinc-200 flex items-center justify-between">
        <div className="h-4 bg-zinc-200 rounded w-32 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-zinc-200 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-zinc-200 rounded w-8 animate-pulse"></div>
          <div className="h-8 bg-zinc-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};