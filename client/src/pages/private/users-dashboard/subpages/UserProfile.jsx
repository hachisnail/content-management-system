import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import api from "../../../../api";
import { useRealtimeResource } from "../../../../hooks/useRealtimeResource";
import { useAuth } from "../../../../context/AuthContext";
import { useConfig } from "../../../../context/ConfigContext";
import { decodeId } from "../../../../utils/idEncoder";
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
} from "lucide-react";

function UserProfile() {
  const { id: encodedId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { ROLES, hasPermission, PERMISSIONS } = useConfig();

  const userId = decodeId(encodedId);
  const { setBreadcrumbLabel } = useOutletContext() || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [showConfirm, setShowConfirm] = useState(false);

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

  // --- REFINED PERMISSION LOGIC ---
  const isSelf = parseInt(currentUser?.id) === parseInt(userId);
  const isSuperAdmin = currentUser?.role?.includes("super_admin");

  // 1. Basic Edit (Name, Phone): Self OR Manage Users Permission
  const canEditBasic =
    isSelf || hasPermission(currentUser, PERMISSIONS.MANAGE_USERS);

  // 2. Roles Edit: Super Admin OR Specific Permission
  const canEditRoles = hasPermission(
    currentUser,
    PERMISSIONS.MANAGE_USER_ROLES
  );

  // 3. Identity Edit (Email/Username): Generally restricted to Super Admin or high-level managers
  const canEditIdentity = isSuperAdmin;

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

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleRoleToggle = (roleValue) => {
    if (!canEditRoles) return;
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

  const handleConfirmUpdate = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await api.updateUser(userId, formData);
      setMessage({ type: "success", text: "Profile updated successfully." });
      setInitialData({ ...formData });
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
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/users")}
          className="pl-0 hover:bg-transparent hover:text-indigo-600"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Directory
        </Button>
      </div>

      {message.text && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: null, text: "" })}
        />
      )}

      {!canEditBasic && (
        <Alert
          type="warning"
          icon={ShieldAlert}
          title="Restricted Access"
          message="You are viewing this profile in Read-Only mode."
          className="bg-amber-50 border-amber-200 text-amber-800"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INFO CARD */}
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

        {/* DETAILS SECTION */}
        <div className="lg:col-span-8 space-y-8">
          <ComponentErrorBoundary title="Edit Form Failed">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <span>User Information</span>
                  {!canEditBasic && (
                    <Badge variant="warning">
                      <Lock size={10} className="mr-1" /> Read Only
                    </Badge>
                  )}
                </div>
              }
            >
              <form onSubmit={handleSaveClick} className="space-y-6">
                {/* SYSTEM ROLES SECTION */}
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 mb-3">
                    <Shield size={14} /> System Roles{" "}
                    {canEditRoles ? "" : "(Locked)"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(ROLES).map((role) => {
                      const isSelected = formData.role.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleToggle(role)}
                          disabled={!canEditRoles}
                          className={`
                            px-3 py-1.5 rounded text-xs font-medium border transition-all
                            ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50"
                            }
                            ${
                              !canEditRoles
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer active:scale-95"
                            }
                          `}
                        >
                          {role.replace(/_/g, " ").toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                  {!canEditRoles && (
                    <p className="text-[10px] text-zinc-400 mt-2">
                      Roles can only be managed by administrators.
                    </p>
                  )}
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

                {!canEditIdentity && (
                  <p className="text-[10px] text-zinc-400 mt-[-10px] ml-1">
                    Identity fields are locked.
                  </p>
                )}

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

                {canEditBasic && (
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
                )}
              </form>
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

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Updates"
        message={`Are you sure you want to update the profile information for ${user.firstName}?`}
        confirmLabel="Save Changes"
      />
    </div>
  );
}

export default UserProfile;
