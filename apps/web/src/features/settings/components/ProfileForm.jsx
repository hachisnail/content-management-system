import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { updateProfileSchema } from '@repo/validation'; 
import { User, Mail, Phone, Calendar, Save, Shield } from 'lucide-react';
import { profileApi } from '../api/profile.api';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePermission } from '../../../providers/PermissionProvider'; // [FIX] Import Context
import { ConfirmationModal } from "@repo/ui"; 

export const ProfileForm = () => {
  const { user, refreshUser } = useAuth();
  
  // [FIX] Destructure isLoading to prevent premature logic execution
  const { rolesConfig, isLoading: isPermsLoading } = usePermission(); 
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    getValues,
    formState: { errors, isDirty } 
  } = useForm({
    resolver: yupResolver(updateProfileSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', contactNumber: '', birthDate: ''
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
  }, [user, reset]);

  // [UX FIX] If permissions are loading, return a skeleton or spinner.
  // This prevents the form from rendering with "undefined" rolesConfig.
  if (isPermsLoading) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 h-96 flex items-center justify-center">
        <span className="loading loading-spinner loading-md text-primary"></span>
        <span className="ml-2 text-sm opacity-50">Loading permissions...</span>
      </div>
    );
  }

  // Now it is safe to calculate logic
  const isSuperAdmin = user?.roles?.includes(rolesConfig?.SUPERADMIN);

  const onSubmit = () => setShowConfirm(true);

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    setSuccessMsg('');
    try {
      const formData = getValues();
      await profileApi.update(formData);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (refreshUser) await refreshUser();
      reset(formData); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="p-6 border-b border-base-200">
            <h2 className="card-title text-base flex items-center gap-2 text-base-content">
              <User size={18} /> Personal Information
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">First Name</span></label>
                <input type="text" className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`} {...register("firstName")} />
                {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Last Name</span></label>
                <input type="text" className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`} {...register("lastName")} />
                {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium text-base-content/80">Email Address</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-base-content/50" />
                <input 
                  type="email" 
                  {...register("email")}
                  // [LOGIC] Now guaranteed to be correct because we waited for loading
                  disabled={!isSuperAdmin}
                  className={`input input-bordered w-full pl-10 ${!isSuperAdmin ? 'bg-base-200/50 cursor-not-allowed opacity-60' : 'bg-base-100'} ${errors.email ? 'input-error' : ''}`} 
                />
              </div>
              {!isSuperAdmin && <label className="label"><span className="label-text-alt text-base-content/50">Contact admin to change email</span></label>}
            </div>

            {/* ... Rest of form ... */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium text-base-content/80">Contact Number</span></label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-base-content/50" />
                  <input 
                    type="tel" 
                    className={`input input-bordered w-full pl-10 focus:input-primary bg-base-100 ${errors.contactNumber ? 'input-error' : ''}`}
                    {...register("contactNumber")}
                  />
                </div>
                {errors.contactNumber && <span className="text-error text-xs mt-1">{errors.contactNumber.message}</span>}
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium text-base-content/80">Birth Date</span></label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-base-content/50" />
                  <input 
                    type="date" 
                    className={`input input-bordered w-full pl-10 focus:input-primary bg-base-100 ${errors.birthDate ? 'input-error' : ''}`}
                    {...register("birthDate")}
                  />
                </div>
                {errors.birthDate && <span className="text-error text-xs mt-1">{errors.birthDate.message}</span>}
              </div>
            </div>


            <div className="card-actions justify-end mt-6 pt-4 border-t border-base-200">
              {successMsg && (
                <div className="flex items-center gap-2 text-success text-sm mr-auto animate-pulse">
                  <Shield size={16} /> {successMsg}
                </div>
              )}
              <button type="submit" className="btn btn-primary min-w-[120px]" disabled={loading || !isDirty}>
                {loading ? <span className="loading loading-spinner"></span> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && ConfirmationModal && (
        <ConfirmationModal
          isOpen={showConfirm}
          title="Confirm Updates"
          message="Are you sure you want to save these changes to your profile?"
          confirmText="Save"
          variant="primary"
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSave}
        />
      )}
    </>
  );
};