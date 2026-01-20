import { useState } from "react";
import api from "@/lib/api";

const Avatar = ({ user, size = "md", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-32 h-32 text-4xl",
  };

  const imageUrl = user?.profilePicture?.id
    ? api.getFileUrl(user.profilePicture.id)
    : null;

  const getInitials = () => {
    if (!user) return "?";

    if (user.firstName) {
      return `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase();
    }

    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "?";
  };

  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-bold text-zinc-500 bg-zinc-100 select-none">
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export default Avatar;