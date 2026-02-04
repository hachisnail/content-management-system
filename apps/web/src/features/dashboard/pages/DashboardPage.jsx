import { useAuth } from '../../../hooks';
import { Activity, Users, Server, Bell, Megaphone } from 'lucide-react'; // [ADD Megaphone]
import apiClient from '../../../api/client';

const DashboardPage = () => {
  const { user } = useAuth();

  const handleTestNotification = async () => {
    try {
      await apiClient.post('/notifications/test');
    } catch (error) {
      console.error("Failed to send test", error);
    }
  };

  // [ADD THIS HANDLER]
  const handleBroadcast = async () => {
    if (!window.confirm("Are you sure you want to notify ALL users?")) return;
    
    try {
      await apiClient.post('/notifications/test-broadcast');
      alert("Broadcast sent!");
    } catch (error) {
      console.error("Failed to broadcast", error);
      alert("Failed to send broadcast");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-base-content">System Dashboard</h1>
                <p className="text-base-content/70">
                Welcome back, <span className="font-semibold text-primary">{user?.firstName}</span>. 
                </p>
            </div>
            
            <div className="flex gap-2">
                {/* Personal Test */}
                <button onClick={handleTestNotification} className="btn btn-primary btn-sm gap-2">
                    <Bell size={16} />
                    Me Only
                </button>

                {/* [ADD BROADCAST BUTTON] */}
                <button onClick={handleBroadcast} className="btn btn-warning btn-sm gap-2">
                    <Megaphone size={16} />
                    Broadcast All
                </button>
            </div>
        </div>
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