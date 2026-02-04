// web/src/components/common/AvatarUpload.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { fileApi } from '../../features/file/api/file.api';

const AvatarUpload = ({ user, onUploadSuccess, size = "w-24 h-24" }) => {
  const fileInputRef = useRef(null);
  const { upload, isUploading, progress, error } = useFileUpload();
  
  // [FIX] Local state for immediate "Optimistic UI" updates
  // This prevents the 404 race condition by showing the new file ID immediately
  const [previewFile, setPreviewFile] = useState(null);

  // Reset preview if user object changes (e.g. after a successful refresh finishes)
  useEffect(() => {
    setPreviewFile(null);
  }, [user?.avatar?.id]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Upload with metadata explicitly matching backend scope
      const result = await upload(file, {
        recordId: user.id,
        recordType: 'users',
        category: 'avatar',
        visibility: 'public', // Avatars are usually public
        replaceExisting: true // [CRITICAL] Triggers server-side cleanup of old avatar
      });

      // 2. Update local state immediately with the NEW file object
      if (result?.file) {
        setPreviewFile(result.file);
      }

      // 3. Notify parent to refresh global context
      if (onUploadSuccess) onUploadSuccess(result.file);
      
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  };

  // Helper to determine which ID to show
  const getDisplaySource = () => {
    // 1. Use local preview if available (highest priority after upload)
    if (previewFile?.id) {
      return fileApi.getUrl(previewFile.id);
    }
    
    // 2. Use User's existing avatar
    // Supports both populated File object or raw ID string
    const avatarId = user?.avatar?.id || user?.avatarId;
    if (avatarId) {
      // Assuming avatars are public. If private, Avatar.jsx logic is needed.
      // For upload previews, public URL is standard.
      return fileApi.getUrl(avatarId);
    }

    return null;
  };

  const avatarSrc = getDisplaySource();

  return (
    <div className="relative group inline-block">
      <div className="avatar">
        <div className={`${size} rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 relative`}>
          
          {/* 1. Display Image or Initials */}
          {avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt="Profile" 
              className="object-cover w-full h-full"
              onError={(e) => {
                // Fallback on error (e.g. broken link)
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral text-neutral-content text-3xl font-bold select-none">
              {user?.firstName?.charAt(0).toUpperCase()}
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
              title="Change Avatar"
            >
              <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Error Message Tooltip */}
      {error && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-error text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          <span>Upload failed</span>
        </div>
      )}

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