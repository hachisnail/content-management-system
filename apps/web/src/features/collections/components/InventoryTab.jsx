import React from 'react';
import { UnderConstruction } from '../../../components/common';

export const InventoryTab = () => {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
      <div className="card-body">
        <UnderConstruction 
          title="Master Catalog"
          description="Search and manage the complete museum collection."
          features={["Location Tracking", "Advanced Search", "Label Printing"]}
          showNotify={false}
        />
      </div>
    </div>
  );
};