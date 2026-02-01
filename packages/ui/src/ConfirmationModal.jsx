import { useEffect, useRef } from 'react';

export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // Renamed from 'type' to avoid HTML attribute conflicts
  isLoading = false
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle clicking the backdrop to close
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'danger': return 'btn-error';
      case 'success': return 'btn-success';
      case 'info': return 'btn-info';
      default: return 'btn-warning';
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
      onCancel={onClose} // Handles the ESC key
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        
        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            {/* if there is a button in form, it will close the modal */}
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose} 
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              type="button"
              className={`btn ${getVariantClass()}`} 
              onClick={onConfirm} 
              disabled={isLoading}
            >
              {isLoading && <span className="loading loading-spinner loading-xs"></span>}
              {confirmText}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};