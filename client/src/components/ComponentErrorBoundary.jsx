import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button, Card } from './UI';

/**
 * A granular Error Boundary for individual components.
 * Use this to wrap widgets, tables, or charts so a crash 
 * in one section doesn't hide the rest of the page.
 */
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
    // Optional: Trigger a prop callback if data needs refetching
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50/30 h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-red-900 font-bold text-sm mb-1">
            {this.props.title || "Section Failed"}
          </h3>
          <p className="text-red-600/80 text-xs mb-4 max-w-xs font-medium">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button 
            variant="secondary" 
            size="xs" 
            icon={RefreshCcw}
            onClick={this.handleRetry}
            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;