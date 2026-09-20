import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  MapPin,
  Eye,
  EyeOff,
  Star,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import "./AdminEvents.css";
import ImageCropper from "./ImageCropper.jsx";
import { BACKEND_URL } from "../config/api";

const API_URL = `${BACKEND_URL}/api/events`;

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  event_date: "",
  location: "",
  cover_image: "",
  status: "upcoming",
  is_featured: false,
  is_published: true,
  display_order: 0,
};

function AdminEvents() {
  const fileInputRef = useRef(null);

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSourceFile, setCropSourceFile] = useState(null);

  const getToken = () => {
    return localStorage.getItem("rudraksh_admin_token");
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
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return `${BACKEND_URL}${imageUrl}`;
    }

    return `${BACKEND_URL}/${imageUrl}`;
  };

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  const loadEvents = async () => {
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
            "Unable to load events."
        );
      }

      setEvents(data.events || []);
    } catch (err) {
      console.error(
        "LOAD EVENTS ERROR:",
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
    loadEvents();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredEvents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((event) => {
      return (
        event.title
          ?.toLowerCase()
          .includes(query) ||
        event.slug
          ?.toLowerCase()
          .includes(query) ||
        event.location
          ?.toLowerCase()
          .includes(query) ||
        event.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [events, search]);

  /* =========================================================
     FORM INPUT
  ========================================================= */

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     FILE RESET
  ========================================================= */

  const resetFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setCropSourceFile(null);
    setCropperOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     OPEN ADD
  ========================================================= */

  const openAddModal = () => {
    setEditingEvent(null);

    resetFileSelection();

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEditModal = (event) => {
    setEditingEvent(event);

    resetFileSelection();

    setForm({
      title: event.title || "",

      slug: event.slug || "",

      description:
        event.description || "",

      event_date: event.event_date
        ? String(event.event_date).slice(
            0,
            10
          )
        : "",

      location:
        event.location || "",

      cover_image:
        event.cover_image || "",

      status:
        event.status || "upcoming",

      is_featured:
        Boolean(event.is_featured),

      is_published:
        Boolean(event.is_published),

      display_order:
        event.display_order ?? 0,
    });

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

    setEditingEvent(null);

    resetFileSelection();

    setForm({
      ...emptyForm,
    });
  };

  /* =========================================================
     SELECT IMAGE
  ========================================================= */

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be smaller than 5MB."
      );

      event.target.value = "";
      return;
    }

    setCropSourceFile(file);
    setCropperOpen(true);
  };

  /* =========================================================
     APPLY CROP
  ========================================================= */

  const handleCropApply = ({
    file,
    preview,
  }) => {
    setSelectedFile(file);
    setPreviewUrl(preview);

    setCropperOpen(false);
    setCropSourceFile(null);

    setError("");
  };

  /* =========================================================
     CANCEL CROP
  ========================================================= */

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCropSourceFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     SUBMIT EVENT
  ========================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Event title is required."
      );
      return;
    }

    if (!form.slug.trim()) {
      setError(
        "Event slug is required."
      );
      return;
    }

    if (!form.event_date) {
      setError(
        "Event date is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingEvent);

      const url = isEditing
        ? `${API_URL}/${editingEvent.id}`
        : API_URL;

      const method = isEditing
        ? "PUT"
        : "POST";

      /*
        Always use FormData.

        This allows:
        - normal event data
        - optional image
        - cropped image upload
      */

      const formData = new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "slug",
        form.slug
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "event_date",
        form.event_date
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
        "is_published",
        String(
          Boolean(form.is_published)
        )
      );

      formData.append(
        "display_order",
        String(
          Number(
            form.display_order
          ) || 0
        )
      );

      /*
        Keep existing image when editing
        unless a new image is selected.
      */

      if (
        !selectedFile &&
        form.cover_image
      ) {
        formData.append(
          "cover_image",
          form.cover_image
        );
      }

      if (selectedFile) {
        formData.append(
          "image",
          selectedFile,
          selectedFile.name
        );
      }

      const response =
        await fetch(url, {
          method,

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        });

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

        window.location.href =
          "/admin";

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to save event."
        );
      }

      setSuccess(
        isEditing
          ? "Event updated successfully."
          : "Event added successfully."
      );

      setModalOpen(false);

      setEditingEvent(null);

      resetFileSelection();

      setForm({
        ...emptyForm,
      });

      await loadEvents();

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (err) {
      console.error(
        "SAVE EVENT ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save event."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (
    event
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${event.title}" permanently?`
      );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/${event.id}`,
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

        window.location.href =
          "/admin";

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete event."
        );
      }

      setSuccess(
        "Event deleted successfully."
      );

      await loadEvents();

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (err) {
      console.error(
        "DELETE EVENT ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete event."
      );
    }
  };

  /* =========================================================
     PUBLISH / UNPUBLISH
  ========================================================= */

  const togglePublished = async (
    event
  ) => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/${event.id}`,
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
                event.title,

              slug:
                event.slug,

              description:
                event.description,

              event_date:
                event.event_date,

              event_time:
                event.event_time ||
                null,

              location:
                event.location,

              cover_image:
                event.cover_image,

              status:
                event.status,

              is_published:
                !Boolean(
                  event.is_published
                ),

              display_order:
                event.display_order ||
                0,
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

        window.location.href =
          "/admin";

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update event."
        );
      }

      await loadEvents();

      setSuccess(
        event.is_published
          ? "Event unpublished."
          : "Event published."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);

    } catch (err) {
      console.error(
        "PUBLISH EVENT ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update event."
      );
    }
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatEventDate = (
    date
  ) => {
    if (!date) {
      return "—";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return String(date);
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="admin-events-page">

      {/* HEADER */}

      <div className="admin-events-header">

        <div>

          <p className="admin-events-kicker">
            EVENT MANAGEMENT
          </p>

          <h1>
            Organization Events
          </h1>

          <span>
            Create and manage Rudraksh
            events and programs.
          </span>

        </div>

        <button
          className="admin-events-add-button"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Event
        </button>

      </div>


      {/* ALERTS */}

      {error && (
        <div className="admin-events-alert error">

          <AlertCircle size={17} />

          <span>
            {error}
          </span>

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
        <div className="admin-events-alert success">

          <Check size={17} />

          <span>
            {success}
          </span>

        </div>
      )}


      {/* TOOLBAR */}

      <div className="admin-events-toolbar">

        <div className="admin-events-search">

          <Search size={16} />

          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <button
          className="admin-events-refresh"
          onClick={loadEvents}
          disabled={loading}
        >

          <RefreshCw
            size={15}
            className={
              loading
                ? "admin-events-spin"
                : ""
            }
          />

          Refresh

        </button>


        <div className="admin-events-count">

          <CalendarDays size={15} />

          <span>
            {filteredEvents.length} event
            {filteredEvents.length !==
            1
              ? "s"
              : ""}
          </span>

        </div>

      </div>


      {/* CONTENT */}

      {loading ? (

        <div className="admin-events-loading">

          <RefreshCw
            size={25}
            className="admin-events-spin"
          />

          <span>
            Loading events...
          </span>

        </div>

      ) : filteredEvents.length === 0 ? (

        <div className="admin-events-empty">

          <div className="admin-events-empty-icon">
            <CalendarDays size={28} />
          </div>

          <h2>
            {search
              ? "No events found"
              : "No events yet"}
          </h2>

          <p>
            {search
              ? "Try a different search."
              : "Add your first event to get started."}
          </p>

          {!search && (
            <button
              onClick={
                openAddModal
              }
              className="admin-events-add-button"
            >
              <Plus size={17} />
              Add First Event
            </button>
          )}

        </div>

      ) : (

        <div className="admin-events-table-wrap">

          <table className="admin-events-table">

            <thead>

              <tr>

                <th>EVENT</th>
                <th>LOCATION</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>VISIBILITY</th>
                <th>FEATURED</th>
                <th>ACTIONS</th>

              </tr>

            </thead>


            <tbody>

              {filteredEvents.map(
                (event) => (

                  <tr
                    key={event.id}
                  >

                    <td>

                      <div className="admin-event-info">

                        {event.cover_image ? (

                          <img
                            src={getImageUrl(
                              event.cover_image
                            )}
                            alt={
                              event.title
                            }
                            className="admin-event-image"
                            onError={(imageEvent) => {
                              imageEvent.currentTarget.style.display =
                                "none";

                              const placeholder =
                                imageEvent.currentTarget
                                  .nextElementSibling;

                              if (
                                placeholder
                              ) {
                                placeholder.style.display =
                                  "flex";
                              }
                            }}
                          />

                        ) : null}


                        <div
                          className="admin-event-image-placeholder"
                          style={{
                            display:
                              event.cover_image
                                ? "none"
                                : "flex",
                          }}
                        >
                          <CalendarDays
                            size={18}
                          />
                        </div>


                        <div>

                          <strong>
                            {event.title}
                          </strong>

                          <span>
                            /{event.slug}
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>

                      <span className="admin-event-location">

                        <MapPin size={12} />

                        {event.location ||
                          "Not specified"}

                      </span>

                    </td>


                    <td>

                      <span className="admin-event-date">

                        <CalendarDays
                          size={12}
                        />

                        {formatEventDate(
                          event.event_date
                        )}

                      </span>

                    </td>


                    <td>

                      <span
                        className={`admin-event-status ${event.status}`}
                      >
                        {event.status}
                      </span>

                    </td>


                    <td>

                      <button
                        className={`admin-event-published ${
                          event.is_published
                            ? "published"
                            : "hidden"
                        }`}
                        onClick={() =>
                          togglePublished(
                            event
                          )
                        }
                      >

                        {event.is_published ? (
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


                    <td>

                      {event.is_featured ? (

                        <span className="admin-event-featured">

                          <Star
                            size={12}
                            fill="currentColor"
                          />

                          Featured

                        </span>

                      ) : (

                        <span className="admin-event-not-featured">
                          —
                        </span>

                      )}

                    </td>


                    <td>

                      <div className="admin-event-actions">

                        <button
                          className="admin-event-edit"
                          onClick={() =>
                            openEditModal(
                              event
                            )
                          }
                          title="Edit event"
                        >
                          <Pencil
                            size={15}
                          />
                        </button>


                        <button
                          className="admin-event-delete"
                          onClick={() =>
                            handleDelete(
                              event
                            )
                          }
                          title="Delete event"
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


      {/* =====================================================
          MODAL
      ===================================================== */}

      {modalOpen && (

        <div
          className="admin-event-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="admin-event-modal">

            <div className="admin-event-modal-header">

              <div>

                <p>
                  {editingEvent
                    ? "EDIT EVENT"
                    : "NEW EVENT"}
                </p>

                <h2>
                  {editingEvent
                    ? "Edit Event"
                    : "Add Event"}
                </h2>

              </div>


              <button
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                <X size={19} />
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="admin-event-form"
            >

              {/* TITLE */}

              <div className="admin-event-form-group">

                <label>
                  Event Title *
                </label>

                <input
                  name="title"
                  value={
                    form.title
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter event title"
                  required
                />

              </div>


              {/* SLUG */}

              <div className="admin-event-form-group">

                <label>
                  Slug *
                </label>

                <input
                  name="slug"
                  value={
                    form.slug
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="event-slug"
                  required
                />

                <small>
                  Used for the event URL.
                </small>

              </div>


              {/* DESCRIPTION */}

              <div className="admin-event-form-group">

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
                  placeholder="Describe the event..."
                  rows="5"
                />

              </div>


              {/* IMAGE */}

              <div className="admin-event-form-group">

                <label>
                  Event Cover Image
                </label>


                <div className="admin-event-upload-box">

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleFileSelect
                    }
                    hidden
                  />


                  <button
                    type="button"
                    className="admin-event-upload-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={saving}
                  >

                    <Upload
                      size={18}
                    />

                    Choose Image

                  </button>


                  <span className="admin-event-upload-help">
                    JPG, PNG or WEBP • Maximum 5MB
                  </span>

                </div>


                {/* NEW CROPPED PREVIEW */}

                {previewUrl && (

                  <div className="admin-event-image-preview">

                    <img
                      src={previewUrl}
                      alt="Selected event"
                    />

                    <button
                      type="button"
                      onClick={
                        resetFileSelection
                      }
                    >
                      <X size={15} />
                      Remove
                    </button>

                  </div>

                )}


                {/* EXISTING IMAGE */}

                {!previewUrl &&
                  editingEvent &&
                  form.cover_image && (

                    <div className="admin-event-image-preview">

                      <img
                        src={getImageUrl(
                          form.cover_image
                        )}
                        alt="Current event"
                      />

                      <span>
                        Current image
                      </span>

                    </div>

                  )}

              </div>


              {/* DATE + LOCATION */}

              <div className="admin-event-form-row">

                <div className="admin-event-form-group">

                  <label>
                    Event Date
                  </label>

                  <input
                    type="date"
                    name="event_date"
                    value={
                      form.event_date
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>


                <div className="admin-event-form-group">

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

              <div className="admin-event-form-row">

                <div className="admin-event-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
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


                <div className="admin-event-form-group">

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

              <div className="admin-event-options">

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
                            event.target.checked,
                        })
                      )
                    }
                  />

                  <span>
                    Featured event
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
                            event.target.checked,
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

              <div className="admin-event-form-actions">

                <button
                  type="button"
                  className="admin-event-form-cancel"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-event-form-save"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-events-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />

                      {editingEvent
                        ? "Update Event"
                        : "Add Event"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          IMAGE CROPPER
      ===================================================== */}

      {cropperOpen &&
        cropSourceFile && (

          <ImageCropper
            file={
              cropSourceFile
            }
            initialRatio="16:9"
            onApply={
              handleCropApply
            }
            onCancel={
              handleCropCancel
            }
          />

        )}

    </div>
  );
}

export default AdminEvents;