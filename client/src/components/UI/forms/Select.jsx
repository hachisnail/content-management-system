import { ChevronDown } from "lucide-react";

const Select = ({ label, options = [], error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        className={`w-full appearance-none bg-zinc-50 border ${
          error ? "border-red-300" : "border-zinc-200"
        } text-zinc-900 text-sm rounded-lg focus:ring-zinc-500 focus:border-zinc-500 block p-2.5 pr-8`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

export default Select;
