import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useConfig } from '@/context/ConfigContext';
import { 
  Button, 
  Input, 
  Alert, 
  Card 
} from '@/components/UI';
import { UserPlus, Mail, Shield, Check, ArrowLeft } from 'lucide-react';

function InviteUserPage() {
  const navigate = useNavigate();
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
      
      setStatus({ type: 'success', message: 'User invited successfully.' });
      setFormData({ email: '', firstName: '', lastName: '', middleName: '' });
      setSelectedRoles(ROLES.VIEWER ? [ROLES.VIEWER] : []);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Invitation failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate('/users')} className="mb-2 pl-0 hover:bg-transparent hover:text-indigo-600">
        <ArrowLeft size={16} className="mr-2" /> Back to Directory
      </Button>

      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Invite New User</h1>
        <p className="text-zinc-500 text-sm mt-1">Send an email invitation with a registration link.</p>
      </div>

      {status.type && (
        <Alert 
          type={status.type} 
          message={status.message} 
          onClose={() => setStatus({ type: null, message: '' })} 
        />
      )}

      <Card>
        <form onSubmit={handleInvite} className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={14} /> Contact Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Email Address" 
                name="email"
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="colleague@museum.org"
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> Assign Roles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(ROLES).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                    selectedRoles.includes(role)
                      ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                  {selectedRoles.includes(role) && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <Button type="submit" isLoading={loading} icon={UserPlus}>
              Dispatch Invitation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default InviteUserPage;