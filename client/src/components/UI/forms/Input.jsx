const Input = ({
  label,
  icon: Icon,
  error,
  className = "",
  ...props
}) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5 ml-1">
        {label}
      </label>
    )}
    <div
      className={`relative group transition-all duration-300 rounded-lg border ${
        error
          ? "border-red-300 bg-red-50"
          : "border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:shadow-sm"
      }`}
    >
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      <input
        className={`w-full bg-transparent border-none p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-0 ${
          Icon ? "pl-10" : ""
        }`}
        {...props}
      />
    </div>
  </div>
);

export default Input;