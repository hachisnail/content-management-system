import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop"; 
import { Camera, Loader2, UploadCloud, ZoomIn, ZoomOut } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useConfig } from "../../../../context/ConfigContext";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { Avatar, Button, Alert, Modal } from "../../../../components/UI";
import { getCroppedImg, readFile } from "../../../../utils/cropUtils"; 
import api from "../../../../api"; // Import API to resolve URLs

const ProfileAvatar = () => {
  const { user, login } = useAuth(); // <--- Get login to update session
  const { FILE_LIMITS } = useConfig();
  const { upload, uploading, error: uploadError } = useFileUpload();
  
  const fileInputRef = useRef(null);
  
  // -- State for Cropping --
  const [imgSrc, setImgSrc] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const limitBytes = FILE_LIMITS?.users || 5 * 1024 * 1024;
  const limitLabel = (limitBytes / (1024 * 1024)).toFixed(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);

    if (!file.type.startsWith("image/")) {
      setValidationError("Invalid file type. Please select an image (JPG, PNG).");
      return;
    }

    if (file.size > limitBytes * 2) {
       setValidationError(`Image is too large to process. Max ${limitLabel * 2}MB allowed.`);
       return;
    }

    try {
      const imageDataUrl = await readFile(file);
      setImgSrc(imageDataUrl);
    } catch (err) {
      setValidationError("Failed to read image file.");
    } finally {
      e.target.value = null; 
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!imgSrc || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels);
      const fileToUpload = new File([croppedBlob], "profile_avatar.jpg", {
        type: "image/jpeg",
      });

      setImgSrc(null); 
      
      // Perform Upload
      const response = await upload(fileToUpload, {
        relatedType: 'users',
        relatedId: user.id,
        category: 'profile_picture', 
        isPublic: true 
      }, {
        maxSize: limitBytes 
      });

      // --- FIX: OPTIMISTIC UPDATE ---
      // If upload succeeded, immediately update the local user context
      if (response && response.data) {
        login({ ...user, profilePicture: response.data });
      }

    } catch (err) {
      console.error("Crop/Upload failed", err);
      if (!uploadError) setValidationError("Failed to process image.");
    }
  };

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6 flex flex-col items-center text-center">
        <div className="relative group mb-4">
          {/* Avatar Component will now receive the NEW user object with the new picture */}
          <Avatar
            user={user}
            size="xl"
            className={`ring-4 ring-zinc-50 transition-all ${
              uploading ? "opacity-50 blur-sm" : ""
            }`}
          />

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-zinc-900 w-8 h-8" />
            </div>
          )}

          {!uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer backdrop-blur-sm"
            >
              <Camera size={24} />
              <span className="text-xs font-medium mt-1">Change</span>
            </button>
          )}
        </div>

        <h3 className="text-lg font-bold text-zinc-900 truncate max-w-full">
          {user?.firstName} {user?.lastName}
        </h3>
        <p className="text-zinc-500 text-sm mb-4 capitalize">
          {Array.isArray(user?.role) ? user.role.join(", ") : user?.role}
        </p>

        {(uploadError || validationError) && (
          <Alert
            type="error"
            message={uploadError || validationError}
            className="mb-4 text-left w-full text-xs"
          />
        )}

        <div className="w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
          />
          <Button
            variant="secondary"
            className="w-full"
            icon={UploadCloud}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Upload New Picture"}
          </Button>
          <p className="text-[10px] text-zinc-400 mt-2">
            Recommended: Square JPG/PNG, max {limitLabel}MB.
          </p>
        </div>
      </div>

      <Modal
        isOpen={!!imgSrc}
        onClose={() => setImgSrc(null)}
        title="Adjust Profile Picture"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImgSrc(null)}>Cancel</Button>
            <Button onClick={handleCropAndUpload} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : "Save & Upload"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-[300px] bg-zinc-900 rounded-lg overflow-hidden">
            <Cropper
              image={imgSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          
          <div className="flex items-center gap-2 px-2">
            <ZoomOut size={16} className="text-zinc-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <ZoomIn size={16} className="text-zinc-400" />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProfileAvatar;