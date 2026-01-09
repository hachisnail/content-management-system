import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { Button, Input, Card, Alert, Badge } from "../../components/UI";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Save,
  ShieldCheck,
  Loader2,
  AtSign, // Icon for username
} from "lucide-react";

const Profile = () => {
  const { user, login } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // Permission Check
  const isSuperAdmin = user?.role?.includes("super_admin");

  const [formData, setFormData] = useState({
    username: "", // <--- NEW
    firstName: "",
    lastName: "",
    middleName: "",
    contactNumber: "",
    birthDay: "",
  });

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      await api.updateUser(user.id, formData);

      // Update session immediately
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "File size too large. Max 5MB allowed.",
      });
      return;
    }

    setUploading(true);
    setMessage({ type: null, text: "" });

    try {
      const data = new FormData();
      data.append("relatedType", "users");
      data.append("relatedId", user.id);
      data.append("isPublic", "true");
      data.append("file", file);

      const response = await api.uploadFile(data);
      const newFile = response.data;

      if (newFile && newFile.id) {
        const newUrl = api.getFileUrl(newFile.id);
        setPreviewAvatar(newUrl);
        login({ ...user, profilePicture: newFile });
      }
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to upload image." });
    } finally {
      setUploading(false);
    }
  };

  const serverAvatarUrl = user?.profilePicture?.id
    ? api.getFileUrl(user.profilePicture.id)
    : null;
  const displayAvatar =
    previewAvatar ||
    (serverAvatarUrl ? `${serverAvatarUrl}?t=${Date.now()}` : null);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          My Profile
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {message.text && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: null, text: "" })}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* AVATAR SECTION */}
        <div className="md:col-span-4 space-y-6">
          <Card className="text-center p-6">
            <div className="relative inline-block group">
              <div className="w-32 h-32 mx-auto rounded-full bg-zinc-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                {uploading ? (
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
                ) : displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-zinc-300" />
                )}
                <div
                  onClick={() => !uploading && fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="text-white" size={24} />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/png, image/jpeg"
              />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-lg text-zinc-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-zinc-500 mb-1">@{user?.username}</p>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
            <div className="mt-4 flex justify-center">
              <Badge variant="neutral" className="px-3 py-1">
                <ShieldCheck size={12} className="mr-1.5" />
                {Array.isArray(user?.role) ? user.role.join(", ") : user?.role}
              </Badge>
            </div>
          </Card>
        </div>

        {/* DETAILS FORM */}
        <div className="md:col-span-8">
          <Card title="Personal Information" className="h-full">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* USERNAME & EMAIL (Protected) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    icon={AtSign}
                    disabled={!isSuperAdmin} // Locked for non-super admins
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
                  disabled={loading || uploading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
