import { Palette, Check, Monitor } from 'lucide-react';
import { useTheme } from '../../../providers/ThemeProvider';

export const PreferencesForm = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-6 border-b border-base-200 pb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Palette size={20} />
          </div>
          <div>
            <h2 className="card-title text-lg">Appearance</h2>
            <p className="text-xs text-base-content/60">Customize the look and feel of your workspace.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`
                group relative w-full text-left rounded-xl overflow-hidden border transition-all duration-200 hover:scale-[1.02]
                ${theme === t 
                  ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100 shadow-lg' 
                  : 'border-base-content/10 hover:border-base-content/20 shadow-sm'}
              `}
            >
              {/* LIVE PREVIEW: We apply the theme directly to this wrapper */}
              <div data-theme={t} className="bg-base-100 text-base-content w-full h-24 p-3 flex flex-col justify-top gap-2">
                
                {/* Header of the preview card */}
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-error opacity-20"></div>
                  <div className="w-2 h-2 rounded-full bg-warning opacity-20"></div>
                  <div className="w-2 h-2 rounded-full bg-success opacity-20"></div>
                </div>

                {/* Body of the preview card */}
                <div className="space-y-1.5">
                   <div className="flex gap-2">
                      <div className="h-2 w-8 rounded-full bg-primary/80"></div>
                      <div className="h-2 w-16 rounded-full bg-base-content/10"></div>
                   </div>
                   <div className="flex gap-2">
                      <div className="h-2 w-4 rounded-full bg-secondary/80"></div>
                      <div className="h-2 w-12 rounded-full bg-base-content/10"></div>
                   </div>
                </div>

                {/* Theme Name Label (Always legible) */}
                <div className="absolute inset-x-0 bottom-0 bg-base-content/5 p-2 backdrop-blur-sm flex items-center justify-between">
                   <span className="text-xs font-bold capitalize tracking-wide opacity-80 pl-1">{t}</span>
                   {theme === t && (
                     <div className="bg-primary text-primary-content rounded-full p-0.5">
                       <Check size={12} strokeWidth={3} />
                     </div>
                   )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-base-content/50 bg-base-200/50 p-3 rounded-lg">
           <Monitor size={14} />
           <span>Themes are applied instantly. Your preference is saved automatically to your profile.</span>
        </div>
      </div>
    </div>
  );
};