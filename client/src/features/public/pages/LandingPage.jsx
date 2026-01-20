// src/pages/public/LandingPage.jsx
import { Link } from 'react-router-dom';
import { usePublicConfig } from '../../../context/PublicContext';
import { ArrowRight, Info } from 'lucide-react';

const LandingPage = () => {
  const { landingPageAnnouncement, maintenanceMode } = usePublicConfig();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Public Announcement Banner */}
      {landingPageAnnouncement && (
        <div className="bg-indigo-600 text-white text-sm py-2 px-4 text-center font-medium">
          {landingPageAnnouncement}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 font-bold text-xl text-zinc-900">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">M</div>
          MASCD<span className="text-zinc-400 font-light">MIS</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth/login" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-black">
            Log In
          </Link>
          <Link to="/auth/register" className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-zinc-800">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        {maintenanceMode && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <Info size={14} /> Maintenance Mode Active
          </div>
        )}
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-900 tracking-tight mb-6">
          Management Information <br /> System Portal
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mb-8">
          Secure, real-time resource management for your organization. 
          Access dashboards, user directories, and audit logs in one place.
        </p>
        
        <div className="flex gap-4">
          <Link to="/auth/login" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Access Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;