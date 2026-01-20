import { useState } from "react";
import {
  Loader2,
  RefreshCw,
  WifiOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button, Card, Badge } from "../UI";

// --- LOADING COMPONENT ---
export const LoadingSpinner = ({
  message = "Loading...",
  subtitle,
  className = "",
  size = "lg", // sm, md, lg
  transparent = false,
}) => {
  const sizeConfig = {
    sm: { icon: 18, container: "p-4 min-h-[100px]", text: "text-xs" },
    md: { icon: 24, container: "p-8 min-h-[200px]", text: "text-sm" },
    lg: { icon: 32, container: "p-12 min-h-[300px]", text: "text-base" },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const bgClass = transparent
    ? "bg-transparent"
    : "bg-white/50 border border-zinc-100/50 shadow-sm";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm w-full ${bgClass} ${config.container} ${className}`}
    >
      <div className="relative">
        {/* Animated Background Blob */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />

        <div className="relative bg-white p-3 rounded-xl shadow-md border border-indigo-50">
          <Loader2
            size={config.icon}
            className="animate-spin text-indigo-600"
            strokeWidth={2.5}
          />
        </div>
      </div>

      <div className="mt-4 text-center space-y-1">
        <h4
          className={`font-semibold text-zinc-900 ${config.text} tracking-tight`}
        >
          {message}
        </h4>
        {subtitle && (
          <p className="text-xs text-zinc-500 font-medium animate-pulse">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

// --- ERROR COMPONENT ---
export const ErrorAlert = ({
  message,
  onRetry,
  title = "Unable to Load Data",
  className = "",
  showDetails = true,
  errorCode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const code = errorCode || "ERR_FETCH";

  return (
    <div
      className={`rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 flex gap-4">
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center ring-4 ring-red-50/50">
            <WifiOff size={20} className="text-red-500" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
            <Badge variant="error" className="hidden sm:inline-flex">
              {code}
            </Badge>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">
            {message ||
              "We encountered an issue while connecting to the server."}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="secondary"
                className="h-8 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                icon={RefreshCw}
              >
                Try Again
              </Button>
            )}

            {showDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
              >
                {expanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                {expanded ? "Hide Logs" : "View Logs"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Technical Details */}
      {showDetails && expanded && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Error Trace
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(message)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="font-mono text-[11px] text-red-300 leading-relaxed whitespace-pre-wrap break-all">
            {message}
          </pre>
        </div>
      )}
    </div>
  );
};

// --- TABLE SKELETON ---
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="p-3 border-b border-zinc-100 flex gap-3 justify-between items-center bg-zinc-50/50">
        <div className="h-9 bg-zinc-200/70 rounded-lg w-64 animate-pulse"></div>
        <div className="h-9 bg-zinc-200/70 rounded-lg w-24 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="flex px-6 py-4 gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-zinc-100 rounded-md animate-pulse"
              style={{ width: `${Math.max(40, Math.random() * 120)}px` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-50">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 flex items-center gap-6">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-2.5 bg-zinc-100/80 rounded animate-pulse"
                style={{
                  width: `${Math.max(30, Math.random() * 100)}px`,
                  opacity: 1 - rowIndex * 0.1, // Fade out effect for lower rows
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
