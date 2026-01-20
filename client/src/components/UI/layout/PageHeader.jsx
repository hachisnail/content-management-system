const PageHeader = ({ title, description, icon: Icon, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          {Icon && <Icon className="text-indigo-600" size={24} />}
          {title}
        </h1>
        {description && (
          <p className="text-zinc-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;