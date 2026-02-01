import { useTheme } from '../../providers/ThemeProvider';
import { Check } from 'lucide-react';

export const ThemeController = ({ isPageMode = false }) => {
  const { theme, setTheme } = useTheme(); // Fix: Consume context for source of truth
  const themes = ["light", "dark", "luxury", "business", "dim", "black"];

  return (
    <div className={isPageMode ? "grid grid-cols-2 md:grid-cols-3 gap-3" : "dropdown"}>
      {themes.map((t) => (
        <div key={t} className="form-control">
          <label 
            className={`
              label cursor-pointer gap-2 border rounded-lg px-4 py-3 transition-all
              ${theme === t 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-base-300 hover:border-base-content/30'
              }
              ${!isPageMode ? 'btn btn-sm btn-ghost justify-start w-full border-none' : ''}
            `}
          >
            <div className="flex items-center gap-2 flex-1">
              <input 
                type="radio" 
                name="theme-selection" 
                className="radio radio-primary radio-sm hidden" 
                value={t} 
                checked={theme === t} // Fix: Ensures the radio is checked based on context
                onChange={() => setTheme(t)} // Fix: Updates context
              />
              <span className="label-text capitalize font-medium">{t}</span>
            </div>
            {theme === t && <Check size={16} className="text-primary" />}
          </label>
        </div>
      ))}
    </div>
  );
};