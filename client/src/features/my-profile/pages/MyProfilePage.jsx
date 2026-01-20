import ComponentErrorBoundary from '@/components/common/ComponentErrorBoundary';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfileForm from '../components/ProfileForm';

const MyProfilePage = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          My Profile
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage your account settings and profile appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Identity */}
        <div className="md:col-span-4 space-y-6">
          <ComponentErrorBoundary title="Avatar Failed">
            <ProfileAvatar />
          </ComponentErrorBoundary>
        </div>

        {/* Right Column: Details Form */}
        <div className="md:col-span-8">
          <ComponentErrorBoundary title="Profile Form Failed">
            <ProfileForm />
          </ComponentErrorBoundary>
        </div>

      </div>
    </div>
  );
};

export default MyProfilePage;