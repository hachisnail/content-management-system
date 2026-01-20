import { Loader2 } from "lucide-react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  isLoading,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/50 focus:ring-indigo-500 border border-transparent",
    secondary:
      "bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 focus:ring-indigo-500 border border-zinc-300 shadow-sm",
    danger:
      "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white focus:ring-red-500 border border-red-200 hover:shadow-lg hover:shadow-red-200/50",
    ghost:
      "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent",
    link: "text-indigo-600 hover:text-indigo-800 hover:underline p-0 underline-offset-4",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs rounded",
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg",
    icon: "p-2 rounded-full",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : (
        Icon && (
          <Icon
            className={`${
              children ? "mr-2" : ""
            } h-4 w-4 transition-transform group-hover:scale-110`}
          />
        )
      )}
      {children}
    </button>
  );
};

export default Button;
