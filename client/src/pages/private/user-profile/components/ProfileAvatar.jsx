import React, { useState, useRef } from 'react';
import api from '../../../../api';
import { useAuth } from '../../../../context/AuthContext';
import { 
  Card, 
  Badge, 
  Alert 
} from '../../../../components/UI';
import { 
  User, 
  Camera, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

const ProfileAvatar = () => {
  const { user, login } = useAuth();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Max 5MB allowed.');
      return;
    }

    setUploading(true);
    setError(null);

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
        // Update global auth context
        login({ ...user, profilePicture: newFile });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Determine Image Source
  const serverAvatarUrl = user?.profilePicture?.id
    ? api.getFileUrl(user.profilePicture.id)
    : null;
  
  const displayAvatar = previewAvatar || (serverAvatarUrl ? `${serverAvatarUrl}?t=${Date.now()}` : null);

  return (
    <Card className="text-center p-6 h-full">
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

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
          
          {/* Hover Overlay */}
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

      <div className="mt-4 flex justify-center flex-wrap gap-2">
        {Array.isArray(user?.role) ? (
          user.role.map((r, i) => (
            <Badge key={i} variant="neutral" className="px-3 py-1">
              <ShieldCheck size={12} className="mr-1.5" />
              {r.replace('_', ' ')}
            </Badge>
          ))
        ) : (
          <Badge variant="neutral" className="px-3 py-1">
            <ShieldCheck size={12} className="mr-1.5" />
            {user?.role}
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default ProfileAvatar;