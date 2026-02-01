import React, { useState, useEffect, useRef } from 'react';

export const PromptModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  title, 
  label,
  initialValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const [value, setValue] = useState(initialValue);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };
  
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="modal modal-bottom sm:modal-middle"
      onClick={handleBackdropClick}
      onCancel={onClose}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        
        <form onSubmit={handleSubmit} className="py-4">
           <label className="label">
              <span className="label-text">{label}</span>
            </label>
           <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input input-bordered w-full"
            />
        </form>

        <div className="modal-action">
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
              className="btn btn-primary"
              onClick={handleSubmit} 
              disabled={isLoading || !value.trim()}
            >
              {isLoading && <span className="loading loading-spinner loading-xs"></span>}
              {submitText}
            </button>
        </div>
      </div>
    </dialog>
  );
};
