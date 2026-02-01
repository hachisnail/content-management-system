// web/src/components/common/AvatarUpload.jsx
import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload'; //
import { fileApi } from '../../api/file.api'; //

const AvatarUpload = ({ user, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const { upload, isUploading, progress } = useFileUpload();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Upload and automatically link to the User record
      const result = await upload(file, {
        recordId: user.id,
        recordType: 'users', // Matches the backend scope
        category: 'avatar',
        visibility: 'public',
        replaceExisting: true // [NEW] Explicitly request replacement logic
      });

      // Notify parent to refresh user data
      if (onUploadSuccess) onUploadSuccess(result.file);
      
    } catch (error) {
      console.error("Avatar upload failed:", error);
      // You could trigger a toast notification here
    }
  };

  // Determine the image source: either a direct file object (if just uploaded) or the URL from the user object
  const getAvatarSrc = () => {
    if (user?.avatar?.id) {
       return fileApi.getUrl(user.avatar.id, user.avatar.visibility === 'private');
    }
    return null;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div className="relative group">
      <div className="avatar">
        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 relative">
          
          {/* 1. Display Image or Initials */}
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral text-neutral-content text-3xl font-bold">
              {user?.firstName?.charAt(0)}
            </div>
          )}

          {/* 2. Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-1">
                 <Loader2 className="w-6 h-6 animate-spin text-white" />
                 <span className="text-[10px] text-white font-medium">{progress}%</span>
              </div>
            </div>
          )}

          {/* 3. Hover Overlay (Upload Button) */}
          {!isUploading && (
            <div 
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer z-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;