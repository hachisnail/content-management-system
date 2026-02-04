import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Inbox, Archive, Box, Stethoscope, Plus } from 'lucide-react';
import { usePermission } from '../../../providers/PermissionProvider';

// Import Sub-Views (These replace your old pages)
import { IntakeTab } from '../components/IntakeTab';
import { AccessionTab } from '../components/AccessionTab';
import { InventoryTab } from '../components/InventoryTab';
import { ConservationTab } from '../components/ConservationTab';

export const CollectionManagerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermission();
  
  // Default to 'inventory' or read from URL ?tab=xxx
  const activeTab = searchParams.get('tab') || 'inventory';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Define Tabs with Permission Checks
  const tabs = [
    { 
      id: 'intake', 
      label: 'Intake & Offers', 
      icon: Inbox, 
      component: IntakeTab,
      permission: { action: 'readAny', resource: 'intake' }
    },
    { 
      id: 'accession', 
      label: 'Accessioning', 
      icon: Archive, 
      component: AccessionTab,
      permission: { action: 'readAny', resource: 'accessions' }
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Box, 
      component: InventoryTab,
      permission: { action: 'readAny', resource: 'artifacts' }
    },
    { 
      id: 'conservation', 
      label: 'Conservation', 
      icon: Stethoscope, 
      component: ConservationTab,
      permission: { action: 'readAny', resource: 'conservation' }
    }
  ];

  // Filter tabs user has access to
  const visibleTabs = tabs.filter(t => can(t.permission.action, t.permission.resource).granted);
  
  const ActiveComponent = visibleTabs.find(t => t.id === activeTab)?.component || (() => <div>Access Denied</div>);

  return (
    <PageContainer 
      title="Collection Management" 
      breadcrumbs={['Collections', activeTab.charAt(0).toUpperCase() + activeTab.slice(1)]}
      actions={
        activeTab === 'intake' ? (
          <button className="btn btn-primary btn-sm gap-2">
            <Plus size={16}/> New Offer
          </button>
        ) : null
      }
    >
      <div className="flex flex-col h-full gap-6">
        
        {/* Navigation Tabs */}
        <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 gap-1 w-fit">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <a 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`tab gap-2 transition-all duration-200 ${activeTab === tab.id ? 'tab-active font-bold shadow-sm' : 'hover:bg-base-200/50'}`}
              >
                <Icon size={16} />
                {tab.label}
              </a>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 animate-fade-in">
          <ActiveComponent />
        </div>

      </div>
    </PageContainer>
  );
};