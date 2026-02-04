import React from 'react';
import { UnderConstruction } from '../../../components/common';

export const AccessionTab = () => {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
      <div className="card-body">
        <UnderConstruction 
          title="Accession Registry"
          description="Formalize ownership and assign accession numbers to approved acquisitions."
          features={["Deed of Gift Generation", "Provenance Recording", "Accession Numbering"]}
          showNotify={false}
        />
      </div>
    </div>
  );
};