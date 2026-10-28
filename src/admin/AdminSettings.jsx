import { useEffect, useState } from "react";
import {
  Settings,
  ShieldCheck,
  Users,
  Plus,
  Lock,
  Trash2,
  UserCheck,
  UserX,
  KeyRound,
  X,
  AlertTriangle,
  Activity,
  Pencil,
  Eye,
  Unlock,
  ShieldAlert,
  RefreshCw,
  Smartphone,
  Globe,
  Copy,
  Check,
  PlusCircle,
} from "lucide-react";
import "./AdminSettings.css";
import { BACKEND_URL } from "../config/api";

const API = BACKEND_URL;

function getToken() {
  return localStorage.getItem("rudraksh_admin_token");
}

function getAdminFromToken() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    const decoded = JSON.parse(
      atob(
        payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return decoded;
  } catch (error) {
    console.error(
      "TOKEN READ ERROR:",
      error
    );

    return null;
  }
}

function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);

  const [accessSettings, setAccessSettings] = useState({
    mobile_access_enabled: false,
    ip_restriction_enabled: false,
    mobile_access_code: "",
    mobile_access_code_expires_at: null,
  });
  const [allowedIps, setAllowedIps] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [ipSaving, setIpSaving] = useState(false);
  const [newIpForm, setNewIpForm] = useState({
    ip_address: "",
    label: "",
  });
  const [codeExpiryMinutes, setCodeExpiryMinutes] = useState(30);
  const [copiedCode, setCopiedCode] = useState(false);
  const [accessUnlocked, setAccessUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessUnlockToken, setAccessUnlockToken] = useState("");
  const [showAccessLock, setShowAccessLock] = useState(false);
  const [accessUnlocking, setAccessUnlocking] = useState(false);
  const [accessAction, setAccessAction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] =
    useState(false);
  const [logsLoading, setLogsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [admin, setAdmin] = useState(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showWarning, setShowWarning] =
    useState(false);

  const [selectedAdmin, setSelectedAdmin] =
    useState(null);


  const [showAccountDetails, setShowAccountDetails] =
    useState(false);

  const [showEditAccount, setShowEditAccount] =
    useState(false);

  const [editAccountForm, setEditAccountForm] =
    useState({
      name: "",
      username: "",
      email: "",
      role: "admin",
    });

  const [message, setMessage] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "admin",
  });

  const [passwordForm, setPasswordForm] =
    useState("");

  useEffect(() => {
    const currentAdmin =
      getAdminFromToken();

    setAdmin(currentAdmin);

    loadSettings();

    if (
      currentAdmin?.role ===
      "super_admin"
    ) {
      loadAccounts();
      loadLogs();
    }
  }, []);

  const loadSettings = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/settings/admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load settings."
        );
      }

      setSettings(
        data.settings || []
      );
    } catch (err) {
      console.error(
        "SETTINGS ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    const token = getToken();

    setAccountsLoading(true);

    try {
      const response = await fetch(
        `${API}/api/admin/accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load admin accounts."
        );
      }

      setAccounts(
        data.admins || []
      );
    } catch (err) {
      console.error(
        "ACCOUNTS ERROR:",
        err
      );
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadLogs = async () => {
    const token = getToken();

    setLogsLoading(true);

    try {
      const response = await fetch(
        `${API}/api/admin/activity-logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load activity logs."
        );
      }

      setLogs(
        data.logs || []
      );
    } catch (err) {
      console.error(
        "LOGS ERROR:",
        err
      );
    } finally {
      setLogsLoading(false);
    }
  };

  const openAccessSecurity = () => {
    if (accessUnlocked) {
      return;
    }

    setAccessAction(null);
    setAccessPassword("");
    setShowAccessLock(true);
  };

  const unlockAccessSecurity = async () => {
    if (!accessPassword) {
      alert("Access password is required.");
      return false;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return false;
    }

    setAccessUnlocking(true);

    try {
      const response = await fetch(
        `${API}/api/admin/security/access-settings/unlock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: accessPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid access password."
        );
      }

      setAccessUnlockToken(data.access_token || "");
      setAccessUnlocked(true);
      setShowAccessLock(false);
      setAccessPassword("");
      setAccessAction(null);
      await loadAccessSecurity(data.access_token || "");
      setMessage("Admin access security unlocked.");
      return true;
    } catch (err) {
      alert(err.message || "Invalid access password.");
      return false;
    } finally {
      setAccessUnlocking(false);
    }
  };

  const requestAccessPassword = (action) => {
    setAccessAction(action);
    setAccessPassword("");
    setShowAccessLock(true);
  };

  const confirmAccessAction = async () => {
    const unlocked = await unlockAccessSecurity();

    if (!unlocked) {
      return;
    }

    const action = accessAction;
    setAccessAction(null);

    if (typeof action === "function") {
      await action();
    }
  };

  const loadAccessSecurity = async (accessToken = accessUnlockToken) => {
    const token = getToken();
    if (!token) return;
    setAccessLoading(true);
    try {
      const response = await fetch(`${API}/api/admin/security/access-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Access-Settings-Token": accessToken,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load access security settings.");
      const s = data.settings || data.access_settings || data.accessSettings || {};
      setAccessSettings({ mobile_access_enabled: Boolean(s.mobile_access_enabled), ip_restriction_enabled: Boolean(s.ip_restriction_enabled), mobile_access_code: s.mobile_access_code || "", mobile_access_code_expires_at: s.mobile_access_code_expires_at || null });
      setAllowedIps(data.allowed_ips || data.allowedIps || []);
    } catch (err) { console.error("ACCESS SECURITY ERROR:", err); alert(err.message || "Unable to load access security settings."); }
    finally { setAccessLoading(false); }
  };

  const updateAccessSettings = async (changes, skipAccessPassword = false) => {
    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        updateAccessSettings(changes, true)
      );
      return;
    }

    const token = getToken();
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    setAccessSaving(true);

    try {
      const response = await fetch(
        `${API}/api/admin/security/access-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
          body: JSON.stringify(changes),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update access security settings."
        );
      }

      const s =
        data.settings ||
        data.access_settings ||
        data.accessSettings ||
        {};

      setAccessSettings({
        mobile_access_enabled: Boolean(
          s.mobile_access_enabled
        ),
        ip_restriction_enabled: Boolean(
          s.ip_restriction_enabled
        ),
        mobile_access_code:
          s.mobile_access_code || "",
        mobile_access_code_expires_at:
          s.mobile_access_code_expires_at || null,
      });

      if (Array.isArray(data.allowed_ips)) {
        setAllowedIps(data.allowed_ips);
      } else if (Array.isArray(data.allowedIps)) {
        setAllowedIps(data.allowedIps);
      }

      setMessage(
        data.message ||
          "Access security settings updated successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to update access security settings."
      );
    } finally {
      setAccessSaving(false);
    }
  };

  const generateMobileAccessCode = async (
    skipAccessPassword = false
  ) => {
    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        generateMobileAccessCode(true)
      );
      return;
    }

    const token = getToken();
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    setAccessSaving(true);
    setCopiedCode(false);

    try {
      const response = await fetch(
        `${API}/api/admin/security/access-settings/generate-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
          body: JSON.stringify({
            expires_in_minutes:
              Number(codeExpiryMinutes) || 30,
            expires_minutes:
              Number(codeExpiryMinutes) || 30,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to generate mobile access code."
        );
      }

      const s =
        data.settings ||
        data.access_settings ||
        data.accessSettings ||
        {};

      setAccessSettings((previous) => ({
        ...previous,
        mobile_access_code:
          s.mobile_access_code ||
          data.code ||
          "",
        mobile_access_code_expires_at:
          s.mobile_access_code_expires_at ||
          data.expires_at ||
          null,
      }));

      setMessage(
        data.message ||
          "Mobile access code generated successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to generate mobile access code."
      );
    } finally {
      setAccessSaving(false);
    }
  };

  const clearMobileAccessCode = async (
    skipAccessPassword = false
  ) => {
    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        clearMobileAccessCode(true)
      );
      return;
    }

    const token = getToken();
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (
      !window.confirm(
        "Clear the current mobile access code?"
      )
    ) {
      return;
    }

    setAccessSaving(true);

    try {
      const response = await fetch(
        `${API}/api/admin/security/access-settings/clear-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to clear the mobile access code."
        );
      }

      setAccessSettings((previous) => ({
        ...previous,
        mobile_access_code: "",
        mobile_access_code_expires_at: null,
      }));

      setMessage(
        data.message ||
          "Mobile access code cleared."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to clear mobile access code."
      );
    } finally {
      setAccessSaving(false);
    }
  };

  const copyMobileAccessCode = async () => {
    if (!accessSettings.mobile_access_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        accessSettings.mobile_access_code
      );
      setCopiedCode(true);

      window.setTimeout(() => {
        setCopiedCode(false);
      }, 1800);
    } catch (err) {
      alert("Unable to copy the access code.");
    }
  };

  const addAllowedIp = async (
    event,
    skipAccessPassword = false
  ) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        addAllowedIp(null, true)
      );
      return;
    }

    const token = getToken();
    const ipAddress = newIpForm.ip_address.trim();
    const label = newIpForm.label.trim();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!ipAddress) {
      alert("IP address is required.");
      return;
    }

    setIpSaving(true);

    try {
      const response = await fetch(
        `${API}/api/admin/security/allowed-ips`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
          body: JSON.stringify({
            ip_address: ipAddress,
            label: label || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to add allowed IP address."
        );
      }

      setAllowedIps(
        data.allowed_ips ||
          data.allowedIps ||
          []
      );

      setNewIpForm({
        ip_address: "",
        label: "",
      });

      setMessage(
        data.message ||
          "Allowed IP address added successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to add allowed IP address."
      );
    } finally {
      setIpSaving(false);
    }
  };

  const toggleAllowedIp = async (
    ip,
    skipAccessPassword = false
  ) => {
    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        toggleAllowedIp(ip, true)
      );
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/security/allowed-ips/${ip.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
          body: JSON.stringify({
            is_active: !Boolean(ip.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update allowed IP."
        );
      }

      setAllowedIps(
        data.allowed_ips ||
          data.allowedIps ||
          []
      );

      setMessage(
        data.message ||
          "Allowed IP updated successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to update allowed IP."
      );
    }
  };

  const deleteAllowedIp = async (
    ip,
    skipAccessPassword = false
  ) => {
    if (!skipAccessPassword) {
      requestAccessPassword(() =>
        deleteAllowedIp(ip, true)
      );
      return;
    }

    if (
      !window.confirm(
        `Remove allowed IP "${ip.ip_address}"?`
      )
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/security/allowed-ips/${ip.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Access-Settings-Token": accessUnlockToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to remove allowed IP."
        );
      }

      setAllowedIps(
        data.allowed_ips ||
          data.allowedIps ||
          []
      );

      setMessage(
        data.message ||
          "Allowed IP removed successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Unable to remove allowed IP."
      );
    }
  };

  const formatExpiry = (date) => {
    if (!date) return "No active code";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown expiry";
    return parsed.toLocaleString("en-IN");
  };

  const handleCreateAdmin =
    async (event) => {
      event.preventDefault();

      const token = getToken();

      try {
        const response = await fetch(
          `${API}/api/admin/accounts`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
              createForm
            ),
          }
        );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to create admin."
          );
        }

        setMessage(
          "Admin account created successfully."
        );

        setShowCreate(false);

        setCreateForm({
          name: "",
          username: "",
          email: "",
          password: "",
          role: "admin",
        });

        await loadAccounts();
        await loadLogs();
      } catch (err) {
        alert(
          err.message ||
            "Unable to create admin."
        );
      }
    };

  const handleLockedCreate =
    async () => {
      setShowWarning(true);

      const token = getToken();

      if (!token) {
        return;
      }

      try {
        await fetch(
          `${API}/api/admin/accounts`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }
        );

        if (
          admin?.role === "super_admin"
        ) {
          await loadLogs();
        }
      } catch (error) {
        console.error(
          "SECURITY LOG ERROR:",
          error
        );
      }
    };

  const toggleAccount =
    async (account) => {
      if (
        account.id === admin?.id
      ) {
        alert(
          "You cannot block your own Super Administrator account."
        );
        return;
      }

      const token = getToken();

      const nextBlocked =
        Boolean(account.is_active);

      const actionText =
        nextBlocked
          ? "block"
          : "unblock";

      if (
        !window.confirm(
          `Are you sure you want to ${actionText} "${account.username}"?`
        )
      ) {
        return;
      }

      try {
        const response = await fetch(
          `${API}/api/admin/security/accounts/${account.id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              blocked:
                nextBlocked,
            }),
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to update account status."
          );
        }

        setMessage(
          nextBlocked
            ? "Admin account blocked successfully."
            : "Admin account unblocked successfully."
        );

        await loadAccounts();
        await loadLogs();
      } catch (err) {
        alert(
          err.message ||
            "Unable to update account status."
        );
      }
    };

  const deleteAccount =
    async (account) => {
      if (
        !window.confirm(
          `Delete admin account "${account.username}"?`
        )
      ) {
        return;
      }

      if (
        account.id === admin?.id
      ) {
        alert(
          "You cannot delete your own account."
        );
        return;
      }

      const token = getToken();

      try {
        const response = await fetch(
          `${API}/api/admin/accounts/${account.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to delete account."
          );
        }

        await loadAccounts();
        await loadLogs();
      } catch (err) {
        alert(
          err.message ||
            "Unable to delete account."
        );
      }
    };

  const resetPassword =
    async () => {
      if (
        !selectedAdmin ||
        !passwordForm.trim()
      ) {
        return;
      }

      if (
        passwordForm.length < 8
      ) {
        alert(
          "Password must contain at least 8 characters."
        );
        return;
      }

      const token = getToken();

      try {
        const response = await fetch(
          `${API}/api/admin/accounts/${selectedAdmin.id}/password`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              password:
                passwordForm,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to reset password."
          );
        }

        setMessage(
          "Admin password reset successfully."
        );

        setShowPassword(false);
        setSelectedAdmin(null);
        setPasswordForm("");

        await loadLogs();
      } catch (err) {
        alert(
          err.message ||
            "Unable to reset password."
        );
      }
    };


  const openAccountDetails = (account) => {
    setSelectedAdmin(account);
    setShowAccountDetails(true);
  };

  const openEditAccount = (account) => {
    if (account.id === admin?.id) {
      alert("The Super Administrator account cannot be modified from this panel.");
      return;
    }

    setSelectedAdmin(account);

    setEditAccountForm({
      name: account.name || "",
      username: account.username || "",
      email: account.email || "",
      role: account.role || "admin",
    });

    setShowEditAccount(true);
  };

  const saveAccountChanges = async () => {
    if (!selectedAdmin) {
      return;
    }

    if (selectedAdmin.id === admin?.id) {
      alert("The Super Administrator account is protected.");
      return;
    }

    if (!editAccountForm.name.trim()) {
      alert("Admin name is required.");
      return;
    }

    if (!editAccountForm.username.trim()) {
      alert("Username is required.");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `${API}/api/admin/security/accounts/${selectedAdmin.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editAccountForm.name.trim(),
            username: editAccountForm.username.trim(),
            email: editAccountForm.email.trim() || null,
            role: editAccountForm.role,
            is_active: Boolean(selectedAdmin.is_active),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to modify admin account."
        );
      }

      setMessage("Admin account updated successfully.");
      setShowEditAccount(false);
      setSelectedAdmin(null);

      await loadAccounts();
      await loadLogs();
    } catch (err) {
      alert(
        err.message ||
          "Unable to modify admin account."
      );
    }
  };

  const unlockSecurityAccount = async (account) => {
    if (!account || account.id === admin?.id) {
      return;
    }

    if (!window.confirm(
      `Unlock "${account.username}" and reset its security attempts to 3?`
    )) {
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `${API}/api/admin/security/accounts/${account.id}/unlock`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to unlock this account."
        );
      }

      setMessage(
        `Security lock removed from ${account.username}.`
      );

      await loadAccounts();
      await loadLogs();
    } catch (err) {
      alert(
        err.message ||
          "Unable to unlock this account."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleString("en-IN");
  };

  const isSuperAdmin =
    admin?.role ===
    "super_admin";

  return (
    <div className="admin-settings">

      {/* Header */}

      <div className="admin-settings-header">
        <div className="admin-settings-header-icon">
          <Settings size={26} />
        </div>

        <div>
          <h1>Settings</h1>

          <p>
            Manage Rudraksh website
            settings and administration.
          </p>
        </div>
      </div>


      {/* Security Notice */}

      <div className="admin-settings-protection">
        <ShieldCheck size={22} />

        <div>
          <strong>
            Protected Administration Area
          </strong>

          <p>
            Administrative settings and
            account controls are restricted
            to authenticated administrators.
          </p>
        </div>
      </div>


      {/* Success message */}

      {message && (
        <div className="admin-settings-message">
          {message}

          <button
            onClick={() =>
              setMessage("")
            }
          >
            ×
          </button>
        </div>
      )}


      {/* Website Settings */}

      <section className="admin-settings-section">

        <div className="admin-settings-section-title">
          <Settings size={19} />

          <div>
            <h2>
              Website Settings
            </h2>

            <p>
              Current settings stored in
              the database.
            </p>
          </div>
        </div>

        {loading && (
          <div className="admin-settings-loading">
            Loading settings...
          </div>
        )}

        {error && (
          <div className="admin-settings-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          settings.length === 0 && (
            <div className="admin-settings-empty">
              No settings found.
            </div>
          )}

        {!loading &&
          !error &&
          settings.length > 0 && (
            <div className="admin-settings-list">

              {settings.map(
                (setting) => (
                  <div
                    className="admin-setting-item"
                    key={setting.id}
                  >
                    <div>
                      <strong>
                        {
                          setting.setting_key
                        }
                      </strong>

                      <p>
                        {
                          setting.setting_value ||
                          "—"
                        }
                      </p>

                      <small>
                        Type:{" "}
                        {
                          setting.setting_type
                        }
                      </small>
                    </div>
                  </div>
                )
              )}

            </div>
          )}

      </section>


      {/* Admin Access Security */}

      {isSuperAdmin && (
        <section className="admin-settings-section">
          <div className="admin-settings-section-title">
            <ShieldAlert size={19} />
            <div>
              <h2>Admin Access Security</h2>
              <p>Control mobile access, temporary mobile codes and IP-based administrator restrictions.</p>
            </div>
            <button type="button" className="admin-settings-secondary-button" onClick={loadAccessSecurity} disabled={accessLoading || accessSaving}>
              <RefreshCw size={15} className={accessLoading ? "admin-settings-spin" : ""} /> Refresh
            </button>
          </div>

          {accessLoading ? (
            <div className="admin-settings-loading">Loading access security settings...</div>
          ) : (
            <div className="admin-access-security-grid">
              <div className="admin-access-card">
                <div className="admin-access-card-header">
                  <div className="admin-access-card-icon"><Smartphone size={20} /></div>
                  <div><h3>Mobile Access</h3><p>Allow administrators to use the admin panel from mobile devices.</p></div>
                </div>
                <div className="admin-access-toggle-row">
                  <div><strong>Mobile access</strong><span>{accessSettings.mobile_access_enabled ? "Enabled" : "Disabled"}</span></div>
                  <button type="button" className={`admin-access-switch ${accessSettings.mobile_access_enabled ? "active" : ""}`} onClick={() => updateAccessSettings({ mobile_access_enabled: !accessSettings.mobile_access_enabled })} disabled={accessSaving} aria-label="Toggle mobile access"><span /></button>
                </div>
                <div className="admin-access-divider" />
                <label className="admin-access-field"><span>Code expiry</span><select value={codeExpiryMinutes} onChange={(event) => setCodeExpiryMinutes(Number(event.target.value))} disabled={accessSaving}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={360}>6 hours</option><option value={720}>12 hours</option><option value={1440}>24 hours</option></select></label>
                <div className="admin-access-code-box">
                  <div><span>Current mobile access code</span><strong>{accessSettings.mobile_access_code || "No active code"}</strong>{accessSettings.mobile_access_code && <small>Expires: {formatExpiry(accessSettings.mobile_access_code_expires_at)}</small>}</div>
                  <div className="admin-access-code-actions">
                    {accessSettings.mobile_access_code && <button type="button" onClick={copyMobileAccessCode} disabled={accessSaving}>{copiedCode ? <Check size={15} /> : <Copy size={15} />}{copiedCode ? "Copied" : "Copy"}</button>}
                    <button type="button" className="admin-access-generate-button" onClick={generateMobileAccessCode} disabled={accessSaving}><KeyRound size={15} />Generate Code</button>
                    {accessSettings.mobile_access_code && <button type="button" className="admin-access-danger-button" onClick={clearMobileAccessCode} disabled={accessSaving}>Clear</button>}
                  </div>
                </div>
              </div>

              <div className="admin-access-card">
                <div className="admin-access-card-header">
                  <div className="admin-access-card-icon"><Globe size={20} /></div>
                  <div><h3>IP Restriction</h3><p>Limit administrator access to approved public IP addresses.</p></div>
                </div>
                <div className="admin-access-toggle-row">
                  <div><strong>IP restriction</strong><span>{accessSettings.ip_restriction_enabled ? "Enabled" : "Disabled"}</span></div>
                  <button type="button" className={`admin-access-switch ${accessSettings.ip_restriction_enabled ? "active" : ""}`} onClick={() => updateAccessSettings({ ip_restriction_enabled: !accessSettings.ip_restriction_enabled })} disabled={accessSaving} aria-label="Toggle IP restriction"><span /></button>
                </div>
                <div className="admin-access-divider" />
                <form className="admin-allowed-ip-form" onSubmit={addAllowedIp}>
                  <div className="admin-access-field"><span>IP address</span><input type="text" value={newIpForm.ip_address} onChange={(event) => setNewIpForm(previous => ({ ...previous, ip_address: event.target.value }))} placeholder="e.g. 103.25.120.10" autoComplete="off" /></div>
                  <div className="admin-access-field"><span>Label</span><input type="text" value={newIpForm.label} onChange={(event) => setNewIpForm(previous => ({ ...previous, label: event.target.value }))} placeholder="Office / Laptop / Home" autoComplete="off" /></div>
                  <button type="submit" className="admin-access-generate-button" disabled={ipSaving}><PlusCircle size={15} />{ipSaving ? "Adding..." : "Add IP"}</button>
                </form>
                <div className="admin-allowed-ip-list">
                  <div className="admin-allowed-ip-list-title"><strong>Allowed IP addresses</strong><span>{allowedIps.length}</span></div>
                  {allowedIps.length === 0 ? <div className="admin-access-empty">No allowed IP addresses added yet.</div> : allowedIps.map(ip => (
                    <div className="admin-allowed-ip-item" key={ip.id}>
                      <div><strong>{ip.ip_address}</strong><span>{ip.label || "No label"}</span></div>
                      <div className="admin-allowed-ip-actions"><button type="button" onClick={() => toggleAllowedIp(ip)} title={ip.is_active ? "Disable IP" : "Enable IP"}>{ip.is_active ? "Active" : "Inactive"}</button><button type="button" className="admin-account-delete" onClick={() => deleteAllowedIp(ip)} title="Remove IP"><Trash2 size={15} /></button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Admin Accounts */}

      <section className="admin-settings-section">

        <div className="admin-settings-section-title">

          <Users size={19} />

          <div>
            <h2>
              Admin Accounts
            </h2>

            <p>
              Manage administrator access,
              security locks and account controls.
            </p>
          </div>

          {isSuperAdmin ? (
            <button
              className="admin-settings-primary-button"
              onClick={() =>
                setShowCreate(true)
              }
            >
              <Plus size={17} />
              Create Admin
            </button>
          ) : (
            <button
              className="admin-settings-locked-button"
              onClick={
                handleLockedCreate
              }
            >
              <Lock size={16} />
              Create Admin
            </button>
          )}

        </div>


        {!isSuperAdmin && (
          <div className="admin-settings-warning">

            <Lock size={19} />

            <div>
              <strong>
                Administrator controls are restricted.
              </strong>

              <p>
                Only the Super Administrator can
                create, modify, block, unlock or
                delete administrator accounts.
              </p>
            </div>

          </div>
        )}


        {isSuperAdmin && (
          <div className="admin-account-security-banner">

            <div className="admin-account-security-banner-icon">
              <ShieldAlert size={20} />
            </div>

            <div>
              <strong>
                Account Security Monitor
              </strong>

              <p>
                Security attempts are stored in the
                database. Locked accounts can only be
                restored by the Super Administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                loadAccounts();
                loadLogs();
              }}
              title="Refresh accounts and security logs"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

          </div>
        )}


        {isSuperAdmin &&
          accountsLoading && (
            <div className="admin-settings-loading">
              Loading admin accounts...
            </div>
          )}


        {isSuperAdmin &&
          !accountsLoading &&
          accounts.length === 0 && (
            <div className="admin-settings-empty">
              No admin accounts found.
            </div>
          )}


        {isSuperAdmin &&
          !accountsLoading &&
          accounts.length > 0 && (

            <div className="admin-accounts-table-wrapper">

              <table className="admin-accounts-table">

                <thead>
                  <tr>
                    <th>ADMIN</th>
                    <th>USERNAME</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>SECURITY</th>
                    <th>LAST LOGIN</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>

                  {accounts.map(
                    (account) => {

                      const isCurrentAdmin =
                        account.id === admin?.id;

                      const isLocked =
                        Boolean(
                          account.locked_at
                        ) ||
                        Number(
                          account.security_attempts_remaining
                        ) <= 0;

                      return (
                        <tr
                          key={account.id}
                          className={
                            isLocked
                              ? "admin-account-row-locked"
                              : ""
                          }
                        >

                          <td>

                            <div className="admin-account-identity">

                              <div className="admin-account-avatar">
                                {(account.name || "A")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <strong>
                                  {account.name}
                                </strong>

                                <span>
                                  ID #{account.id}
                                </span>

                              </div>

                            </div>

                          </td>

                          <td>
                            <strong>
                              {account.username}
                            </strong>

                            {isCurrentAdmin && (
                              <span className="admin-you-badge">
                                YOU
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`admin-role admin-role-${account.role}`}
                            >
                              {account.role === "super_admin"
                                ? "SUPER ADMIN"
                                : account.role}
                            </span>
                          </td>

                          <td>

                            {isLocked ? (
                              <span className="admin-status-locked">
                                <Lock size={12} />
                                Security Locked
                              </span>
                            ) : (
                              <span
                                className={
                                  account.is_active
                                    ? "admin-status-active"
                                    : "admin-status-inactive"
                                }
                              >
                                {account.is_active
                                  ? "Active"
                                  : "Blocked"}
                              </span>
                            )}

                          </td>

                          <td>

                            <div className="admin-security-status">

                              <span
                                className={
                                  isLocked
                                    ? "admin-security-count danger"
                                    : Number(
                                        account.security_attempts_remaining
                                      ) === 1
                                    ? "admin-security-count warning"
                                    : "admin-security-count"
                                }
                              >
                                {isLocked
                                  ? "0 / 3"
                                  : `${Number(
                                      account.security_attempts_remaining ?? 3
                                    )} / 3`}
                              </span>

                              <small>
                                {isLocked
                                  ? "Locked"
                                  : "Attempts left"}
                              </small>

                            </div>

                          </td>

                          <td>
                            {formatDate(
                              account.last_login
                            )}
                          </td>

                          <td>

                            <div className="admin-account-actions">

                              <button
                                title="View account and security details"
                                onClick={() =>
                                  openAccountDetails(
                                    account
                                  )
                                }
                              >
                                <Eye size={16} />
                              </button>

                              {!isCurrentAdmin && (
                                <button
                                  title="Modify account"
                                  onClick={() =>
                                    openEditAccount(
                                      account
                                    )
                                  }
                                >
                                  <Pencil size={16} />
                                </button>
                              )}

                              {!isCurrentAdmin && (
                                <button
                                  title={
                                    account.is_active
                                      ? "Block account"
                                      : "Unblock account"
                                  }
                                  onClick={() =>
                                    toggleAccount(
                                      account
                                    )
                                  }
                                >
                                  {account.is_active ? (
                                    <UserX size={16} />
                                  ) : (
                                    <UserCheck size={16} />
                                  )}
                                </button>
                              )}

                              {!isCurrentAdmin && (
                                <button
                                  title="Change password"
                                  onClick={() => {
                                    setSelectedAdmin(
                                      account
                                    );

                                    setPasswordForm(
                                      ""
                                    );

                                    setShowPassword(
                                      true
                                    );
                                  }}
                                >
                                  <KeyRound
                                    size={16}
                                  />
                                </button>
                              )}

                              {!isCurrentAdmin &&
                                isLocked && (
                                  <button
                                    className="admin-account-unlock"
                                    title="Unlock security lock"
                                    onClick={() =>
                                      unlockSecurityAccount(
                                        account
                                      )
                                    }
                                  >
                                    <Unlock size={16} />
                                  </button>
                                )}

                              {!isCurrentAdmin && (
                                <button
                                  className="admin-account-delete"
                                  title="Delete account"
                                  onClick={() =>
                                    deleteAccount(
                                      account
                                    )
                                  }
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

      </section>


      {/* Admin Access Security Lock */}

      {showAccessLock && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-access-lock-modal">
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-kicker">
                  RESTRICTED SECURITY AREA
                </span>
                <h2>Enter Access Password</h2>
                <p>
                  This password is required to access or modify
                  the admin access security controls.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAccessLock(false);
                  setAccessPassword("");
                  setAccessAction(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-access-lock-warning">
              <ShieldAlert size={18} />
              <span>
                Never store this password in localStorage or in
                frontend source code.
              </span>
            </div>

            <label>
              Access Password
              <input
                type="password"
                value={accessPassword}
                onChange={(event) =>
                  setAccessPassword(event.target.value)
                }
                placeholder="Enter security password"
                autoComplete="current-password"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    confirmAccessAction();
                  }
                }}
              />
            </label>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => {
                  setShowAccessLock(false);
                  setAccessPassword("");
                  setAccessAction(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-submit"
                onClick={confirmAccessAction}
                disabled={accessUnlocking}
              >
                <Unlock size={16} />
                {accessUnlocking
                  ? "Verifying..."
                  : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}

      {showAccountDetails &&
        selectedAdmin && (
          <div className="admin-modal-overlay">

            <div className="admin-modal admin-account-details-modal">

              <div className="admin-modal-header">

                <div>
                  <span className="admin-modal-kicker">
                    ACCOUNT SECURITY
                  </span>

                  <h2>
                    {selectedAdmin.name}
                  </h2>

                  <p>
                    @{selectedAdmin.username}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAccountDetails(false);
                    setSelectedAdmin(null);
                  }}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="admin-account-details-grid">

                <div>
                  <span>Name</span>
                  <strong>
                    {selectedAdmin.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>Username</span>
                  <strong>
                    {selectedAdmin.username || "—"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedAdmin.email || "—"}
                  </strong>
                </div>

                <div>
                  <span>Role</span>
                  <strong>
                    {selectedAdmin.role || "—"}
                  </strong>
                </div>

                <div>
                  <span>Account Status</span>
                  <strong>
                    {selectedAdmin.is_active
                      ? "Active"
                      : "Blocked"}
                  </strong>
                </div>

                <div>
                  <span>Security Attempts</span>
                  <strong>
                    {Number(
                      selectedAdmin.security_attempts_remaining ?? 3
                    )} / 3
                  </strong>
                </div>

                <div>
                  <span>Last Login</span>
                  <strong>
                    {formatDate(
                      selectedAdmin.last_login
                    )}
                  </strong>
                </div>

                <div>
                  <span>Account Created</span>
                  <strong>
                    {formatDate(
                      selectedAdmin.created_at
                    )}
                  </strong>
                </div>

              </div>

              {(selectedAdmin.locked_at || Number(selectedAdmin.security_attempts_remaining) <= 0) ? (
                <div className="admin-lock-details">

                  <div className="admin-lock-details-title">
                    <Lock size={17} />
                    <strong>
                      Security Lock Details
                    </strong>
                  </div>

                  <div className="admin-lock-detail-row">
                    <span>Locked at</span>
                    <strong>
                      {formatDate(
                        selectedAdmin.locked_at
                      )}
                    </strong>
                  </div>

                  <div className="admin-lock-detail-row">
                    <span>Recorded IP</span>
                    <strong>
                      {selectedAdmin.locked_ip ||
                        "Unavailable"}
                    </strong>
                  </div>

                  <div className="admin-lock-detail-row">
                    <span>Reason</span>
                    <strong>
                      {selectedAdmin.lock_reason ||
                        "Security violation"}
                    </strong>
                  </div>

                </div>
              ) : (
                <div className="admin-account-safe-box">
                  <UserCheck size={17} />
                  <span>
                    No active security lock is recorded
                    for this account.
                  </span>
                </div>
              )}

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={() => {
                    setShowAccountDetails(false);
                    setSelectedAdmin(null);
                  }}
                >
                  Close
                </button>

                {!(
                  selectedAdmin.id === admin?.id
                ) &&
                  (selectedAdmin.locked_at || Number(selectedAdmin.security_attempts_remaining) <= 0) && (
                    <button
                      type="button"
                      className="admin-modal-submit"
                      onClick={() => {
                        setShowAccountDetails(false);
                        unlockSecurityAccount(
                          selectedAdmin
                        );
                      }}
                    >
                      <Unlock size={17} />
                      Unlock Account
                    </button>
                  )}

              </div>

            </div>

          </div>
        )}

      {/* Security Activity Logs */}

      {isSuperAdmin && (
        <section className="admin-settings-section">

          <div className="admin-settings-section-title">

            <Activity size={19} />

            <div>
              <h2>
                Security Activity Logs
              </h2>

              <p>
                Administrative actions and
                security-related activity.
              </p>
            </div>

          </div>


          {logsLoading && (
            <div className="admin-settings-loading">
              Loading activity logs...
            </div>
          )}


          {!logsLoading &&
            logs.length === 0 && (
              <div className="admin-settings-empty">
                No activity logs found.
              </div>
            )}


          {!logsLoading &&
            logs.length > 0 && (

              <div className="admin-logs">

                {logs.map(
                  (log) => (
                    <div
                      className="admin-log-item"
                      key={log.id}
                    >

                      <div className="admin-log-main">

                        <strong>
                          {log.action}
                        </strong>

                        <p>
                          {
                            log.description ||
                            "No description."
                          }
                        </p>

                      </div>

                      <div className="admin-log-meta">

                        <span>
                          Admin:{" "}
                          {
                            log.admin_username ||
                            log.admin_name ||
                            "Unknown"
                          }
                        </span>

                        <span>
                          IP:{" "}
                          {
                            log.ip_address ||
                            "Unknown"
                          }
                        </span>

                        <span>
                          {
                            formatDate(
                              log.created_at
                            )
                          }
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>

            )}

        </section>
      )}


      {/* Create Admin Modal */}

      {showCreate && (
        <div className="admin-modal-overlay">

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>
                <h2>
                  Create Admin Account
                </h2>

                <p>
                  Generate a new administrator
                  account.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCreate(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                handleCreateAdmin
              }
            >

              <label>
                Name

                <input
                  type="text"
                  value={
                    createForm.name
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      name: e.target
                        .value,
                    })
                  }
                  required
                />
              </label>


              <label>
                Username

                <input
                  type="text"
                  value={
                    createForm.username
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      username:
                        e.target.value,
                    })
                  }
                  required
                />
              </label>


              <label>
                Email

                <input
                  type="email"
                  value={
                    createForm.email
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      email:
                        e.target.value,
                    })
                  }
                />
              </label>


              <label>
                Temporary Password

                <input
                  type="password"
                  value={
                    createForm.password
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      password:
                        e.target.value,
                    })
                  }
                  minLength={8}
                  required
                />
              </label>


              <label>
                Account Role

                <select
                  value={
                    createForm.role
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role:
                        e.target.value,
                    })
                  }
                >
                  <option value="admin">
                    Admin
                  </option>

                  <option value="editor">
                    Editor
                  </option>
                </select>
              </label>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-modal-submit"
                >
                  <Plus size={17} />
                  Create Account
                </button>

              </div>

            </form>

          </div>

        </div>
      )}



      {/* Modify Account Modal */}

      {showEditAccount &&
        selectedAdmin && (
          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-header">

                <div>
                  <span className="admin-modal-kicker">
                    ADMINISTRATION
                  </span>

                  <h2>
                    Modify Account
                  </h2>

                  <p>
                    Update administrator identity
                    and access role.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowEditAccount(false);
                    setSelectedAdmin(null);
                  }}
                >
                  <X size={20} />
                </button>

              </div>

              <label>
                Name

                <input
                  type="text"
                  value={
                    editAccountForm.name
                  }
                  onChange={(e) =>
                    setEditAccountForm(
                      (previous) => ({
                        ...previous,
                        name: e.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Username

                <input
                  type="text"
                  value={
                    editAccountForm.username
                  }
                  onChange={(e) =>
                    setEditAccountForm(
                      (previous) => ({
                        ...previous,
                        username:
                          e.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={
                    editAccountForm.email
                  }
                  onChange={(e) =>
                    setEditAccountForm(
                      (previous) => ({
                        ...previous,
                        email:
                          e.target.value,
                      })
                    )
                  }
                />
              </label>

              <label>
                Role

                <select
                  value={
                    editAccountForm.role
                  }
                  onChange={(e) =>
                    setEditAccountForm(
                      (previous) => ({
                        ...previous,
                        role: e.target.value,
                      })
                    )
                  }
                >
                  <option value="admin">
                    Admin
                  </option>

                  <option value="editor">
                    Editor
                  </option>
                </select>
              </label>

              <div className="admin-account-edit-warning">
                <ShieldCheck size={16} />

                <span>
                  The Super Administrator account
                  cannot be modified from this panel.
                </span>
              </div>

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={() => {
                    setShowEditAccount(false);
                    setSelectedAdmin(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-submit"
                  onClick={
                    saveAccountChanges
                  }
                >
                  <Pencil size={17} />
                  Save Changes
                </button>

              </div>

            </div>

          </div>
        )}

      {/* Password Modal */}

      {showPassword &&
        selectedAdmin && (
          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-header">

                <div>
                  <h2>
                    Reset Password
                  </h2>

                  <p>
                    {
                      selectedAdmin.username
                    }
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPassword(
                      false
                    );
                    setSelectedAdmin(
                      null
                    );
                  }}
                >
                  <X size={20} />
                </button>

              </div>


              <label>
                New Password

                <input
                  type="password"
                  value={
                    passwordForm
                  }
                  onChange={(e) =>
                    setPasswordForm(
                      e.target.value
                    )
                  }
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </label>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={() => {
                    setShowPassword(
                      false
                    );
                    setSelectedAdmin(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-modal-submit"
                  onClick={
                    resetPassword
                  }
                >
                  <KeyRound
                    size={17}
                  />
                  Reset Password
                </button>

              </div>

            </div>

          </div>
        )}


      {/* Locked Warning */}

      {showWarning && (
        <div className="admin-modal-overlay">

          <div className="admin-warning-modal">

            <div className="admin-warning-icon">
              <AlertTriangle
                size={30}
              />
            </div>

            <h2>
              Restricted Action
            </h2>

            <p>
              This action is strictly
              against administrative
              guidelines.
            </p>

            <p>
              Only the Super Administrator
              is authorized to create new
              administrator accounts.
            </p>

            <p className="admin-warning-small">
              This behavior has been
              recorded and reported to the
              Super Administrator.
            </p>

            <button
              onClick={() =>
                setShowWarning(false)
              }
            >
              I Understand
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminSettings;