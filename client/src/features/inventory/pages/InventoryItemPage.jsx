import { WipState } from '@/features/shared';

const InventoryItemPage = () => {
  return (
    <WipState 
      title="Artifact Details" 
      message="Detailed view of a single artifact, including history, location, and images."
      backPath="/inventory"
    />
  );
};

export default InventoryItemPage;