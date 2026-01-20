import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ShieldAlert, 
  FileQuestion, 
  ServerCrash, 
  ArrowLeft, 
  Home 
} from 'lucide-react';
// Updated import path for the new structure
import { Button } from '@/components/UI';

const ErrorPage = ({ 
  code = 404, 
  title, 
  message,
}) => {
  const navigate = useNavigate();

  // Configuration for different error types
  const config = {
    403: {
      icon: ShieldAlert,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      defaultTitle: "Access Denied",
      defaultMessage: "You do not have the necessary permissions to view this resource."
    },
    404: {
      icon: FileQuestion,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      defaultTitle: "Page Not Found",
      defaultMessage: "We couldn't find the page you're looking for."
    },
    500: {
      icon: ServerCrash,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      defaultTitle: "System Error",
      defaultMessage: "Something went wrong on our end. Please try again later."
    }
  };

  const type = config[code] || config[404];
  const Icon = type.icon;

  // Use props if provided, otherwise fallback to type defaults
  const displayTitle = title || type.defaultTitle;
  const displayMessage = message || type.defaultMessage;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-md w-full">
        <div className={`relative ${type.bg} border ${type.border} rounded-2xl p-8 text-center shadow-sm overflow-hidden`}>
          
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-white opacity-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-white opacity-20 blur-2xl"></div>

          <div className={`mx-auto w-16 h-16 ${type.bg} rounded-full flex items-center justify-center mb-6 shadow-sm border ${type.border} relative z-10`}>
            <Icon size={32} className={type.color} />
          </div>

          <h1 className="text-4xl font-bold text-zinc-900 mb-2 tracking-tight">{code}</h1>
          <h2 className="text-xl font-semibold text-zinc-800 mb-3">{displayTitle}</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            {displayMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="secondary" 
              icon={ArrowLeft} 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button 
              variant="primary" 
              icon={Home} 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;