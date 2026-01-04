
// --- LOADING COMPONENT ---
export const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-gray-500">
      <svg 
        className="animate-spin h-10 w-10 text-indigo-600 mb-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
};

// --- ERROR COMPONENT ---
export const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="p-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {/* Error Icon */}
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Data
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{message || "An unexpected error occurred."}</p>
            </div>
            {onRetry && (
              <div className="mt-4">
                <button
                  onClick={onRetry}
                  className="text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};