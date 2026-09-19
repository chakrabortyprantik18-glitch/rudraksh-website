import { useEffect, useState } from "react";
import {
  Share2,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

import "./AdminSocialLinks.css";

const API_URL =
  "http://localhost:5000/api/social-links";

function AdminSocialLinks() {
  const [socialLinks, setSocialLinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    platform: "",
    url: "",
    icon: "",
    display_order: 0,
    is_active: 1,
  });

  /*
  ==================================================
  TOKEN
  ==================================================
  */

  const getToken = () => {
    return localStorage.getItem(
      "rudraksh_admin_token"
    );
  };

  /*
  ==================================================
  LOAD SOCIAL LINKS
  ==================================================
  */

  const loadSocialLinks = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "rudraksh_admin_token"
        );

        localStorage.removeItem(
          "rudraksh_admin"
        );

        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load social links."
        );
      }

      setSocialLinks(
        data.socialLinks || []
      );
    } catch (err) {
      console.error(
        "SOCIAL LINKS LOAD ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialLinks();
  }, []);

  /*
  ==================================================
  FORM
  ==================================================
  */

  const resetForm = () => {
    setForm({
      platform: "",
      url: "",
      icon: "",
      display_order: 0,
      is_active: 1,
    });

    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  const openEditModal = (socialLink) => {
    setEditingId(socialLink.id);

    setForm({
      platform:
        socialLink.platform || "",
      url: socialLink.url || "",
      icon: socialLink.icon || "",
      display_order:
        socialLink.display_order ?? 0,
      is_active:
        Number(socialLink.is_active) === 1
          ? 1
          : 0,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleActiveInForm = () => {
    setForm((previous) => ({
      ...previous,
      is_active:
        Number(previous.is_active) === 1
          ? 0
          : 1,
    }));
  };

  /*
  ==================================================
  SAVE
  ==================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!form.platform.trim()) {
      setError("Platform is required.");
      return;
    }

    if (!form.url.trim()) {
      setError("URL is required.");
      return;
    }

    if (form.platform.trim().length > 50) {
      setError(
        "Platform cannot exceed 50 characters."
      );
      return;
    }

    if (form.icon.trim().length > 100) {
      setError(
        "Icon cannot exceed 100 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        platform: form.platform.trim(),
        url: form.url.trim(),
        icon: form.icon.trim() || null,
        display_order:
          Number(form.display_order) || 0,
        is_active:
          Number(form.is_active) === 1
            ? 1
            : 0,
      };

      const response = await fetch(
        editingId
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "rudraksh_admin_token"
        );

        localStorage.removeItem(
          "rudraksh_admin"
        );

        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save social link."
        );
      }

      setSuccess(
        editingId
          ? "Social link updated successfully."
          : "Social link created successfully."
      );

      setModalOpen(false);
      resetForm();

      await loadSocialLinks();
    } catch (err) {
      console.error(
        "SOCIAL LINK SAVE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save social link."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ==================================================
  DELETE
  ==================================================
  */

  const handleDelete = async (socialLink) => {
    const confirmed = window.confirm(
      `Delete the ${socialLink.platform} social link?`
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${socialLink.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "rudraksh_admin_token"
        );

        localStorage.removeItem(
          "rudraksh_admin"
        );

        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete social link."
        );
      }

      setSuccess(
        "Social link deleted successfully."
      );

      await loadSocialLinks();
    } catch (err) {
      console.error(
        "SOCIAL LINK DELETE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete social link."
      );
    }
  };

  /*
  ==================================================
  QUICK ACTIVE TOGGLE
  ==================================================
  */

  const toggleActive = async (socialLink) => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${socialLink.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active:
              Number(socialLink.is_active) === 1
                ? 0
                : 1,
          }),
        }
      );

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "rudraksh_admin_token"
        );

        localStorage.removeItem(
          "rudraksh_admin"
        );

        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update social link."
        );
      }

      await loadSocialLinks();
    } catch (err) {
      console.error(
        "SOCIAL LINK TOGGLE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update social link."
      );
    }
  };

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="admin-social-page">

      {/* HEADER */}

      <header className="admin-social-header">

        <div className="admin-social-header-left">

          <div className="admin-social-icon">
            <Share2 size={24} />
          </div>

          <div>
            <span className="admin-social-eyebrow">
              CONTENT MANAGEMENT
            </span>

            <h1>Social Links</h1>

            <p>
              Manage the social media links
              displayed across the website.
            </p>
          </div>

        </div>

        <div className="admin-social-header-actions">

          <button
            className="admin-social-refresh"
            onClick={loadSocialLinks}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "admin-social-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            className="admin-social-add"
            onClick={openAddModal}
          >
            <Plus size={17} />
            Add Social Link
          </button>

        </div>

      </header>

      {/* ALERTS */}

      {error && (
        <div className="admin-social-alert admin-social-error">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-social-alert admin-social-success">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* STATS */}

      <section className="admin-social-stats">

        <div className="admin-social-stat-card">
          <span>Total Links</span>

          <strong>
            {socialLinks.length}
          </strong>
        </div>

        <div className="admin-social-stat-card">
          <span>Active</span>

          <strong>
            {
              socialLinks.filter(
                (link) =>
                  Number(link.is_active) === 1
              ).length
            }
          </strong>
        </div>

        <div className="admin-social-stat-card">
          <span>Inactive</span>

          <strong>
            {
              socialLinks.filter(
                (link) =>
                  Number(link.is_active) !== 1
              ).length
            }
          </strong>
        </div>

      </section>

      {/* LIST */}

      <main className="admin-social-content">

        {loading ? (
          <div className="admin-social-empty">

            <RefreshCw
              size={25}
              className="admin-social-spin"
            />

            <p>
              Loading social links...
            </p>

          </div>
        ) : socialLinks.length === 0 ? (
          <div className="admin-social-empty">

            <Share2 size={42} />

            <h2>
              No social links yet
            </h2>

            <p>
              Add your organization's
              social media accounts.
            </p>

            <button
              className="admin-social-add"
              onClick={openAddModal}
            >
              <Plus size={17} />
              Add First Link
            </button>

          </div>
        ) : (
          <div className="admin-social-list">

            {socialLinks.map(
              (socialLink, index) => (
                <article
                  className="admin-social-card"
                  key={socialLink.id}
                >

                  <div className="admin-social-card-main">

                    <div className="admin-social-platform-icon">
                      <Share2 size={20} />
                    </div>

                    <div className="admin-social-card-info">

                      <div className="admin-social-card-meta">

                        <span>
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <span>
                          Order:{" "}
                          {
                            socialLink.display_order
                          }
                        </span>

                        <span
                          className={
                            Number(
                              socialLink.is_active
                            ) === 1
                              ? "social-status-active"
                              : "social-status-inactive"
                          }
                        >
                          {Number(
                            socialLink.is_active
                          ) === 1 ? (
                            <>
                              <Eye size={12} />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              Inactive
                            </>
                          )}
                        </span>

                      </div>

                      <h2>
                        {socialLink.platform}
                      </h2>

                      <a
                        href={
                          socialLink.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="admin-social-url"
                      >
                        {socialLink.url}

                        <ExternalLink
                          size={13}
                        />
                      </a>

                      {socialLink.icon && (
                        <span className="admin-social-icon-name">
                          Icon:{" "}
                          {socialLink.icon}
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="admin-social-card-actions">

                    <button
                      className="social-action-toggle"
                      onClick={() =>
                        toggleActive(
                          socialLink
                        )
                      }
                    >
                      {Number(
                        socialLink.is_active
                      ) === 1 ? (
                        <>
                          <EyeOff size={15} />
                          Disable
                        </>
                      ) : (
                        <>
                          <Eye size={15} />
                          Activate
                        </>
                      )}
                    </button>

                    <button
                      className="social-action-edit"
                      onClick={() =>
                        openEditModal(
                          socialLink
                        )
                      }
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      className="social-action-delete"
                      onClick={() =>
                        handleDelete(
                          socialLink
                        )
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </main>

      {/* MODAL */}

      {modalOpen && (
        <div
          className="admin-social-modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="admin-social-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-social-modal-header">

              <div>
                <span>
                  {editingId
                    ? "EDIT SOCIAL LINK"
                    : "NEW SOCIAL LINK"}
                </span>

                <h2>
                  {editingId
                    ? "Update Social Link"
                    : "Add Social Link"}
                </h2>
              </div>

              <button
                className="admin-social-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="admin-social-form"
              onSubmit={handleSubmit}
            >

              <label>
                <span>
                  Platform *
                </span>

                <input
                  type="text"
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="Instagram"
                  disabled={saving}
                />
              </label>

              <label>
                <span>
                  URL *
                </span>

                <input
                  type="url"
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  maxLength={500}
                  placeholder="https://www.instagram.com/..."
                  disabled={saving}
                />
              </label>

              <label>
                <span>
                  Icon Name
                </span>

                <input
                  type="text"
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Instagram"
                  disabled={saving}
                />

                <small>
                  Optional. Used by the
                  frontend for icon mapping.
                </small>
              </label>

              <div className="admin-social-form-row">

                <label>
                  <span>
                    Display Order
                  </span>

                  <input
                    type="number"
                    name="display_order"
                    value={
                      form.display_order
                    }
                    onChange={handleChange}
                    min="0"
                    disabled={saving}
                  />
                </label>

                <div className="admin-social-active-field">

                  <span>
                    Visibility
                  </span>

                  <button
                    type="button"
                    className={
                      Number(
                        form.is_active
                      ) === 1
                        ? "social-visibility-on"
                        : "social-visibility-off"
                    }
                    onClick={
                      toggleActiveInForm
                    }
                    disabled={saving}
                  >
                    {Number(
                      form.is_active
                    ) === 1 ? (
                      <>
                        <Eye size={16} />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} />
                        Inactive
                      </>
                    )}
                  </button>

                </div>

              </div>

              <div className="admin-social-form-actions">

                <button
                  type="button"
                  className="social-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="social-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="admin-social-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />

                      {editingId
                        ? "Update Link"
                        : "Create Link"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminSocialLinks;