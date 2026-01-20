import { WipState } from '@/features/shared';

const DonationPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 pt-12 pb-24">
      <WipState 
        title="Public Donation Portal" 
        message="We are building a form for the community to submit artifacts for donation. Submissions will flow into the internal Intake process."
        backPath="/"
        backLabel="Return Home"
      />
    </div>
  );
};

export default DonationPage;