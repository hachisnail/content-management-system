import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Button, 
  Input, 
  Card, 
  Alert 
} from '@/components/UI';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Save, 
  AtSign 
} from 'lucide-react';

const ProfileForm = () => {
  const { user, login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  
  const isSuperAdmin = user?.role?.includes("super_admin");

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    middleName: "",
    contactNumber: "",
    birthDay: "",
  });

  // Sync state with user context on load
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        middleName: user.middleName || "",
        contactNumber: user.contactNumber || "",
        birthDay: user.birthDay || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      await api.updateUser(user.id, formData);
      // Optimistically update context
      login({ ...user, ...formData });
      setMessage({
        type: "success",
        text: "Profile information updated successfully.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Personal Information" className="h-full">
      {message.text && (
        <div className="mb-6">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: null, text: "" })}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Fields */}
          <div>
            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              icon={AtSign}
              disabled={!isSuperAdmin}
            />
            {!isSuperAdmin && (
              <p className="text-[10px] text-zinc-400 mt-1 ml-1">
                Username is managed by administrators.
              </p>
            )}
          </div>
          <div className="opacity-70 pointer-events-none">
            <Input
              label="Email Address"
              value={user?.email || ""}
              icon={Mail}
              readOnly
            />
          </div>
        </div>

        <div className="h-px bg-zinc-100" />

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
          <Input
            label="Middle Name"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
          />
          <Input
            label="Contact Number"
            name="contactNumber"
            icon={Phone}
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="+63 900 000 0000"
          />
          <Input
            label="Birthday"
            name="birthDay"
            type="date"
            icon={Calendar}
            value={formData.birthDay}
            onChange={handleChange}
          />
        </div>

        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            isLoading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProfileForm;