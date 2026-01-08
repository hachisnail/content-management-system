import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../../../api';
import useRealtimeResource from '../../../../hooks/useRealtimeResource';
import { useAuth } from '../../../../context/AuthContext';
import { decodeId } from '../../../../utils/idEncoder';
import { 
  Button, 
  Input, 
  Card, 
  Alert, 
  Badge,
  Avatar,
  DataTable,
  ConfirmationModal // Import Modal
} from '../../../../components/UI';
import { 
  Save, 
  ArrowLeft, 
  Clock, 
  Phone,
  Calendar,
  Activity,
  Mail,
  Lock,
  ShieldAlert
} from 'lucide-react';

function UserProfile() {
  const { id: encodedId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const userId = decodeId(encodedId);
  const { setBreadcrumbLabel } = useOutletContext() || {}; 
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [showConfirm, setShowConfirm] = useState(false); // Modal State

  // 1. Fetch Data
  const { data: user } = useRealtimeResource('users', { id: userId });
  
  // 2. Fetch Logs
  const { data: logsData } = useRealtimeResource('audit_logs', { 
    queryParams: { 
      search: user?.email || 'skip_query', 
      limit: 50,
      sortBy: 'createdAt',
      sortDir: 'DESC'
    },
    isEnabled: !!user?.email
  });
  const logs = Array.isArray(logsData) ? logsData : [];

  // --- PERMISSION LOGIC ---
  const isSuperAdmin = currentUser?.role?.includes('super_admin');
  const isAdmin = currentUser?.role?.includes('admin');
  const isSelf = parseInt(currentUser?.id) === parseInt(userId);
  const targetIsSuperAdmin = user?.role?.includes('super_admin');

  let canEditBasic = false;
  let canEditEmail = false;

  if (isSelf) {
    canEditBasic = true;
  } else if (isSuperAdmin) {
    canEditBasic = true;
    canEditEmail = true;
  } else if (isAdmin) {
    canEditBasic = !targetIsSuperAdmin;
  }

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    birthDay: '',
  });

  // Store initial state to check for changes
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (user) {
      const data = {
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        birthDay: user.birthDay || '',
      };
      setFormData(data);
      setInitialData(data); // Set reference point

      if (setBreadcrumbLabel) {
        setBreadcrumbLabel(`${user.firstName} ${user.lastName}`);
      }
    }
    return () => {
       if (setBreadcrumbLabel) setBreadcrumbLabel(null);
    }
  }, [user, setBreadcrumbLabel]);

  // Check if dirty
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!hasChanges) return;
    setShowConfirm(true); // Open Modal
  };

  const handleConfirmUpdate = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await api.updateUser(userId, formData);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      // Update initial data to match new state
      setInitialData({ ...formData });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return <Alert type="error" title="Invalid Link" message="The user ID in this link is malformed." />;
  if (!user) return <div className="p-8 text-center text-zinc-500">Loading user data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/users')} className="pl-0 hover:bg-transparent hover:text-indigo-600">
          <ArrowLeft size={16} className="mr-2" /> Back to Directory
        </Button>
      </div>

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: null, text: '' })} />
      )}

      {!canEditBasic && (
         <Alert 
            type="warning" 
            icon={ShieldAlert} 
            title="Restricted Access"
            message="You are viewing a Super Admin profile. Your administrative privileges do not allow modification of this account." 
            className="bg-amber-50 border-amber-200 text-amber-800" 
         />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="text-center p-8">
             <div className="flex justify-center mb-4">
                <Avatar user={user} size="xl" className="shadow-lg border-4 border-white" />
             </div>
             <h2 className="text-xl font-bold text-zinc-900">{user.firstName} {user.lastName}</h2>
             <p className="text-sm text-zinc-500 mb-4">{user.email}</p>
             
             <div className="flex justify-center gap-2 mb-6">
               {Array.isArray(user.role) ? user.role.map(r => (
                 <Badge key={r} variant="dark" className="capitalize">{r}</Badge>
               )) : <Badge variant="dark">{user.role}</Badge>}
             </div>

             <div className="border-t border-zinc-100 pt-4 text-left space-y-3">
               <div className="flex items-center justify-between text-sm">
                 <span className="text-zinc-500 flex items-center gap-2"><Activity size={14}/> Status</span>
                 <Badge variant={user.isOnline ? 'success' : 'neutral'}>{user.isOnline ? 'Online' : 'Offline'}</Badge>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="text-zinc-500 flex items-center gap-2"><Clock size={14}/> Last Active</span>
                 <span className="text-zinc-900 font-mono text-xs">{user.last_active ? new Date(user.last_active).toLocaleString() : 'N/A'}</span>
               </div>
             </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Card 
            title={
                <div className="flex items-center gap-2">
                    <span>User Information</span>
                    {!canEditBasic && <Badge variant="warning"><Lock size={10} className="mr-1"/> Read Only</Badge>}
                </div>
            }
          >
            <form onSubmit={handleSaveClick} className="space-y-4">
              
              <Input 
                label="Email Address" 
                icon={Mail}
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                disabled={!canEditEmail}
              />
              {!canEditEmail && <p className="text-[10px] text-zinc-400 mt-[-10px] ml-1">Only Super Admins can modify email addresses.</p>}

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="First Name" 
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  disabled={!canEditBasic}
                />
                <Input 
                  label="Last Name" 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  disabled={!canEditBasic}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Contact Number" 
                  icon={Phone}
                  value={formData.contactNumber} 
                  onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  disabled={!canEditBasic}
                />
                <Input 
                  label="Birthday" 
                  type="date"
                  icon={Calendar}
                  value={formData.birthDay} 
                  onChange={e => setFormData({...formData, birthDay: e.target.value})}
                  disabled={!canEditBasic}
                />
              </div>
              
              {canEditBasic && (
                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    icon={Save} 
                    isLoading={loading}
                    // Disable if no changes or currently loading
                    disabled={!hasChanges || loading}
                    className={!hasChanges ? "opacity-50 grayscale cursor-not-allowed" : ""}
                  >
                    {hasChanges ? "Save Changes" : "No Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Card>

          <Card title="Activity Log">
            <div className="max-h-96 overflow-y-auto">
              <DataTable 
                data={logs}
                columns={[
                  { 
                    header: "Action", 
                    accessor: "operation",
                    render: (log) => <Badge variant="neutral">{log.operation}</Badge>
                  },
                  { 
                    header: "Description", 
                    accessor: "description",
                    render: (log) => <span className="text-sm text-zinc-600">{log.description}</span>
                  },
                  { 
                    header: "Time", 
                    accessor: "createdAt",
                    render: (log) => <span className="text-xs font-mono text-zinc-400">{new Date(log.createdAt).toLocaleString()}</span>
                  }
                ]}
              />
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Updates"
        message={`Are you sure you want to update the profile information for ${user.firstName}?`}
        confirmLabel="Save Changes"
      />
    </div>
  );
}

export default UserProfile;