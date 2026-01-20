import { WipState } from '@/features/shared';

const BookAppointmentPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 pt-12 pb-24">
      <WipState 
        title="Book a Visit" 
        message="This public form will allow researchers and visitors to request appointments. Requests will appear in the admin schedule."
        backPath="/"
        backLabel="Return Home"
      />
    </div>
  );
};

export default BookAppointmentPage;