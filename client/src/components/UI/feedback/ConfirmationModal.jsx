import { AlertTriangle } from "lucide-react";
import Modal from "./Modal"; 
import Button from "../buttons/Button";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isDangerous = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center p-2">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDangerous ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        <AlertTriangle size={24} />
      </div>
      <p className="text-zinc-600 mb-6">{message}</p>
      <div className="flex gap-3 w-full">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={isDangerous ? "danger" : "primary"}
          className="flex-1"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmationModal;