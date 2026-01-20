 const Card = ({ children, className = "", title, action, footer }) => (
  <div
    className={`bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col ${className}`}
  >
    {(title || action) && (
      <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center shrink-0">
        {title && <h3 className="font-semibold text-zinc-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 flex-1">{children}</div>
    {footer && (
      <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 rounded-b-lg shrink-0">
        {footer}
      </div>
    )}
  </div>
);

export default Card;