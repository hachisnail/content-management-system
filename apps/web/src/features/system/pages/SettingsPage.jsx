import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth'; 
import { updateUser } from '../../../api/profile.api';
import { ThemeController } from '../../../components/layout/ThemeController';
import AvatarUpload from '../../../components/common/AvatarUpload'; 
import { User, Shield, Palette, Save, Mail, Calendar, Phone } from 'lucide-react';
import { ConfirmationModal } from "@repo/ui";
import { ROLES } from '../../../config/roles';

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // [FIX] Use Config Constant instead of hardcoded string
  const isSuperAdmin = user?.roles?.includes(ROLES.SUPERADMIN);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '', // [FIX] Initialize email state
    contactNumber: '',
    birthDate: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '', // [FIX] Pre-fill email from user data
        contactNumber: user.contactNumber || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
  }, [user]);

const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true); // Trigger Modal
  };

const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMsg('');
    try {
      await updateUser(user.id, formData);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (refreshUser) await refreshUser(); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSuccess = async (newFile) => {
    if (refreshUser) {
        await refreshUser(); 
    } else {
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-base-content">Account Settings</h1>
        <p className="text-base-content/60">Manage your profile information and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <div className="p-6 border-b border-base-200">
                 <h2 className="card-title text-base flex items-center gap-2 text-base-content">
                   <User size={18} /> Personal Information
                 </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">First Name</span></label>
                    <input type="text" className="input input-bordered w-full" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium">Last Name</span></label>
                    <input type="text" className="input input-bordered w-full" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-medium text-base-content/80">Email Address</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-base-content/50" />
                    <input 
                      type="email" 
                      // [FIX] Logic is now safe because formData.email is initialized
                      value={isSuperAdmin ? formData.email : (user?.email || '')} 
                      onChange={e => isSuperAdmin && setFormData({...formData, email: e.target.value})}
                      disabled={!isSuperAdmin}
                      className={`input input-bordered w-full pl-10 ${!isSuperAdmin ? 'bg-base-200/50 cursor-not-allowed' : 'bg-base-100'}`} 
                    />
                  </div>
                  {!isSuperAdmin && <label className="label"><span className="label-text-alt text-base-content/50">Contact admin to change email</span></label>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium text-base-content/80">Contact Number</span></label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3 text-base-content/50" />
                        <input 
                          type="tel" 
                          className="input input-bordered w-full pl-10 focus:input-primary bg-base-100" 
                          value={formData.contactNumber}
                          onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                        />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium text-base-content/80">Birth Date</span></label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-3 text-base-content/50" />
                        <input 
                          type="date" 
                          className="input input-bordered w-full pl-10 focus:input-primary bg-base-100" 
                          value={formData.birthDate}
                          onChange={e => setFormData({...formData, birthDate: e.target.value})}
                        />
                    </div>
                  </div>
                </div>

                <div className="card-actions justify-end mt-6 pt-4 border-t border-base-200">
                  {successMsg && (
                    <div className="flex items-center gap-2 text-success text-sm mr-auto animate-pulse">
                        <Shield size={16} /> {successMsg}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary min-w-[120px]" disabled={loading}>
                    {loading ? <span className="loading loading-spinner"></span> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Avatar & Theme */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6 flex flex-col items-center gap-4 text-center">
              <AvatarUpload user={user} onUploadSuccess={handleAvatarSuccess} />
              
              <div className="overflow-hidden w-full">
                <h3 className="font-bold text-lg truncate text-base-content">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-base-content/60 truncate mb-2">{user?.email}</p>
                <div className="badge badge-secondary badge-outline capitalize">{user?.roles?.[0]}</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
               <div className="p-6 border-b border-base-200">
                  <h2 className="card-title text-base flex items-center gap-2 text-base-content">
                    <Palette size={18} /> Appearance
                  </h2>
               </div>
               <div className="p-6">
                  <ThemeController isPageMode={true} />
               </div>
            </div>
          </div>

        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Updates"
        message="Are you sure you want to save these changes to your profile?"
        confirmText="Save"
        variant="primary"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
};

export default SettingsPage;