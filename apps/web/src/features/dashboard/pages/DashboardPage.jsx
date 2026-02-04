import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import { PageContainer } from '../../../components/layout/PageContainer';
import { 
  Activity, Users, Server, Bell, Megaphone, 
  Inbox, Archive, Box, Stethoscope, HeartHandshake,
  TrendingUp, Clock, ScanLine, ArrowRight
} from 'lucide-react';
import apiClient from '../../../api/client';
import { ConfirmationModal } from "@repo/ui";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const openModal = (config) => {
    setModalConfig({ ...config, isOpen: true });
  };

  // --- Action Handlers ---

  const handleBroadcast = () => {
    openModal({
      title: "Broadcast System Alert?",
      message: "WARNING: This will send a notification to ALL users in the system. Use this only for important announcements.",
      variant: "warning",
      confirmText: "Broadcast Now",
      onConfirm: async () => {
        try {
          await apiClient.post('/notifications/test-broadcast');
          openModal({
            title: "Broadcast Sent",
            message: "All online users have been notified.",
            variant: "success",
            confirmText: "Close",
            onConfirm: closeModal
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  // --- Dashboard Data (Aligned with new Features) ---

  const moduleStats = [
    {
      title: "Intake Queue",
      value: "12",
      label: "Pending Offers",
      icon: Inbox,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/collections?tab=intake",
      trend: "+2 today"
    },
    {
      title: "Total Collection",
      value: "14,205",
      label: "Accessioned Items",
      icon: Archive,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      link: "/collections?tab=inventory",
      trend: "Verified"
    },
    {
      title: "Conservation",
      value: "5",
      label: "Active Treatments",
      icon: Stethoscope,
      color: "text-error",
      bg: "bg-error/10",
      link: "/collections?tab=conservation",
      trend: "2 Critical"
    },
    {
      title: "Feedback",
      value: "8",
      label: "New Responses",
      icon: HeartHandshake,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      link: "/feedback",
      trend: "98% Positive"
    }
  ];

  return (
    <PageContainer 
      title={`Welcome back, ${user?.firstName || 'User'}`}
      actions={
        <div className="flex gap-2">
          {/* Quick Scanner Access */}
          <button 
            onClick={() => navigate('/scanner')} 
            className="btn btn-neutral btn-sm gap-2 shadow-sm"
          >
            <ScanLine size={16} />
            Launch Scanner
          </button>

          {/* Admin Broadcast */}
          <button 
            onClick={handleBroadcast} 
            className="btn btn-warning btn-sm gap-2 shadow-sm"
          >
            <Megaphone size={16} />
            Broadcast
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Top Level System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats shadow-sm border border-base-200 bg-base-100 w-full overflow-hidden">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Users size={32} className="opacity-80"/>
              </div>
              <div className="stat-title">Active Users</div>
              <div className="stat-value text-primary text-3xl">24</div>
              <div className="stat-desc text-success flex items-center gap-1">
                <TrendingUp size={12} /> 12% increase
              </div>
            </div>
          </div>

          <div className="stats shadow-sm border border-base-200 bg-base-100 w-full overflow-hidden">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Activity size={32} className="opacity-80"/>
              </div>
              <div className="stat-title">System Health</div>
              <div className="stat-value text-secondary text-3xl">99.9%</div>
              <div className="stat-desc text-success">All services operational</div>
            </div>
          </div>

          <div className="stats shadow-sm border border-base-200 bg-base-100 w-full overflow-hidden">
            <div className="stat">
              <div className="stat-figure text-accent">
                <Server size={32} className="opacity-80"/>
              </div>
              <div className="stat-title">Storage Used</div>
              <div className="stat-value text-accent text-3xl">45%</div>
              <div className="stat-desc">1.2TB / 4TB available</div>
            </div>
          </div>
        </div>

        {/* Module Overview Grid */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 opacity-80">
            <Activity size={20} className="text-primary"/> Module Overview
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  onClick={() => navigate(stat.link)}
                  className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <div className="badge badge-ghost text-xs font-mono opacity-70">{stat.trend}</div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="stat-value text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm font-medium opacity-60 mt-1">{stat.label}</div>
                      <div className="flex items-center gap-1 text-xs opacity-40 uppercase tracking-wider font-bold mt-4 group-hover:text-primary transition-colors">
                        {stat.title} <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Actions Feed */}
          <div className="col-span-1 lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-200/30">
                <h3 className="font-bold text-lg">Recent Activities</h3>
                <button className="btn btn-xs btn-ghost" onClick={() => navigate('/audit')}>View All</button>
              </div>
              <div className="divide-y divide-base-200">
                {[
                  { user: 'Dr. Santos', action: 'started treatment', target: 'Vintage Abaca Loom', time: '10 mins ago', icon: Stethoscope, color: 'text-warning' },
                  { user: 'Mike Ross', action: 'moved artifact', target: 'Storage A -> Exhibit B', time: '1 hour ago', icon: Box, color: 'text-info' },
                  { user: 'System', action: 'received offer', target: 'Donation #2024-55', time: '2 hours ago', icon: Inbox, color: 'text-success' },
                  { user: 'Jane Doe', action: 'submitted feedback', target: 'Visitor Complaint', time: '1 day ago', icon: HeartHandshake, color: 'text-error' },
                ].map((item, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 hover:bg-base-200/50 transition-colors">
                    <div className={`p-2 rounded-full bg-base-200 ${item.color}`}>
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="font-bold">{item.user}</span> {item.action} <span className="text-primary font-medium">{item.target}</span>
                      </p>
                    </div>
                    <span className="text-xs opacity-50 whitespace-nowrap font-mono">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Tasks & Maintenance */}
          <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4">Pending Reviews</h3>
              
              <div className="space-y-5">
                {[
                  { label: "Intake Approvals", current: 4, total: 12, color: "progress-primary", value: 33 },
                  { label: "Conservation Checks", current: 2, total: 5, color: "progress-error", value: 40 },
                  { label: "Feedback Response", current: 7, total: 8, color: "progress-warning", value: 85 }
                ].map((task, idx) => (
                   <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{task.label}</span>
                      <span className="opacity-60 text-xs">{task.current}/{task.total}</span>
                    </div>
                    <progress className={`progress ${task.color} w-full`} value={task.value} max="100"></progress>
                  </div>
                ))}
              </div>

              <div className="divider my-4"></div>
              
              <div className="bg-base-200/50 p-4 rounded-lg flex items-start gap-3 border border-base-200">
                 <Clock className="w-5 h-5 text-base-content/60 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-bold">Next Maintenance</h4>
                   <p className="text-xs opacity-70 mt-1">Scheduled server maintenance window is set for Sunday at 2:00 AM.</p>
                 </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmText={modalConfig.confirmText}
        onClose={closeModal}
        onConfirm={async () => {
          await modalConfig.onConfirm();
        }}
      />
    </PageContainer>
  );
};

export default DashboardPage;