import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";
import {
  AlertTriangle,
  RefreshCcw,
  Home,
  ShieldAlert,
  ServerCrash,
  FileQuestion,
  ArrowLeft,
} from "lucide-react";
import { Button } from "./UI";

const ErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Route Error Caught:", error);

  // Defaults
  let title = "System Malfunction";
  let message = "An unexpected condition was encountered.";
  let code = 500;
  let Icon = ServerCrash;
  let theme = "red"; // red, amber, indigo

  // 1. Handle React Router Errors
  if (isRouteErrorResponse(error)) {
    code = error.status;
    title = error.statusText;
    message = error.data || error.data?.message;

    // 2. Handle API Object Errors
  } else if (error && typeof error === "object" && error.status) {
    code = error.status;
    message = error.message;
    if (code === 403) title = "Access Denied";
    if (code === 404) title = "Resource Not Found";
    if (code === 401) title = "Unauthorized";

    // 3. Handle JS Errors
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Configuration map
  if (code === 404) {
    title = title || "Page Not Found";
    message =
      message ||
      "The page you are looking for has been moved or does not exist.";
    Icon = FileQuestion;
    theme = "indigo";
  } else if (code === 403) {
    title = title || "Restricted Access";
    message =
      message || "You do not have the necessary permissions to view this area.";
    Icon = ShieldAlert;
    theme = "amber";
  }

  // Theme styles
  const themes = {
    red: {
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      glow: "bg-red-500/10",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      glow: "bg-amber-500/10",
    },
    indigo: {
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      glow: "bg-indigo-500/10",
    },
  };
  const currentTheme = themes[theme] || themes.red;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-zinc-50 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent opacity-20" />
      <div
        className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl ${currentTheme.glow}`}
      />
      <div
        className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl ${currentTheme.glow}`}
      />

      <div className="max-w-md w-full relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Icon */}
        <div
          className={`w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg shadow-zinc-200/50 border border-white ${currentTheme.iconBg}`}
        >
          <Icon
            size={40}
            className={currentTheme.iconColor}
            strokeWidth={1.5}
          />
        </div>

        {/* Content */}
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
            {code}
          </h1>
          <h2 className="text-lg font-semibold text-zinc-700">{title}</h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate("/dashboard", { replace: true })}
            className="w-full sm:w-auto shadow-md shadow-indigo-200/50"
          >
            Dashboard
          </Button>

          {code === 500 && (
            <Button
              variant="ghost"
              icon={RefreshCcw}
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Reload
            </Button>
          )}
        </div>

        <div className="mt-12 text-xs text-zinc-400 font-medium">
          Error Reference:{" "}
          <span className="font-mono text-zinc-500">
            {new Date().getTime().toString(36).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
