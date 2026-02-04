// web/src/components/common/Avatar.jsx
import React, { useState, useEffect } from "react";
import { fileApi } from "../../features/file/api/file.api";
import apiClient from "../../api/client"; 
import { useSocket } from "../../providers/SocketProvider";

export default function Avatar({ 
  user, 
  size = "w-12", 
  textSize = "text-xl", 
  className = "", 
  ...props 
}) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  // [NEW] Local version state to trigger re-renders on socket events
  const [version, setVersion] = useState(Date.now());
  
  const socket = useSocket();

  // Robust Data Selection logic
  const file = user?.avatar || (Array.isArray(user?.avatarFiles) ? user.avatarFiles[0] : null);
  const fileId = file?.id || user?.avatarId || (typeof file === 'string' ? file : null);
  
  // Default to public unless explicitly private in file metadata
  const isPrivate = file?.visibility === 'private';

  // [NEW] Real-time Listener
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleUpdate = (payload) => {
      // Check if the update is for this user
      if (payload.model === 'User' && payload.data?.id === user.id) {
         // Check if avatarId changed or if it's just a general update (profile pic might have changed)
         setVersion(Date.now());
      }
    };

    socket.on('db:update', handleUpdate);

    return () => {
      socket.off('db:update', handleUpdate);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadAvatar = async () => {
      setImgError(false);

      if (!fileId) {
        setImgSrc(null);
        return;
      }

      // CASE A: Private File (Requires Auth Header)
      if (isPrivate) {
        try {
          // Use apiClient to handle Bearer token automatically
          const response = await apiClient.get(`/files/${fileId}`, { 
            responseType: 'blob' 
          });
          
          if (isMounted) {
            objectUrl = URL.createObjectURL(response.data);
            setImgSrc(objectUrl);
          }
        } catch (err) {
          console.error("Failed to load private avatar:", err);
          if (isMounted) setImgError(true);
        }
      } 
      // CASE B: Public File (Direct URL)
      else {
        // Add cache buster if user was updated recently OR if we have a socket update
        const baseTime = user?.updatedAt ? new Date(user.updatedAt).getTime() : 0;
        // Use the larger of the DB timestamp or our local socket timestamp
        const cacheTime = Math.max(baseTime, version);
        
        const cacheBuster = `?t=${cacheTime}`;
        const url = `${fileApi.getUrl(fileId)}${cacheBuster}`;
        if (isMounted) setImgSrc(url);
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, isPrivate, user?.updatedAt, version]); // Added 'version' dependency

  return (
    <div className={`avatar ${!imgSrc || imgError ? "placeholder" : ""} ${className}`} {...props}>
      <div className={`${size} rounded-full bg-neutral text-neutral-content relative overflow-hidden`}>
        
        {/* Fallback Initials (Background Layer) */}
        <span className={`absolute inset-0 flex items-center justify-center font-bold select-none ${textSize} z-0`}>
          {user?.firstName?.charAt(0).toUpperCase() || "?"}
        </span>

        {/* Image Layer (Foreground) */}
        {imgSrc && !imgError && (
          <img
            src={imgSrc}
            alt="profile"
            className="w-full h-full object-cover relative z-10"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}