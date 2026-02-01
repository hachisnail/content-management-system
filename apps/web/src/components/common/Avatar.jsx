import React, { useState, useEffect } from "react";
import { fileApi } from "../../api/file.api";

export default function Avatar({ 
  user, 
  size = "w-12", 
  textSize = "text-xl", 
  className = "", 
  ...props 
}) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);

  // [FIX] Robust Data Selection
  // 1. Try 'user.avatar' (Standard User List format)
  // 2. Fallback to 'user.avatarFiles[0]' (Audit Log/Raw Association format)
  const file = user?.avatar || (Array.isArray(user?.avatarFiles) ? user.avatarFiles[0] : null);
  
  const fileId = file?.id || (typeof file === 'string' ? file : null);
  const isPrivate = file?.visibility === 'private';

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadAvatar = async () => {
      setImgError(false);

      if (!fileId) {
        setImgSrc(null);
        return;
      }

      if (isPrivate) {
        try {
          const blob = await fileApi.fetchImageBlob(fileId);
          if (isMounted) {
            objectUrl = URL.createObjectURL(blob);
            setImgSrc(objectUrl);
          }
        } catch (err) {
          console.error("Failed to load private avatar:", err);
          if (isMounted) setImgError(true);
        }
      } else {
        const cacheBuster = user?.updatedAt ? `?t=${new Date(user.updatedAt).getTime()}` : '';
        const url = `${fileApi.getUrl(fileId)}${cacheBuster}`;
        if (isMounted) setImgSrc(url);
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, isPrivate, user?.updatedAt]);

  return (
    <div className={`avatar ${!imgSrc || imgError ? "placeholder" : ""} ${className}`} {...props}>
      <div className={`${size} rounded-full bg-neutral text-neutral-content relative overflow-hidden`}>
        {/* Fallback Initials */}
        <span className={`absolute inset-0 flex items-center justify-center font-bold select-none ${textSize} z-0`}>
          {user?.firstName?.charAt(0).toUpperCase() || "?"}
        </span>

        {/* Image Layer */}
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