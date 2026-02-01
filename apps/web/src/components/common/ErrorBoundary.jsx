import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-error/10 text-error-content rounded-lg border border-error">
          <h2 className="font-bold text-lg">Something went wrong.</h2>
          <p>{this.props.message || "This part of the application has encountered an error."}</p>
          {this.state.error && (
            <pre className="mt-2 text-xs whitespace-pre-wrap">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
