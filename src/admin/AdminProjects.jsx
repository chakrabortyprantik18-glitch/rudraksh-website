import { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  MapPin,
  CalendarDays,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";

import "./AdminProjects.css";
import ImageCropper from "./ImageCropper";
import { BACKEND_URL } from "../config/api";

const API_URL = `${BACKEND_URL}/api/projects`;

const emptyForm = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  cover_image: "",
  project_date: "",
  location: "",
  status: "completed",
  is_featured: false,
  is_published: true,
  display_order: 0,
};

function AdminProjects() {
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ============================================================
  // IMAGE CROPPER
  // ============================================================

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const projectImageInputRef = useRef(null);

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("rudraksh_admin_token");
  };

  // ============================================================
  // IMAGE URL HELPER
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    return `${BACKEND_URL}${
      image.startsWith("/") ? "" : "/"
    }${image}`;
  };

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = async () => {
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
        localStorage.removeItem("rudraksh_admin_token");
        localStorage.removeItem("rudraksh_admin");

        window.location.href = "/admin";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load projects."
        );
      }

      setProjects(data.projects || []);
    } catch (err) {
      console.error("LOAD PROJECTS ERROR:", err);

      setError(
        err.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.title
          ?.toLowerCase()
          .includes(query) ||
        project.slug
          ?.toLowerCase()
          .includes(query) ||
        project.location
          ?.toLowerCase()
          .includes(query) ||
        project.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [projects, search]);

  // ============================================================
  // INPUT
  // ============================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    setEditingProject(null);

    setForm({
      ...emptyForm,
    });

    setCroppedImage(null);
    setCropSourceFile(null);
    setCropperOpen(false);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (project) => {
    setEditingProject(project);

    setForm({
      title: project.title || "",
      slug: project.slug || "",
      short_description:
        project.short_description || "",
      description:
        project.description || "",
      cover_image:
        project.cover_image || "",
      project_date: project.project_date
        ? String(project.project_date).slice(0, 10)
        : "",
      location: project.location || "",
      status:
        project.status || "completed",
      is_featured:
        Boolean(project.is_featured),
      is_published:
        Boolean(project.is_published),
      display_order:
        project.display_order ?? 0,
    });

    setCroppedImage(null);
    setCropSourceFile(null);
    setCropperOpen(false);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ============================================================
  // IMAGE SELECT
  // ============================================================

  const handleProjectImageSelect = (event) => {
    const file = event.target.files?.[0];

    // Allow the same image to be selected again
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be 5MB or smaller."
      );
      return;
    }

    setError("");

    setCropSourceFile(file);
    setCropperOpen(true);
  };

  // ============================================================
  // APPLY CROP
  // ============================================================

  const handleProjectCropApply = (result) => {
    if (!result) {
      setError("Unable to crop image.");
      return;
    }

    /*
      ImageCropper returns:

      {
        file,
        preview,
        name,
        ratio,
        width,
        height
      }
    */

    setCroppedImage(result);

    setCropSourceFile(null);
    setCropperOpen(false);

    setSuccess(
      `Image cropped successfully (${result.ratio}).`
    );

    setTimeout(() => {
      setSuccess("");
    }, 2000);
  };

  // ============================================================
  // CANCEL CROP
  // ============================================================

  const handleProjectCropCancel = () => {
    setCropSourceFile(null);
    setCropperOpen(false);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingProject(null);

    setForm({
      ...emptyForm,
    });

    setCropperOpen(false);
    setCropSourceFile(null);
    setCroppedImage(null);
  };

  // ============================================================
  // SAVE PROJECT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Project slug is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingProject);

      const url = isEditing
        ? `${API_URL}/${editingProject.id}`
        : API_URL;

      const method = isEditing
        ? "PUT"
        : "POST";

      // ========================================================
      // FORM DATA
      // ========================================================

      const formData = new FormData();

      const cleanSlug = form.slug
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "slug",
        cleanSlug
      );

      formData.append(
        "short_description",
        form.short_description.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "cover_image",
        form.cover_image.trim()
      );

      formData.append(
        "project_date",
        form.project_date || ""
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "status",
        form.status
      );

      formData.append(
        "is_featured",
        Boolean(form.is_featured)
          ? "1"
          : "0"
      );

      formData.append(
        "is_published",
        Boolean(form.is_published)
          ? "1"
          : "0"
      );

      formData.append(
        "display_order",
        String(
          Number(form.display_order) || 0
        )
      );

      // New cropped image
      if (
        croppedImage &&
        croppedImage.file
      ) {
        formData.append(
          "image",
          croppedImage.file
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
            "Unable to save project."
        );
      }

      setSuccess(
        isEditing
          ? "Project updated successfully."
          : "Project added successfully."
      );

      setModalOpen(false);
      setEditingProject(null);

      setForm({
        ...emptyForm,
      });

      setCroppedImage(null);
      setCropSourceFile(null);
      setCropperOpen(false);

      await loadProjects();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "SAVE PROJECT ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.title}" permanently?`
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
        `${API_URL}/${project.id}`,
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
            "Unable to delete project."
        );
      }

      setSuccess(
        "Project deleted successfully."
      );

      await loadProjects();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "DELETE PROJECT ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete project."
      );
    }
  };

  // ============================================================
  // PUBLISH / UNPUBLISH
  // ============================================================

  const togglePublished = async (
    project
  ) => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      /*
        IMPORTANT:
        Backend requires title + slug on PUT.
        Therefore we send the COMPLETE project.
      */

      const payload = {
        title: project.title || "",

        slug:
          project.slug || "",

        short_description:
          project.short_description || null,

        description:
          project.description || null,

        cover_image:
          project.cover_image || null,

        project_date:
          project.project_date
            ? String(
                project.project_date
              ).slice(0, 10)
            : null,

        location:
          project.location || null,

        status:
          project.status || "completed",

        is_featured:
          Boolean(project.is_featured),

        is_published:
          !Boolean(
            project.is_published
          ),

        display_order:
          Number(
            project.display_order
          ) || 0,
      };

      const response = await fetch(
        `${API_URL}/${project.id}`,
        {
          method: "PUT",

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
            "Unable to update project."
        );
      }

      await loadProjects();

      setSuccess(
        project.is_published
          ? "Project unpublished."
          : "Project published."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(
        "PUBLISH UPDATE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update project."
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-projects-page">

      {/* ======================================================
          CROPPER
      ====================================================== */}

      {cropperOpen && cropSourceFile && (
        <ImageCropper
          file={cropSourceFile}
          initialRatio="16:9"
          onApply={handleProjectCropApply}
          onCancel={handleProjectCropCancel}
        />
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-projects-header">

        <div>
          <p className="admin-projects-kicker">
            PROJECT MANAGEMENT
          </p>

          <h1>
            Organization Projects
          </h1>

          <span>
            Create and manage Rudraksh
            projects and initiatives.
          </span>
        </div>

        <button
          className="admin-projects-add-button"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Project
        </button>

      </div>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="admin-projects-alert error">

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
        <div className="admin-projects-alert success">

          <Check size={17} />

          <span>{success}</span>

        </div>
      )}

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="admin-projects-toolbar">

        <div className="admin-projects-search">

          <Search size={16} />

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        <button
          className="admin-projects-refresh"
          onClick={loadProjects}
          disabled={loading}
        >

          <RefreshCw
            size={15}
            className={
              loading
                ? "admin-projects-spin"
                : ""
            }
          />

          Refresh

        </button>

        <div className="admin-projects-count">

          <FolderKanban size={15} />

          <span>
            {filteredProjects.length} project
            {filteredProjects.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {loading ? (

        <div className="admin-projects-loading">

          <RefreshCw
            size={25}
            className="admin-projects-spin"
          />

          <span>
            Loading projects...
          </span>

        </div>

      ) : filteredProjects.length === 0 ? (

        <div className="admin-projects-empty">

          <div className="admin-projects-empty-icon">
            <FolderKanban size={28} />
          </div>

          <h2>
            {search
              ? "No projects found"
              : "No projects yet"}
          </h2>

          <p>
            {search
              ? "Try a different search."
              : "Add your first project to get started."}
          </p>

          {!search && (
            <button
              onClick={openAddModal}
              className="admin-projects-add-button"
            >
              <Plus size={17} />
              Add First Project
            </button>
          )}

        </div>

      ) : (

        <div className="admin-projects-table-wrap">

          <table className="admin-projects-table">

            <thead>

              <tr>
                <th>PROJECT</th>
                <th>LOCATION</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>VISIBILITY</th>
                <th>FEATURED</th>
                <th>ACTIONS</th>
              </tr>

            </thead>

            <tbody>

              {filteredProjects.map(
                (project) => (

                  <tr
                    key={project.id}
                  >

                    {/* PROJECT */}

                    <td>

                      <div className="admin-project-info">

                        {project.cover_image ? (

                          <img
                            src={getImageUrl(
                              project.cover_image
                            )}
                            alt={
                              project.title
                            }
                            className="admin-project-image"

                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";

                              const parent =
                                event.currentTarget.parentElement;

                              if (
                                parent &&
                                !parent.querySelector(
                                  ".image-error-placeholder"
                                )
                              ) {
                                const placeholder =
                                  document.createElement(
                                    "div"
                                  );

                                placeholder.className =
                                  "admin-project-image-placeholder image-error-placeholder";

                                placeholder.innerHTML =
                                  "🖼️";

                                parent.insertBefore(
                                  placeholder,
                                  event.currentTarget
                                );
                              }
                            }}
                          />

                        ) : (

                          <div className="admin-project-image-placeholder">
                            <FolderKanban
                              size={18}
                            />
                          </div>

                        )}

                        <div>

                          <strong>
                            {project.title}
                          </strong>

                          <span>
                            /{project.slug}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* LOCATION */}

                    <td>

                      <span className="admin-project-location">

                        <MapPin size={12} />

                        {project.location ||
                          "Not specified"}

                      </span>

                    </td>

                    {/* DATE */}

                    <td>

                      <span className="admin-project-date">

                        <CalendarDays
                          size={12}
                        />

                        {project.project_date
                          ? new Date(
                              project.project_date
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

                      <span
                        className={`admin-project-status ${project.status}`}
                      >
                        {project.status}
                      </span>

                    </td>

                    {/* VISIBILITY */}

                    <td>

                      <button
                        className={`admin-project-published ${
                          project.is_published
                            ? "published"
                            : "hidden"
                        }`}
                        onClick={() =>
                          togglePublished(
                            project
                          )
                        }
                      >

                        {project.is_published ? (
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

                    </td>

                    {/* FEATURED */}

                    <td>

                      {project.is_featured ? (

                        <span className="admin-project-featured">

                          <Star
                            size={12}
                            fill="currentColor"
                          />

                          Featured

                        </span>

                      ) : (

                        <span className="admin-project-not-featured">
                          —
                        </span>

                      )}

                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="admin-project-actions">

                        <button
                          className="admin-project-edit"
                          onClick={() =>
                            openEditModal(
                              project
                            )
                          }
                          title="Edit project"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          className="admin-project-delete"
                          onClick={() =>
                            handleDelete(
                              project
                            )
                          }
                          title="Delete project"
                        >
                          <Trash2 size={15} />
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

      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {modalOpen && (

        <div
          className="admin-project-modal-overlay"

          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="admin-project-modal">

            {/* MODAL HEADER */}

            <div className="admin-project-modal-header">

              <div>

                <p>
                  {editingProject
                    ? "EDIT PROJECT"
                    : "NEW PROJECT"}
                </p>

                <h2>
                  {editingProject
                    ? "Edit Project"
                    : "Add Project"}
                </h2>

              </div>

              <button
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="admin-project-form"
            >

              {/* TITLE */}

              <div className="admin-project-form-group">

                <label>
                  Project Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter project title"
                  required
                />

              </div>

              {/* SLUG */}

              <div className="admin-project-form-group">

                <label>
                  Slug *
                </label>

                <input
                  name="slug"
                  value={form.slug}
                  onChange={
                    handleInputChange
                  }
                  placeholder="project-slug"
                  required
                />

                <small>
                  Used for the project URL.
                </small>

              </div>

              {/* SHORT DESCRIPTION */}

              <div className="admin-project-form-group">

                <label>
                  Short Description
                </label>

                <textarea
                  name="short_description"
                  value={
                    form.short_description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Brief project summary..."
                  rows="3"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="admin-project-form-group">

                <label>
                  Full Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Full project description..."
                  rows="5"
                />

              </div>

              {/* ==================================================
                  COVER IMAGE
              ================================================== */}

              <div className="admin-project-form-group">

                <label>
                  Cover Image
                </label>

                <input
                  ref={
                    projectImageInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleProjectImageSelect
                  }
                  style={{
                    display: "none",
                  }}
                />

                <button
                  type="button"
                  className="admin-project-image-upload-button"
                  onClick={() =>
                    projectImageInputRef.current?.click()
                  }
                  disabled={saving}
                >
                  <ImageIcon size={17} />

                  Choose Cover Image
                </button>

                <small>
                  JPG, PNG or WEBP • Maximum
                  5MB
                </small>

                <small>
                  Crop options: 1:1, 4:3 or
                  16:9.
                </small>

                {/* PREVIEW */}

                {(croppedImage?.preview ||
                  form.cover_image) && (

                  <div
                    style={{
                      marginTop: "14px",
                    }}
                  >

                    <img
                      src={
                        croppedImage?.preview ||
                        getImageUrl(
                          form.cover_image
                        )
                      }
                      alt="Project preview"
                      style={{
                        width: "100%",
                        maxWidth: "420px",
                        height: "220px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        display: "block",
                      }}

                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                    {croppedImage && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "7px",
                        }}
                      >
                        New cropped image ready
                        to upload.
                      </small>
                    )}

                  </div>

                )}

                {/* EXISTING URL FALLBACK */}

                <input
                  name="cover_image"
                  value={
                    form.cover_image
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Or enter an image URL..."
                  style={{
                    marginTop: "12px",
                  }}
                />

                <small>
                  Leave the URL empty when
                  uploading a new image.
                </small>

              </div>

              {/* DATE + LOCATION */}

              <div className="admin-project-form-row">

                <div className="admin-project-form-group">

                  <label>
                    Project Date
                  </label>

                  <input
                    type="date"
                    name="project_date"
                    value={
                      form.project_date
                    }
                    onChange={
                      handleInputChange
                    }
                  />

                </div>

                <div className="admin-project-form-group">

                  <label>
                    Location
                  </label>

                  <input
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Nilambazar, Assam"
                  />

                </div>

              </div>

              {/* STATUS + ORDER */}

              <div className="admin-project-form-row">

                <div className="admin-project-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={
                      handleInputChange
                    }
                  >

                    <option value="upcoming">
                      Upcoming
                    </option>

                    <option value="ongoing">
                      Ongoing
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                  </select>

                </div>

                <div className="admin-project-form-group">

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

              {/* OPTIONS */}

              <div className="admin-project-options">

                <label>

                  <input
                    type="checkbox"
                    checked={Boolean(
                      form.is_featured
                    )}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          is_featured:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span>
                    Featured project
                  </span>

                </label>

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

              {/* ACTIONS */}

              <div className="admin-project-form-actions">

                <button
                  type="button"
                  className="admin-project-form-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-project-form-save"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-projects-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />

                      {editingProject
                        ? "Update Project"
                        : "Add Project"}
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

export default AdminProjects;