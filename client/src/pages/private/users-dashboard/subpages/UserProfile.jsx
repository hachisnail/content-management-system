import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import api from "../../../../api";
import { useRealtimeResource } from "../../../../hooks/useRealtimeResource";
import { useAuth } from "../../../../context/AuthContext";
import { useConfig } from "../../../../context/ConfigContext";
import { decodeId } from "../../../../utils/idEncoder";
import { useUserManagement } from "../hooks/useUserManagement";
import {
  Button,
  Input,
  Card,
  Alert,
  Badge,
  Avatar,
  DataTable,
  ConfirmationModal,
} from "../../../../components/UI";
import ComponentErrorBoundary from "../../../../components/ComponentErrorBoundary";
import {
  Save,
  ArrowLeft,
  Clock,
  Phone,
  Calendar,
  Activity,
  Mail,
  Lock,
  ShieldAlert,
  AtSign,
  Shield,
  Edit,
  X,
  Power,
  Ban,
  CheckCircle,
} from "lucide-react";

// --- HELPER: Read-Only Field Component ---
const InfoField = ({ label, value, icon: Icon }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1.5">
      {Icon && <Icon size={12} />} {label}
    </label>
    <div className="text-sm font-medium text-zinc-900 border-b border-zinc-100 pb-1">
      {value || <span className="text-zinc-300 italic">Not set</span>}
    </div>
  </div>
);

function UserProfile() {
  const { id: encodedId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { ROLES, hasPermission, PERMISSIONS } = useConfig();

  const userId = decodeId(encodedId);
  const { setBreadcrumbLabel } = useOutletContext() || {};

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [showConfirm, setShowConfirm] = useState(false);

  // --- DATA FETCHING ---
  const { data: user } = useRealtimeResource("users", { id: userId });
  const { data: logsData } = useRealtimeResource("audit_logs", {
    queryParams: {
      search: user?.email || "skip_query",
      limit: 50,
      sortBy: "createdAt",
      sortDir: "DESC",
    },
    isEnabled:
      !!user?.email && hasPermission(currentUser, PERMISSIONS.VIEW_AUDIT_LOGS),
  });
  const logs = logsData || [];

  // --- MANAGEMENT HOOK ---
  const {
    activeModal,
    closeModal,
    promptDisconnect,
    promptDisable,
    promptEnable,
    confirmDisconnect,
    confirmDisable,
    confirmEnable,
    statusMsg: managementStatusMsg,
    setStatusMsg: setManagementStatusMsg,
  } = useUserManagement(user ? [user] : []);

  // --- PERMISSION LOGIC ---
  // FIX: Use String() comparison against the FETCHED user object for accuracy
  const isSelf = user && currentUser && String(currentUser.id) === String(user.id);
  
  const isSuperAdmin = currentUser?.role?.includes("super_admin");
  const isProtectedTarget = user?.role?.includes("super_admin") && !isSuperAdmin;

  const canEditBasic = isSelf || hasPermission(currentUser, PERMISSIONS.MANAGE_USERS);
  const canEditRoles = hasPermission(currentUser, PERMISSIONS.MANAGE_USER_ROLES);
  const canEditIdentity = isSuperAdmin;

  // FIX: Ensure !isSelf is strictly checked for dangerous actions
  const canDisconnect =
    hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) &&
    !isProtectedTarget &&
    !isSelf;

  const canManageStatus =
    hasPermission(currentUser, PERMISSIONS.MANAGE_USER_STATUS) &&
    !isProtectedTarget &&
    !isSelf;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    contactNumber: "",
    birthDay: "",
    role: [],
  });

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (user) {
      const currentRoles = Array.isArray(user.role) ? user.role : [user.role];

      const data = {
        username: user.username || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        contactNumber: user.contactNumber || "",
        birthDay: user.birthDay || "",
        role: currentRoles,
      };
      setFormData(data);
      setInitialData(data);

      if (setBreadcrumbLabel) {
        setBreadcrumbLabel(`${user.firstName} ${user.lastName}`);
      }
    }
    return () => {
      if (setBreadcrumbLabel) setBreadcrumbLabel(null);
    };
  }, [user, setBreadcrumbLabel]);

  // Sync management messages
  useEffect(() => {
    if (managementStatusMsg) {
      setMessage({
        type: managementStatusMsg.type,
        text: managementStatusMsg.text,
      });
    }
  }, [managementStatusMsg]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleRoleToggle = (roleValue) => {
    if (!canEditRoles || !isEditing) return;
    setFormData((prev) => {
      const exists = prev.role.includes(roleValue);
      const newRoles = exists
        ? prev.role.filter((r) => r !== roleValue)
        : [...prev.role, roleValue];
      return { ...prev, role: newRoles };
    });
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!hasChanges) return;
    setShowConfirm(true);
  };

  const handleCancelEdit = () => {
    setFormData(initialData);
    setIsEditing(false);
    setMessage({ type: null, text: "" });
  };

  const handleConfirmUpdate = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await api.updateUser(userId, formData);
      setMessage({ type: "success", text: "Profile updated successfully." });
      setInitialData({ ...formData });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  if (!userId)
    return (
      <Alert
        type="error"
        title="Invalid Link"
        message="The user ID in this link is malformed."
      />
    );
  if (!user)
    return (
      <div className="p-8 text-center text-zinc-500">Loading user data...</div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/users")}
          className="pl-0 hover:bg-transparent hover:text-indigo-600"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Directory
        </Button>

        <div className="flex items-center gap-2">
          {canDisconnect && (
            <Button
              variant="secondary"
              size="sm"
              icon={Power}
              disabled={!user.isOnline}
              onClick={() => promptDisconnect(user.id)}
              className="text-zinc-600 border-zinc-300 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              Force Disconnect
            </Button>
          )}

          {canManageStatus &&
            (user.status === "disabled" ? (
              <Button
                variant="secondary"
                size="sm"
                icon={CheckCircle}
                onClick={() => promptEnable(user.id)}
                className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
              >
                Enable Account
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                icon={Ban}
                onClick={() => promptDisable(user.id)}
              >
                Disable Account
              </Button>
            ))}
        </div>
      </div>

      {message.text && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => {
            setMessage({ type: null, text: "" });
            setManagementStatusMsg(null);
          }}
        />
      )}

      {!canEditBasic && !canEditRoles && !canEditIdentity && (
        <Alert
          type="warning"
          icon={ShieldAlert}
          title="Restricted Access"
          message="You do not have permission to edit this profile."
          className="bg-amber-50 border-amber-200 text-amber-800"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: AVATAR & QUICK STATS */}
        <div className="lg:col-span-4 space-y-6">
          <ComponentErrorBoundary title="User Info Failed">
            <Card className="text-center p-8">
              <div className="flex justify-center mb-4">
                <Avatar
                  user={user}
                  size="xl"
                  className="shadow-lg border-4 border-white"
                />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-zinc-500 font-medium">
                @{user.username}
              </p>
              <p className="text-xs text-zinc-400 mb-4">{user.email}</p>

              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {formData.role.map((r) => (
                  <Badge key={r} variant="dark" className="capitalize">
                    {r.replace("_", " ")}
                  </Badge>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-4 text-left space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2">
                    <Activity size={14} /> Status
                  </span>
                  <Badge variant={user.isOnline ? "success" : "neutral"}>
                    {user.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 flex items-center gap-2">
                    <Clock size={14} /> Last Active
                  </span>
                  <span className="text-zinc-900 font-mono text-xs">
                    {user.last_active
                      ? new Date(user.last_active).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </Card>
          </ComponentErrorBoundary>
        </div>

        {/* RIGHT COLUMN: DETAILS & FORM */}
        <div className="lg:col-span-8 space-y-8">
          <ComponentErrorBoundary title="Edit Form Failed">
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>User Information</span>
                    {!isEditing && (
                      <Badge variant="neutral">
                        <Lock size={10} className="mr-1" /> View Only
                      </Badge>
                    )}
                  </div>

                  {/* EDIT TOGGLE BUTTON */}
                  {(canEditBasic || canEditRoles || canEditIdentity) &&
                    (!isEditing ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Edit}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={X}
                        onClick={handleCancelEdit}
                        className="text-zinc-500 hover:text-zinc-900"
                      >
                        Cancel Editing
                      </Button>
                    ))}
                </div>
              }
            >
              {/* --- VIEW MODE: Clean Text Display --- */}
              {!isEditing ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 mb-3">
                      <Shield size={14} /> System Roles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.role.length > 0 ? (
                        formData.role.map((r) => (
                          <span
                            key={r}
                            className="px-2.5 py-1 rounded bg-white border border-zinc-200 text-xs font-medium text-zinc-600 uppercase tracking-wide"
                          >
                            {r.replace(/_/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 italic text-sm">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InfoField
                      label="Email Address"
                      value={formData.email}
                      icon={Mail}
                    />
                    <InfoField
                      label="Username"
                      value={formData.username}
                      icon={AtSign}
                    />
                    <InfoField
                      label="First Name"
                      value={formData.firstName}
                    />
                    <InfoField
                      label="Last Name"
                      value={formData.lastName}
                    />
                    <InfoField
                      label="Contact Number"
                      value={formData.contactNumber}
                      icon={Phone}
                    />
                    <InfoField
                      label="Birthday"
                      value={
                        formData.birthDay
                          ? new Date(formData.birthDay).toLocaleDateString()
                          : null
                      }
                      icon={Calendar}
                    />
                  </div>
                </div>
              ) : (
                /* --- EDIT MODE: Form Inputs --- */
                <form
                  onSubmit={handleSaveClick}
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* SYSTEM ROLES EDIT */}
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 mb-3">
                      <Shield size={14} /> System Roles{" "}
                      {!canEditRoles && "(Locked)"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ROLES).map((role) => {
                        const isSelected = formData.role.includes(role);
                        const isDisabled = !canEditRoles;
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleRoleToggle(role)}
                            disabled={isDisabled}
                            className={`
                              px-3 py-1.5 rounded text-xs font-medium border transition-all
                              ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50"
                              }
                              ${
                                isDisabled
                                  ? "opacity-60 cursor-not-allowed"
                                  : "cursor-pointer active:scale-95"
                              }
                            `}
                          >
                            {role.replace(/_/g, " ").toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100"></div>

                  {/* IDENTITY FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Email Address"
                        icon={Mail}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={!canEditIdentity}
                      />
                    </div>
                    <div>
                      <Input
                        label="Username"
                        icon={AtSign}
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        disabled={!canEditIdentity}
                      />
                    </div>
                  </div>

                  {/* PERSONAL FIELDS */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      disabled={!canEditBasic}
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={!canEditBasic}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Contact Number"
                      icon={Phone}
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                      disabled={!canEditBasic}
                    />
                    <Input
                      label="Birthday"
                      type="date"
                      icon={Calendar}
                      value={formData.birthDay}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDay: e.target.value })
                      }
                      disabled={!canEditBasic}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      isLoading={loading}
                      disabled={!hasChanges || loading}
                      className={
                        !hasChanges
                          ? "opacity-50 grayscale cursor-not-allowed"
                          : ""
                      }
                    >
                      {hasChanges ? "Save Changes" : "No Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </ComponentErrorBoundary>

          {hasPermission(currentUser, PERMISSIONS.VIEW_AUDIT_LOGS) && (
            <ComponentErrorBoundary title="Activity Log Failed">
              <Card title="Activity Log">
                <div className="max-h-96 overflow-y-auto">
                  <DataTable
                    data={logs}
                    columns={[
                      {
                        header: "Action",
                        accessor: "operation",
                        render: (log) => (
                          <Badge variant="neutral">{log.operation}</Badge>
                        ),
                      },
                      {
                        header: "Description",
                        accessor: "description",
                        render: (log) => (
                          <span className="text-sm text-zinc-600">
                            {log.description}
                          </span>
                        ),
                      },
                      {
                        header: "Time",
                        accessor: "createdAt",
                        render: (log) => (
                          <span className="text-xs font-mono text-zinc-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            </ComponentErrorBoundary>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Updates"
        message={`Are you sure you want to update the profile information for ${user.firstName}?`}
        confirmLabel="Save Changes"
      />

      {activeModal.type === "DISCONNECT" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={confirmDisconnect}
          title="Disconnect User?"
          message="This will immediately terminate the user's active session."
          confirmLabel="Force Disconnect"
          isDangerous={true}
        />
      )}

      {activeModal.type === "DISABLE" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={confirmDisable}
          title="Disable Account?"
          message="This will disconnect the user and prevent them from logging in again."
          confirmLabel="Disable Account"
          isDangerous={true}
        />
      )}

      {activeModal.type === "ENABLE" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={confirmEnable}
          title="Re-enable Account?"
          message="This user will be allowed to log in again immediately."
          confirmLabel="Enable Account"
        />
      )}
    </div>
  );
}

export default UserProfile;