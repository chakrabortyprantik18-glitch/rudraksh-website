import { useEffect, useMemo, useRef, useState } from "react";

import {
  Images,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  FileImage,
} from "lucide-react";

import "./AdminGallery.css";
import ImageCropper from "./ImageCropper.jsx";
import { BACKEND_URL } from "../config/api";

const API_URL = `${BACKEND_URL}/api/gallery`;

const emptyForm = {
  title: "",
  description: "",
  category: "",
  event_id: "",
  project_id: "",
  is_published: true,
  display_order: 0,
};

function AdminGallery() {
  const fileInputRef = useRef(null);

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSourceFile, setCropSourceFile] = useState(null);

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    return localStorage.getItem("rudraksh_admin_token");
  };

  /* =========================================================
     ADMIN REDIRECT
  ========================================================= */

  const redirectToAdmin = () => {
    window.location.href = "/admin";
  };

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("data:")
    ) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return `${BACKEND_URL}${imageUrl}`;
    }

    return `${BACKEND_URL}/${imageUrl}`;
  };

  /* =========================================================
     LOAD GALLERY
  ========================================================= */

  const loadGallery = async () => {
    const token = getToken();

    if (!token) {
      redirectToAdmin();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load gallery."
        );
      }

      setGallery(
        Array.isArray(data.gallery)
          ? data.gallery
          : []
      );
    } catch (err) {
      console.error("LOAD GALLERY ERROR:", err);

      setError(
        err.message ||
          "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredGallery = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return gallery;
    }

    return gallery.filter((item) => {
      return (
        item.title
          ?.toLowerCase()
          .includes(query) ||
        item.category
          ?.toLowerCase()
          .includes(query) ||
        item.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [gallery, search]);

  /* =========================================================
     RESET FILE
  ========================================================= */

  const resetFileSelection = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setCropSourceFile(null);
    setCropperOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     FILE SELECTED
  ========================================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, WEBP and GIF images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setCropSourceFile(file);
    setCropperOpen(true);
  };

  /* =========================================================
     CROP APPLIED
  ========================================================= */

  const handleCropApply = (croppedImage) => {
    if (
      !croppedImage ||
      !croppedImage.file
    ) {
      setError(
        "Unable to prepare the cropped image."
      );

      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(croppedImage.file);
    setPreviewUrl(croppedImage.preview || "");

    setCropSourceFile(null);
    setCropperOpen(false);
    setError("");
  };

  /* =========================================================
     CROP CANCEL
  ========================================================= */

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCropSourceFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     FORM INPUT
  ========================================================= */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     ADD MODAL
  ========================================================= */

  const openAddModal = () => {
    setEditingItem(null);

    setForm({
      ...emptyForm,
    });

    resetFileSelection();

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  /* =========================================================
     EDIT MODAL
  ========================================================= */

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "",
      event_id: item.event_id ?? "",
      project_id: item.project_id ?? "",
      is_published: Boolean(item.is_published),
      display_order: item.display_order ?? 0,
    });

    resetFileSelection();

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingItem(null);

    setForm({
      ...emptyForm,
    });

    resetFileSelection();

    setError("");
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      redirectToAdmin();
      return;
    }

    setError("");
    setSuccess("");

    if (!editingItem && !selectedFile) {
      setError(
        "Please select an image before uploading."
      );

      return;
    }

    try {
      setSaving(true);

      let response;

      /* =====================================================
         EDIT
      ===================================================== */

      if (editingItem) {
        const payload = {
          title: form.title.trim() || null,

          description:
            form.description.trim() || null,

          category:
            form.category.trim() || null,

          event_id: form.event_id
            ? Number(form.event_id)
            : null,

          project_id: form.project_id
            ? Number(form.project_id)
            : null,

          display_order:
            Number(form.display_order) || 0,

          is_published:
            Boolean(form.is_published),
        };

        response = await fetch(
          `${API_URL}/${editingItem.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      /* =====================================================
         CREATE
      ===================================================== */

      else {
        const formData = new FormData();

        formData.append(
          "image",
          selectedFile,
          selectedFile.name
        );

        formData.append(
          "title",
          form.title.trim()
        );

        formData.append(
          "description",
          form.description.trim()
        );

        formData.append(
          "category",
          form.category.trim()
        );

        formData.append(
          "event_id",
          form.event_id
        );

        formData.append(
          "project_id",
          form.project_id
        );

        formData.append(
          "display_order",
          String(
            Number(form.display_order) || 0
          )
        );

        formData.append(
          "is_published",
          String(
            Boolean(form.is_published)
          )
        );

        response = await fetch(
          `${API_URL}?t=${Date.now()}`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );
      }

      /* =====================================================
         RESPONSE
      ===================================================== */

      const responseText =
        await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          success: false,
          message:
            responseText ||
            "Invalid server response.",
        };
      }

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

        redirectToAdmin();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save gallery image."
        );
      }

      setSuccess(
        editingItem
          ? "Gallery image updated successfully."
          : "Gallery image uploaded successfully."
      );

      setModalOpen(false);
      setEditingItem(null);

      setForm({
        ...emptyForm,
      });

      resetFileSelection();

      await loadGallery();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "GALLERY SAVE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save gallery image."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      "Delete this gallery image permanently?"
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      redirectToAdmin();
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

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

        redirectToAdmin();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete image."
        );
      }

      setSuccess(
        "Gallery image deleted successfully."
      );

      await loadGallery();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "DELETE GALLERY ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete gallery image."
      );
    }
  };

  /* =========================================================
     PUBLISH
  ========================================================= */

  const togglePublished = async (item) => {
    const token = getToken();

    if (!token) {
      redirectToAdmin();
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${item.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            title:
              item.title || null,

            description:
              item.description || null,

            category:
              item.category || null,

            event_id:
              item.event_id || null,

            project_id:
              item.project_id || null,

            display_order:
              Number(
                item.display_order
              ) || 0,

            is_published:
              !Boolean(
                item.is_published
              ),
          }),
        }
      );

      const data =
        await response.json();

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

        redirectToAdmin();
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update image."
        );
      }

      await loadGallery();

      setSuccess(
        item.is_published
          ? "Gallery image unpublished."
          : "Gallery image published."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "PUBLISH GALLERY ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update gallery image."
      );
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-gallery-page">
      <div className="admin-gallery-header">
        <div>
          <p className="admin-gallery-kicker">
            GALLERY MANAGEMENT
          </p>

          <h1>
            Organization Gallery
          </h1>

          <span>
            Manage photos and images
            displayed on the Rudraksh
            website.
          </span>
        </div>

        <button
          type="button"
          className="admin-gallery-add-button"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Photo
        </button>
      </div>

      {error && (
        <div className="admin-gallery-alert error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-gallery-alert success">
          <Check size={17} />
          <span>{success}</span>
        </div>
      )}

      <div className="admin-gallery-toolbar">
        <div className="admin-gallery-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search gallery..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="button"
          className="admin-gallery-refresh"
          onClick={loadGallery}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "admin-gallery-spin"
                : ""
            }
          />

          Refresh
        </button>

        <div className="admin-gallery-count">
          <Images size={15} />

          <span>
            {filteredGallery.length} photo
            {filteredGallery.length !== 1
              ? "s"
              : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="admin-gallery-loading">
          <RefreshCw
            size={25}
            className="admin-gallery-spin"
          />

          <span>
            Loading gallery...
          </span>
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="admin-gallery-empty">
          <div className="admin-gallery-empty-icon">
            <Images size={28} />
          </div>

          <h2>
            {search
              ? "No photos found"
              : "No gallery photos yet"}
          </h2>

          <p>
            {search
              ? "Try a different search."
              : "Add your first photo to get started."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={openAddModal}
              className="admin-gallery-add-button"
            >
              <Plus size={17} />
              Add First Photo
            </button>
          )}
        </div>
      ) : (
        <div className="admin-gallery-grid">
          {filteredGallery.map(
            (item) => (
              <div
                className="admin-gallery-card"
                key={item.id}
              >
                <div className="admin-gallery-image-wrap">
                  {item.image_url ? (
                    <img
                      src={getImageUrl(
                        item.image_url
                      )}
                      alt={
                        item.title ||
                        "Gallery"
                      }
                      className="admin-gallery-image"
                    />
                  ) : (
                    <div className="admin-gallery-image-placeholder">
                      <Images size={28} />
                    </div>
                  )}
                </div>

                <div className="admin-gallery-card-content">
                  <div className="admin-gallery-card-top">
                    <div>
                      <h3>
                        {item.title ||
                          "Untitled Photo"}
                      </h3>

                      {item.category && (
                        <span className="admin-gallery-category">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p>
                      {item.description}
                    </p>
                  )}

                  <div className="admin-gallery-card-bottom">
                    <button
                      type="button"
                      className={`admin-gallery-published ${
                        item.is_published
                          ? "published"
                          : "hidden"
                      }`}
                      onClick={() =>
                        togglePublished(
                          item
                        )
                      }
                    >
                      {item.is_published ? (
                        <>
                          <Eye size={12} />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Hidden
                        </>
                      )}
                    </button>

                    <div className="admin-gallery-actions">
                      <button
                        type="button"
                        className="admin-gallery-edit"
                        onClick={() =>
                          openEditModal(
                            item
                          )
                        }
                        title="Edit photo"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="admin-gallery-delete"
                        onClick={() =>
                          handleDelete(
                            item
                          )
                        }
                        title="Delete photo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className="admin-gallery-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="admin-gallery-modal">
            <div className="admin-gallery-modal-header">
              <div>
                <p>
                  {editingItem
                    ? "EDIT PHOTO"
                    : "NEW PHOTO"}
                </p>

                <h2>
                  {editingItem
                    ? "Edit Gallery Photo"
                    : "Upload Gallery Photo"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="admin-gallery-form"
            >
              {!editingItem && (
                <div className="admin-gallery-upload-box">
                  <FileImage size={32} />

                  <strong>
                    Select a photo
                  </strong>

                  <span>
                    JPG, PNG, WEBP or GIF
                    · Maximum 5 MB
                  </span>

                  <label
                    htmlFor="gallery-image-file"
                    className="admin-gallery-select-button"
                  >
                    <Upload size={15} />
                    Choose Image
                  </label>

                  <input
                    id="gallery-image-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    style={{
                      position:
                        "absolute",
                      width: "1px",
                      height: "1px",
                      opacity: 0,
                      pointerEvents:
                        "none",
                    }}
                  />

                  {selectedFile && (
                    <div className="admin-gallery-selected-file">
                      <Check size={14} />

                      <span>
                        {
                          selectedFile.name
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}

              {previewUrl && (
                <div className="admin-gallery-preview">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                  />

                  <button
                    type="button"
                    onClick={
                      resetFileSelection
                    }
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>
              )}

              {editingItem &&
                !previewUrl &&
                editingItem.image_url && (
                  <div className="admin-gallery-preview">
                    <img
                      src={getImageUrl(
                        editingItem.image_url
                      )}
                      alt="Current gallery"
                    />
                  </div>
                )}

              <div className="admin-gallery-form-group">
                <label>
                  Photo Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Example: Blood Donation Camp"
                />
              </div>

              <div className="admin-gallery-form-group">
                <label>
                  Category
                </label>

                <input
                  name="category"
                  value={form.category}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Example: Events"
                />
              </div>

              <div className="admin-gallery-form-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Describe this photo..."
                  rows="4"
                />
              </div>

              <div className="admin-gallery-form-row">
                <div className="admin-gallery-form-group">
                  <label>
                    Event ID
                  </label>

                  <input
                    type="number"
                    name="event_id"
                    value={
                      form.event_id
                    }
                    onChange={
                      handleInputChange
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>

                <div className="admin-gallery-form-group">
                  <label>
                    Project ID
                  </label>

                  <input
                    type="number"
                    name="project_id"
                    value={
                      form.project_id
                    }
                    onChange={
                      handleInputChange
                    }
                    min="1"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="admin-gallery-form-group">
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

              <div className="admin-gallery-options">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(
                      form.is_published
                    )}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          is_published:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    Publish on website
                  </span>
                </label>
              </div>

              <div className="admin-gallery-form-actions">
                <button
                  type="button"
                  className="admin-gallery-form-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-gallery-form-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-gallery-spin"
                      />

                      {editingItem
                        ? "Updating..."
                        : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Check size={15} />

                      {editingItem
                        ? "Update Photo"
                        : "Upload Photo"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropperOpen &&
        cropSourceFile && (
          <ImageCropper
            file={cropSourceFile}
            initialRatio="4:3"
            onApply={handleCropApply}
            onCancel={handleCropCancel}
          />
        )}
    </div>
  );
}

export default AdminGallery;