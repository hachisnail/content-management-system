// web/src/features/auth/pages/ErrorPages.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

// REMOVED: import { ErrorPages } from '..'; <-- This was causing the crash

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center mb-4">
          <div className="bg-base-300 p-6 rounded-full">
            <AlertTriangle size={64} className="text-warning" />
          </div>
        </div>
        
        <h1 className="text-9xl font-black text-base-content/20">404</h1>
        <h2 className="text-3xl font-bold text-base-content">Page Not Found</h2>
        <p className="text-base-content/60">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <button onClick={() => navigate(-1)} className="btn btn-outline gap-2">
            <ArrowLeft size={18} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary gap-2">
            <Home size={18} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center mb-4">
           <div className="bg-error/10 p-6 rounded-full">
            <AlertTriangle size={64} className="text-error" />
          </div>
        </div>
        
        <h1 className="text-9xl font-black text-base-content/20">403</h1>
        <h2 className="text-3xl font-bold text-base-content">Access Denied</h2>
        <p className="text-base-content/60">
          You don't have permission to view this page. Please contact your administrator if you believe this is a mistake.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <button onClick={() => navigate(-1)} className="btn btn-outline gap-2">
            <ArrowLeft size={18} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary gap-2">
            <Home size={18} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};