import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "../UI";

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component Boundary Caught Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-full min-h-[200px] w-full rounded-xl border border-red-100 bg-white p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-red-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-2xl opacity-50" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-3 shadow-sm ring-4 ring-white">
              <AlertTriangle size={22} />
            </div>

            <h3 className="text-zinc-900 font-bold text-sm">
              {this.props.title || "Component Error"}
            </h3>

            <p className="text-zinc-500 text-xs mt-1 mb-4 max-w-[240px] leading-relaxed line-clamp-2">
              {this.state.error?.message ||
                "This section encountered a problem."}
            </p>

            <Button
              size="sm"
              variant="secondary"
              icon={RefreshCcw}
              onClick={this.handleRetry}
              className="h-8 text-xs bg-white hover:bg-red-50 hover:text-red-600 border-zinc-200 hover:border-red-200 transition-colors shadow-sm"
            >
              Reload Section
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
