import React, { useState } from 'react';
import { User, Lock, Palette } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ProfileForm } from '../components/ProfileForm';
import { AvatarCard } from '../components/AvatarCard';
import { PreferencesForm } from '../components/PreferencesForm';
import { SecurityForm } from '../components/SecurityForm';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <PageContainer title="Account Settings" breadcrumbs={['System', 'Settings']}>
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="card bg-base-100 shadow-sm border border-base-200 sticky top-4">
            <div className="card-body p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                        ${activeTab === tab.id 
                          ? 'bg-primary text-primary-content shadow-md' 
                          : 'text-base-content hover:bg-base-200'}
                      `}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2">
                <ErrorBoundary message="Failed to load profile form.">
                  <ProfileForm />
                </ErrorBoundary>
              </div>
              <div>
                 <ErrorBoundary message="Failed to load avatar.">
                  <AvatarCard />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-xl animate-fade-in">
               <ErrorBoundary message="Failed to load security settings.">
                <SecurityForm />
              </ErrorBoundary>
            </div>
          )}

          {/* TAB: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="animate-fade-in">
               <ErrorBoundary message="Failed to load theme preferences.">
                <PreferencesForm />
              </ErrorBoundary>
            </div>
          )}

        </div>
      </div>
    </PageContainer>
  );
};

export default SettingsPage;