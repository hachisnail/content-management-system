import { UnderConstruction } from '../../../components/common';

export const IntakeTab = () => {
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
      <div className="card-body">
        <UnderConstruction 
          title="Acquisition Queue"
          description="Manage incoming donation offers and purchases pending review."
          features={["Review Public Offers", "Generate Temporary Receipts", "Accept/Reject Workflows"]}
          showNotify={false}
        />
      </div>
    </div>
  );
};