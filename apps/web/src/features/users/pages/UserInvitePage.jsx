import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { inviteUserSchema } from '@repo/validation'; 
import { PageContainer } from '../../../components/layout/PageContainer';
import { Mail, User, ArrowLeft, Send } from 'lucide-react';
import { useUserForm } from '../hooks/useUserManager'; // [FIX] Import useUserForm instead
import { RoleSelector } from '../components/RoleSelector';
import { ConfirmationModal } from "@repo/ui"; 

export const UserInvitePage = () => {
  const navigate = useNavigate();
  
  // [FIX] Use the form-specific hook which guarantees access to 'actions.invite' and 'loading'
  const { actions, loading } = useUserForm(); 
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(inviteUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roles: [] 
    }
  });

  const currentRoles = watch('roles');

  const onSubmit = (data) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    if (pendingData) {
      // [FIX] Now actions.invite is definitely defined
      await actions.invite(pendingData, navigate);
    }
  };

  return (
    <PageContainer 
      title="Invite New User" 
      breadcrumbs={['System', 'Users', 'Invite']}
      actions={
        <button onClick={() => navigate('/users')} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16}/> Back
        </button>
      }
    >
      <div className="flex justify-center mt-6">
        <div className="card w-full max-w-2xl bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title mb-6 opacity-80">Invitation Details</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label"><span className="label-text">First Name</span></label>
                  <label className={`input input-bordered flex items-center gap-2 ${errors.firstName ? 'input-error' : ''}`}>
                    <User size={16} className="opacity-50"/>
                    <input type="text" placeholder="Jane" {...register("firstName")} />
                  </label>
                  {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName.message}</span>}
                </div>
                
                <div className="form-control">
                  <label className="label"><span className="label-text">Last Name</span></label>
                  <label className={`input input-bordered flex items-center gap-2 ${errors.lastName ? 'input-error' : ''}`}>
                    <User size={16} className="opacity-50"/>
                    <input type="text" placeholder="Doe" {...register("lastName")} />
                  </label>
                  {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName.message}</span>}
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Email Address</span></label>
                <label className={`input input-bordered flex items-center gap-2 ${errors.email ? 'input-error' : ''}`}>
                  <Mail size={16} className="opacity-50"/>
                  <input type="email" placeholder="jane.doe@example.com" {...register("email")} />
                </label>
                {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
              </div>

              <div className="form-control">
                <RoleSelector 
                  selectedRoles={currentRoles}
                  onChange={(roles) => setValue('roles', roles, { shouldValidate: true })}
                />
                {errors.roles && <span className="text-error text-xs mt-1 px-1">{errors.roles.message}</span>}
              </div>

              <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                <button type="button" className="btn" onClick={() => navigate('/system/users')}>Cancel</button>
                <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
                  {loading ? <span className="loading loading-spinner"></span> : <><Send size={16}/> Send Invitation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        title="Send Invitation?"
        message={`An email will be sent to ${pendingData?.email}.`}
        confirmText="Send Now"
        variant="info"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </PageContainer>
  );
};

export default UserInvitePage;