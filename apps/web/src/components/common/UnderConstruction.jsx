import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, Bell, Calendar } from 'lucide-react';

const UnderConstruction = ({
  title = "Under Construction",
  description = "We are currently building this module to improve your workflow. Check back soon!",
  eta = null,
  features = [],
  showNotify = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="hero min-h-[60vh] bg-base-200 rounded-2xl border border-base-300">
      <div className="hero-content text-center">
        <div className="max-w-md">
          
          {/* Icon Header */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-base-100 rounded-full shadow-sm">
              <Construction className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="py-6 text-base-content/70">
            {description}
          </p>

          {/* Optional ETA Badge */}
          {eta && (
            <div className="flex items-center justify-center gap-2 mb-8 text-sm font-medium text-base-content/60 bg-base-100 py-2 px-4 rounded-full inline-flex border border-base-200">
              <Calendar className="w-4 h-4" />
              <span>Target Launch: <span className="text-primary">{eta}</span></span>
            </div>
          )}

          {/* Optional Features List (Roadmap style) */}
          {features.length > 0 && (
            <div className="text-left bg-base-100 p-6 rounded-xl shadow-sm mb-8 border border-base-200">
              <h3 className="text-xs font-bold uppercase text-base-content/40 mb-4 tracking-wider">
                Roadmap
              </h3>
              <ul className="steps steps-vertical w-full text-sm">
                {features.map((feature, index) => (
                  <li key={index} className="step step-primary" data-content="●">
                    <span className="text-left ml-2">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn btn-outline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go Back
            </button>
            
            {showNotify && (
              <button className="btn btn-primary">
                <Bell className="w-4 h-4 mr-1" />
                Notify When Ready
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;