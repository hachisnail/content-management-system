import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Mail, User, ArrowLeft, Send } from 'lucide-react';
import { useUserForm } from '../hooks/useUserManager';
import { RoleSelector } from '../components/user-manager/RoleSelector';
import { ConfirmationModal } from "@repo/ui"; // [NEW]

export const UserInvitePage = () => {
  const navigate = useNavigate();
  const { formData, handleChange, actions, loading } = useUserForm();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true); // Trigger modal
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    actions.invite(navigate);
  };

  return (
    <PageContainer 
      title="Invite New User" 
      breadcrumbs={['System', 'Users', 'Invite']}
      actions={
        <button onClick={() => navigate('/system/users')} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16}/> Back
        </button>
      }
    >
      <div className="flex justify-center mt-6">
        <div className="card w-full max-w-2xl bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title mb-6 opacity-80">Invitation Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label"><span className="label-text">First Name</span></label>
                  <label className="input input-bordered flex items-center gap-2">
                    <User size={16} className="opacity-50"/>
                    <input 
                      type="text" required placeholder="Jane" 
                      value={formData.firstName}
                      onChange={e => handleChange('firstName', e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Last Name</span></label>
                  <label className="input input-bordered flex items-center gap-2">
                    <User size={16} className="opacity-50"/>
                    <input 
                      type="text" required placeholder="Doe"
                      value={formData.lastName}
                      onChange={e => handleChange('lastName', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Email Address</span></label>
                <label className="input input-bordered flex items-center gap-2">
                  <Mail size={16} className="opacity-50"/>
                  <input 
                    type="email" required placeholder="jane.doe@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </label>
              </div>

              <RoleSelector 
                selectedRoles={formData.roles}
                onChange={(roles) => handleChange('roles', roles)}
              />

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
        message={`An email will be sent to ${formData.email}. They will have 48 hours to register.`}
        confirmText="Send Now"
        variant="info"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />
    </PageContainer>
  );
};

export default UserInvitePage;