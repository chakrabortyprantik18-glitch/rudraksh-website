import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import "./AdminMembers.css";
import ImageCropper from "./ImageCropper";

const API_URL = "http://localhost:5000/api/members";
const BACKEND_URL = "http://localhost:5000";

const emptyForm = {
  name: "",
  position: "",
  bio: "",
  photo_url: "",
  phone: "",
  email: "",
  joined_date: "",
  is_active: true,
  display_order: 0,
};

function AdminMembers() {
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] =
    useState(null);

  const [form, setForm] = useState(emptyForm);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState("");
  const fileInputRef = useRef(null);

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    return localStorage.getItem(
      "rudraksh_admin_token"
    );
  };

  /* =========================================================
     LOAD MEMBERS
  ========================================================= */

  const loadMembers = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
            "Unable to load members."
        );
      }

      setMembers(data.members || []);
    } catch (err) {
      console.error(
        "LOAD MEMBERS ERROR:",
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
    loadMembers();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredMembers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter((member) => {
      return (
        member.name
          ?.toLowerCase()
          .includes(query) ||
        member.position
          ?.toLowerCase()
          .includes(query) ||
        member.email
          ?.toLowerCase()
          .includes(query) ||
        member.phone
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [members, search]);

  /* =========================================================
     FORM HANDLING
  ========================================================= */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     IMAGE HELPERS
  ========================================================= */

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    return `${BACKEND_URL}${imageUrl}`;
  };

  const clearNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    setNewImageFile(null);
    setNewImagePreview("");
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setCropSourceFile(file);
    setCropperOpen(true);
  };

  const handleCropApply = (result) => {
    if (!result?.file) {
      setError("Unable to prepare the cropped image.");
      return;
    }

    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    const previewUrl =
      result.preview ||
      URL.createObjectURL(result.file);

    setNewImageFile(result.file);
    setNewImagePreview(previewUrl);

    setCropperOpen(false);
    setCropSourceFile(null);
    setError("");
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCropSourceFile(null);
  };

  /* =========================================================
     OPEN ADD MODAL
  ========================================================= */

  const openAddModal = () => {
    setEditingMember(null);

    clearNewImage();

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditModal = (member) => {
    setEditingMember(member);
    clearNewImage();

    setForm({
      name: member.name || "",
      position: member.position || "",
      bio: member.bio || "",
      photo_url: member.photo_url || "",
      phone: member.phone || "",
      email: member.email || "",
      joined_date: member.joined_date
        ? String(member.joined_date).slice(0, 10)
        : "",
      is_active:
        member.is_active === undefined
          ? true
          : Boolean(member.is_active),
      display_order:
        member.display_order ?? 0,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingMember(null);
    setCropperOpen(false);
    setCropSourceFile(null);
    clearNewImage();

    setForm({
      ...emptyForm,
    });
  };

  /* =========================================================
     SAVE MEMBER
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!form.name.trim()) {
      setError("Member name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingMember);

      const url = isEditing
        ? `${API_URL}/${editingMember.id}`
        : API_URL;

      const method = isEditing
        ? "PUT"
        : "POST";

      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "position",
        form.position.trim()
      );

      formData.append(
        "bio",
        form.bio.trim()
      );

      formData.append(
        "photo_url",
        form.photo_url.trim()
      );

      formData.append(
        "phone",
        form.phone.trim()
      );

      formData.append(
        "email",
        form.email.trim()
      );

      formData.append(
        "joined_date",
        form.joined_date || ""
      );

      formData.append(
        "is_active",
        String(Boolean(form.is_active))
      );

      formData.append(
        "display_order",
        String(Number(form.display_order) || 0)
      );

      if (newImageFile) {
        formData.append(
          "image",
          newImageFile,
          newImageFile.name || "member-photo.jpg"
        );
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

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
            "Unable to save member."
        );
      }

      setSuccess(
        isEditing
          ? "Member updated successfully."
          : "Member added successfully."
      );

      setModalOpen(false);
      setEditingMember(null);

      clearNewImage();

      setForm({
        ...emptyForm,
      });

      await loadMembers();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "SAVE MEMBER ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save member."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE MEMBER
  ========================================================= */

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Delete "${member.name}" permanently?`
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
        `${API_URL}/${member.id}`,
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
            "Unable to delete member."
        );
      }

      setSuccess(
        "Member deleted successfully."
      );

      await loadMembers();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "DELETE MEMBER ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete member."
      );
    }
  };

  /* =========================================================
     TOGGLE ACTIVE STATUS
  ========================================================= */

  const toggleMemberStatus = async (
    member
  ) => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${member.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: (() => {
            const formData = new FormData();

            formData.append(
              "name",
              member.name || ""
            );
            formData.append(
              "position",
              member.position || ""
            );
            formData.append(
              "bio",
              member.bio || ""
            );
            formData.append(
              "photo_url",
              member.photo_url || ""
            );
            formData.append(
              "phone",
              member.phone || ""
            );
            formData.append(
              "email",
              member.email || ""
            );
            formData.append(
              "joined_date",
              member.joined_date
                ? String(member.joined_date).slice(0, 10)
                : ""
            );
            formData.append(
              "is_active",
              String(!Boolean(member.is_active))
            );
            formData.append(
              "display_order",
              String(member.display_order ?? 0)
            );

            return formData;
          })(),
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
            "Unable to update member status."
        );
      }

      await loadMembers();

      setSuccess(
        member.is_active
          ? "Member deactivated."
          : "Member activated."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "STATUS UPDATE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update member status."
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-members-page">

      {/* PAGE HEADER */}

      <div className="admin-members-header">

        <div>
          <p className="admin-members-kicker">
            MEMBERS MANAGEMENT
          </p>

          <h1>
            Organization Members
          </h1>

          <span>
            Add, edit and manage
            Rudraksh organization
            members.
          </span>
        </div>

        <button
          className="admin-members-add-button"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Member
        </button>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="admin-members-alert error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-members-alert success">
          <Check size={17} />

          <span>{success}</span>
        </div>
      )}

      {/* TOOLBAR */}

      <div className="admin-members-toolbar">

        <div className="admin-members-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <button
          className="admin-members-refresh"
          onClick={loadMembers}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "admin-members-spin"
                : ""
            }
          />

          Refresh
        </button>

        <div className="admin-members-count">
          <Users size={15} />

          <span>
            {filteredMembers.length} member
            {filteredMembers.length !== 1
              ? "s"
              : ""}
          </span>
        </div>
      </div>

      {/* CONTENT */}

      {loading ? (
        <div className="admin-members-loading">
          <RefreshCw
            size={25}
            className="admin-members-spin"
          />

          <span>
            Loading members...
          </span>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="admin-members-empty">

          <div className="admin-members-empty-icon">
            <Users size={28} />
          </div>

          <h2>
            {search
              ? "No members found"
              : "No members yet"}
          </h2>

          <p>
            {search
              ? "Try a different search."
              : "Add your first organization member to get started."}
          </p>

          {!search && (
            <button
              onClick={openAddModal}
              className="admin-members-add-button"
            >
              <Plus size={17} />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="admin-members-table-wrap">

          <table className="admin-members-table">

            <thead>
              <tr>
                <th>MEMBER</th>
                <th>POSITION</th>
                <th>CONTACT</th>
                <th>JOINED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map(
                (member) => (
                  <tr key={member.id}>

                    {/* MEMBER */}

                    <td>
                      <div className="admin-member-info">

                        {member.photo_url ? (
                          <img
                            src={getImageUrl(member.photo_url)}
                            alt={member.name}
                            className="admin-member-photo"
                          />
                        ) : (
                          <div className="admin-member-photo-placeholder">
                            <UserRound
                              size={18}
                            />
                          </div>
                        )}

                        <div>
                          <strong>
                            {member.name}
                          </strong>

                          <span>
                            ID #{member.id}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* POSITION */}

                    <td>
                      <span className="admin-member-position">
                        {member.position ||
                          "Not specified"}
                      </span>
                    </td>

                    {/* CONTACT */}

                    <td>
                      <div className="admin-member-contact">

                        {member.email && (
                          <span>
                            <Mail size={12} />
                            {member.email}
                          </span>
                        )}

                        {member.phone && (
                          <span>
                            <Phone size={12} />
                            {member.phone}
                          </span>
                        )}

                        {!member.email &&
                          !member.phone && (
                            <span>
                              No contact
                            </span>
                          )}

                      </div>
                    </td>

                    {/* JOINED */}

                    <td>
                      <span className="admin-member-date">
                        <CalendarDays
                          size={12}
                        />

                        {member.joined_date
                          ? new Date(
                              member.joined_date
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td>
                      <button
                        className={`admin-member-status ${
                          member.is_active
                            ? "active"
                            : "inactive"
                        }`}
                        onClick={() =>
                          toggleMemberStatus(
                            member
                          )
                        }
                      >
                        <span />

                        {member.is_active
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="admin-member-actions">

                        <button
                          className="admin-member-edit"
                          onClick={() =>
                            openEditModal(
                              member
                            )
                          }
                          title="Edit member"
                        >
                          <Pencil
                            size={15}
                          />
                        </button>

                        <button
                          className="admin-member-delete"
                          onClick={() =>
                            handleDelete(
                              member
                            )
                          }
                          title="Delete member"
                        >
                          <Trash2
                            size={15}
                          />
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              )}
            </tbody>

          </table>
        </div>
      )}

      {cropperOpen && cropSourceFile && (
        <ImageCropper
          file={cropSourceFile}
          initialRatio="1:1"
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {modalOpen && (
        <div
          className="admin-member-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="admin-member-modal">

            <div className="admin-member-modal-header">

              <div>
                <p>
                  {editingMember
                    ? "EDIT MEMBER"
                    : "NEW MEMBER"}
                </p>

                <h2>
                  {editingMember
                    ? "Edit Member"
                    : "Add Member"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="admin-member-form"
            >

              {/* NAME */}

              <div className="admin-form-group">
                <label>
                  Full Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter member name"
                  required
                />
              </div>

              {/* POSITION */}

              <div className="admin-form-group">
                <label>
                  Position
                </label>

                <input
                  name="position"
                  value={form.position}
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. President, Secretary"
                />
              </div>

              {/* EMAIL + PHONE */}

              <div className="admin-form-row">

                <div className="admin-form-group">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={
                      handleInputChange
                    }
                    placeholder="member@email.com"
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={
                      handleInputChange
                    }
                    placeholder="+91..."
                  />
                </div>

              </div>

              {/* JOINED DATE + ORDER */}

              <div className="admin-form-row">

                <div className="admin-form-group">
                  <label>
                    Joined Date
                  </label>

                  <input
                    type="date"
                    name="joined_date"
                    value={
                      form.joined_date
                    }
                    onChange={
                      handleInputChange
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>
                    Display Order
                  </label>

                  <input
                    type="number"
                    name="display_order"
                    value={
                      form.display_order
                    }
                    onChange={
                      handleInputChange
                    }
                    min="0"
                  />
                </div>

              </div>

              {/* MEMBER PHOTO */}

              <div className="admin-form-group">
                <label>
                  Member Photo
                </label>

                <div className="admin-member-image-upload">
                  <div className="admin-member-image-preview">
                    {newImagePreview ? (
                      <img
                        src={newImagePreview}
                        alt="New member preview"
                      />
                    ) : form.photo_url ? (
                      <img
                        src={getImageUrl(form.photo_url)}
                        alt={form.name || "Member"}
                      />
                    ) : (
                      <div className="admin-member-image-empty">
                        <UserRound size={28} />
                        <span>No photo selected</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-member-image-controls">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      className="admin-form-upload-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={saving}
                    >
                      Choose Photo
                    </button>

                    <p>
                      JPG, PNG or WEBP · Max 5MB
                    </p>

                    <p>
                      Crop options: 1:1, 4:3 or 16:9
                    </p>
                  </div>
                </div>

                <input
                  name="photo_url"
                  value={form.photo_url}
                  onChange={handleInputChange}
                  placeholder="Optional external image URL"
                />
              </div>

              {/* BIO */}

              <div className="admin-form-group">
                <label>
                  Biography
                </label>

                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Short member biography..."
                  rows="4"
                />
              </div>

              {/* ACTIVE */}

              <label className="admin-form-checkbox">

                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      form.is_active
                    )
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        is_active:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  Member is active
                </span>

              </label>

              {/* ACTIONS */}

              <div className="admin-member-form-actions">

                <button
                  type="button"
                  className="admin-form-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-form-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-members-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />

                      {editingMember
                        ? "Update Member"
                        : "Add Member"}
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

export default AdminMembers;