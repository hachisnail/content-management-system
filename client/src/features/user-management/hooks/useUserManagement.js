import { useState } from "react";
import socket from "@/lib/socket";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";

export const useUserManagement = (users = []) => {
  const { user: currentUser } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();

  // --- SINGLE SOURCE OF TRUTH FOR MODALS ---
  // type: 'DISCONNECT' | 'DISABLE' | 'ENABLE' | 'REVOKE' | 'BULK_DISCONNECT' | null
  const [activeModal, setActiveModal] = useState({
    type: null,
    targetId: null,
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null);

  // --- HELPERS ---
  const isSuperAdmin = currentUser?.role?.includes("super_admin");

  const isProtected = (targetId) => {
    const targetUser = users.find((u) => u.id === targetId);
    if (!targetUser) return false;
    const targetIsSuper = targetUser.role?.includes("super_admin");
    return targetIsSuper && !isSuperAdmin;
  };

  const closeModal = () => setActiveModal({ type: null, targetId: null });

  // --- TRIGGERS (Passed to UI) ---
  const promptDisconnect = (id) =>
    setActiveModal({ type: "DISCONNECT", targetId: id });
  const promptDisable = (id) =>
    setActiveModal({ type: "DISABLE", targetId: id });
  const promptEnable = (id) => setActiveModal({ type: "ENABLE", targetId: id });
  const promptRevoke = (id) => setActiveModal({ type: "REVOKE", targetId: id });
  const promptBulkDisconnect = () =>
    setActiveModal({ type: "BULK_DISCONNECT", targetId: null });

  // --- EXECUTION HANDLERS ---

  // 1. Force Disconnect
  const confirmDisconnect = () => {
    const { targetId } = activeModal;
    if (targetId) {
      if (isProtected(targetId)) {
        setStatusMsg({
          type: "error",
          text: "Forbidden: You cannot disconnect a Super Admin.",
        });
      } else {
        socket.emit("force_disconnect_user", { userId: targetId });
        setStatusMsg({
          type: "success",
          text: "User disconnected successfully.",
        });
      }
      closeModal();
    }
  };

  // 2. Disable Account
  const confirmDisable = async () => {
    const { targetId } = activeModal;
    if (targetId) {
      if (isProtected(targetId)) {
        setStatusMsg({
          type: "error",
          text: "Forbidden: You cannot disable a Super Admin.",
        });
        closeModal();
        return;
      }

      try {
        socket.emit("force_disconnect_user", { userId: targetId });
        await api.updateUser(targetId, { status: "disabled" });
        setStatusMsg({
          type: "success",
          text: "Account disabled and session terminated.",
        });
      } catch (err) {
        setStatusMsg({ type: "error", text: "Failed to disable account." });
      } finally {
        closeModal();
      }
    }
  };

  // 3. Enable Account
  const confirmEnable = async () => {
    const { targetId } = activeModal;
    if (targetId) {
      if (isProtected(targetId)) {
        setStatusMsg({ type: "error", text: "Forbidden: Restricted account." });
        closeModal();
        return;
      }

      try {
        await api.updateUser(targetId, { status: "active" });
        setStatusMsg({
          type: "success",
          text: "Account re-enabled successfully.",
        });
      } catch (err) {
        setStatusMsg({ type: "error", text: "Failed to enable account." });
      } finally {
        closeModal();
      }
    }
  };

  // 4. Revoke Invitation
  const confirmRevoke = async () => {
    const { targetId } = activeModal;
    if (targetId) {
      try {
        await api.deleteUser(targetId);
        setStatusMsg({
          type: "success",
          text: "Invitation revoked and user record removed.",
        });
      } catch (err) {
        setStatusMsg({
          type: "error",
          text: err.message || "Failed to revoke invitation.",
        });
      } finally {
        closeModal();
      }
    }
  };

  // 5. Bulk Disconnect
  const confirmBulkDisconnect = () => {
    const eligibleIds = selectedUsers.filter((userId) => {
      const u = users.find((user) => user.id === userId);
      if (!u) return false;
      const targetIsSuper = u.role?.includes("super_admin");
      if (targetIsSuper && !isSuperAdmin) return false;
      return u.isOnline && u.id !== currentUser.id;
    });

    if (eligibleIds.length === 0) {
      setStatusMsg({
        type: "error",
        text: "No eligible users selected (Protected accounts skipped).",
      });
    } else {
      eligibleIds.forEach((userId) =>
        socket.emit("force_disconnect_user", { userId })
      );
      setStatusMsg({
        type: "success",
        text: `Disconnected ${eligibleIds.length} users.`,
      });
    }

    closeModal();
    setSelectedUsers([]);
  };

  return {
    // State
    activeModal, // Use this for conditional rendering
    selectedUsers,
    setSelectedUsers,
    statusMsg,
    setStatusMsg,

    // Triggers
    promptDisconnect,
    promptDisable,
    promptEnable,
    promptRevoke,
    promptBulkDisconnect,
    closeModal,

    // Confirmations
    confirmDisconnect,
    confirmDisable,
    confirmEnable,
    confirmRevoke,
    confirmBulkDisconnect,

    currentUser,
    hasPermission,
    PERMISSIONS,
  };
};
