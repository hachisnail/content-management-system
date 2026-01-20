import { Check, AlertCircle, AlertTriangle, Info, X } from "lucide-react";


const Alert = ({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}) => {
  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: Check,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: Info,
    },
  };
  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-start p-4 rounded-lg border ${style.bg} ${style.border} ${className}`}
    >
      <Icon className={`w-5 h-5 ${style.text} mt-0.5 shrink-0`} />
      <div className={`ml-3 flex-1 ${style.text}`}>
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {message && <div className="text-sm mt-1 opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-black/5 ${style.text}`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};


export default Alert;    