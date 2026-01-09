import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";
import { AlertTriangle, RefreshCcw, Home, ShieldAlert, ServerCrash, FileQuestion } from "lucide-react";
import { Button, Card } from "./UI";

const ErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Route Error Caught:", error);

  // Default: System Error (500)
  let title = "System Error";
  let message = "An unexpected error occurred.";
  let code = 500;
  let Icon = ServerCrash;
  let colorClass = "text-red-600";
  let bgClass = "bg-red-50";

  // 1. Handle React Router Errors (Thrown Responses)
  if (isRouteErrorResponse(error)) {
    code = error.status;
    title = error.statusText;
    message = error.data || error.data?.message;
  
  // 2. FIX: Handle API Error Objects ({ status: 403, message: '...' })
  } else if (error && typeof error === 'object' && error.status) {
    code = error.status;
    message = error.message;
    // Map API status text defaults if needed
    if (code === 403) title = "Access Denied";
    if (code === 404) title = "Resource Not Found";
    if (code === 401) title = "Unauthorized";

  // 3. Handle Standard JS Errors
  } else if (error instanceof Error) {
    message = error.message;
  }

  // --- CUSTOMIZE UI BASED ON CODE ---
  
  if (code === 404) {
    title = title || "Page Not Found";
    message = message || "The page you are looking for doesn't exist or has been moved.";
    Icon = FileQuestion;
    colorClass = "text-indigo-600";
    bgClass = "bg-indigo-50";
  } else if (code === 403) {
    title = title || "Access Restricted";
    message = message || "You do not have permission to view this resource.";
    Icon = ShieldAlert;
    colorClass = "text-amber-600";
    bgClass = "bg-amber-50";
  }

  // Common UI Layout for all full-page errors
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-zinc-50 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-md w-full text-center">
        
        {/* Icon Circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white ${bgClass}`}>
          <Icon size={40} className={colorClass} />
        </div>

        {/* Text Content */}
        <h1 className="text-4xl font-extrabold text-zinc-900 mb-2 tracking-tight">{code}</h1>
        <h2 className="text-xl font-bold text-zinc-800 mb-3">{title}</h2>
        <p className="text-zinc-500 mb-8 leading-relaxed px-4">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate("/dashboard", { replace: true })}
          >
            Dashboard
          </Button>
          {code === 500 && (
             <Button
                variant="ghost"
                icon={RefreshCcw}
                onClick={() => window.location.reload()}
             >
               Reload
             </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;