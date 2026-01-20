import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, Pickaxe } from 'lucide-react';
import { Button } from '@/components/UI'; 

const WipState = ({ 
  title = "Work in Progress", 
  message = "This feature is currently under active development. Check back soon for updates.",
  backPath = -1,
  backLabel = "Go Back"
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-md w-full text-center">
        
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-24 h-24 mb-8 group">
          <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20 duration-1000"></div>
          <div className="relative bg-amber-50 rounded-full w-full h-full flex items-center justify-center border-2 border-amber-100 shadow-sm group-hover:scale-105 transition-transform">
            <Construction size={40} className="text-amber-500" />
            
            {/* Decorative Sub-icon */}
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full border border-amber-100 shadow-sm">
              <Pickaxe size={16} className="text-amber-600" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-3">
          {title}
        </h2>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            variant="secondary" 
            icon={ArrowLeft} 
            onClick={() => navigate(backPath)}
            className="border-zinc-200 hover:bg-zinc-50"
          >
            {backLabel}
          </Button>
        </div>

        {/* Tech Decorator */}
        <div className="mt-12 flex items-center justify-center gap-2 opacity-40">
           <div className="h-1 w-1 rounded-full bg-zinc-400"></div>
           <div className="h-1 w-12 rounded-full bg-zinc-200"></div>
           <div className="h-1 w-1 rounded-full bg-zinc-400"></div>
        </div>
      </div>
    </div>
  );
};

export default WipState;