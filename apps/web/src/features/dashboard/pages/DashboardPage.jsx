// web/src/features/dashboard/pages/DashboardPage.jsx
import { useAuth } from '../../../hooks';
import { Activity, Users, Server } from 'lucide-react'; 

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-base-content">System Dashboard</h1>
        <p className="text-base-content/70">
          Welcome back, <span className="font-semibold text-primary">{user?.firstName}</span>. 
          Here is what's happening in the museum system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Section - Added border and proper semantic background */}
        <div className="stats shadow-sm border border-base-200 bg-base-100 col-span-1 md:col-span-3">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Users size={32} />
            </div>
            <div className="stat-title text-base-content/70">Total Users</div>
            <div className="stat-value text-primary">Live</div>
            <div className="stat-desc text-base-content/50">Updates in real-time</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-success">
               <Activity size={32} />
            </div>
            <div className="stat-title text-base-content/70">System Status</div>
            <div className="stat-value text-success">Active</div>
            <div className="stat-desc text-base-content/50">All services operational</div>
          </div>

          <div className="stat">
             <div className="stat-figure text-secondary">
               <Server size={32} />
             </div>
             <div className="stat-title text-base-content/70">Server Load</div>
             <div className="stat-value text-secondary">Low</div>
             <div className="stat-desc text-base-content/50">Optimized</div>
          </div>
        </div>

        {/* User Management Widget */}
        <div className="card bg-base-100 shadow-sm border border-base-200 col-span-1 md:col-span-3">
          <div className="card-body p-0">
            {/* Header uses base-200 border for separation */}
            <div className="p-6 border-b border-base-200 flex justify-between items-center">
              <h2 className="card-title text-xl text-base-content">User Management</h2>
              <div className="badge badge-neutral text-neutral-content">Real-time</div>
            </div>
            <div className="p-0">
               {/* <UserList /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;