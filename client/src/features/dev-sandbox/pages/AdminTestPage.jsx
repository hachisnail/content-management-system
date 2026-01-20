import React, { useState } from 'react';
import api from '@/lib/api';
import { useConfig } from '@/context/ConfigContext';
import { 
  Button, 
  Input, 
  Alert, 
  Badge, 
  Checkbox 
} from '@/components/UI';
import { UserPlus, Mail, Shield, Check } from 'lucide-react';

function AdminTestPage() {
  const { ROLES } = useConfig();
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
  });
  
  const [selectedRoles, setSelectedRoles] = useState(ROLES.VIEWER ? [ROLES.VIEWER] : []);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleValue) => {
    setSelectedRoles(prev => 
      prev.includes(roleValue) 
        ? prev.filter(r => r !== roleValue) 
        : [...prev, roleValue]
    );
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    setLoading(true);

    try {
      await api.post('/users', { 
        ...formData, 
        roles: selectedRoles 
      });
      
      setStatus({ type: 'success', message: 'User invited successfully. An email has been dispatched.' });
      setFormData({ email: '', firstName: '', lastName: '', middleName: '' });
      setSelectedRoles(ROLES.VIEWER ? [ROLES.VIEWER] : []);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'An error occurred during invitation.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          <UserPlus className="text-indigo-600" size={24} />
          Invite Team Member
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Authorized users will receive a registration link via email to complete their profile setup.
        </p>
      </div>

      {status.type && (
        <Alert 
          type={status.type} 
          message={status.message} 
          onClose={() => setStatus({ type: null, message: '' })} 
        />
      )}

      <form onSubmit={handleInvite} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Section 1: Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={14} /> Personal Information
            </h3>
            <Input 
              label="Email Address" 
              name="email"
              type="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="name@company.com"
              required 
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
              <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </div>
          </div>

          {/* Section 2: Roles */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> Access Permissions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
              {Object.values(ROLES).map((role) => (
               <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all duration-200 group active:scale-[0.98] ${
                  selectedRoles.includes(role)
                    ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 shadow-md shadow-indigo-100'
                    : 'bg-white border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-600'
                }`}
              >
                <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                <div className={`transition-all duration-300 ${selectedRoles.includes(role) ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  <Check size={14} className="text-indigo-600" />
                </div>
              </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-50/80 px-6 py-4 border-t border-zinc-200 flex justify-end gap-3">
          <Button 
            type="submit" 
            isLoading={loading} 
            icon={UserPlus}
            variant="primary"
          >
            {loading ? 'Sending Request...' : 'Dispatch Invitation'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AdminTestPage;