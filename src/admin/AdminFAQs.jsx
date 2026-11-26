import { useEffect, useState } from "react";
import {
  CircleHelp,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import "./AdminFAQs.css";
import { BACKEND_URL } from "../config/api";

const API_URL = `${BACKEND_URL}/api/faqs`;

function AdminFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    question: "",
    answer: "",
    display_order: 0,
    is_published: 1,
  });

  const getToken = () => {
    return localStorage.getItem(
      "rudraksh_admin_token"
    );
  };

  /*
  ==================================================
  LOAD FAQs
  ==================================================
  */

  const loadFAQs = async () => {
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
            "Unable to load FAQs."
        );
      }

      setFaqs(data.faqs || []);
    } catch (err) {
      console.error(
        "ADMIN FAQ LOAD ERROR:",
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
    loadFAQs();
  }, []);

  /*
  ==================================================
  FORM
  ==================================================
  */

  const resetForm = () => {
    setForm({
      question: "",
      answer: "",
      display_order: 0,
      is_published: 1,
    });

    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setSuccess("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingId(faq.id);

    setForm({
      question: faq.question || "",
      answer: faq.answer || "",
      display_order:
        faq.display_order ?? 0,
      is_published:
        Number(faq.is_published) === 1
          ? 1
          : 0,
    });

    setSuccess("");
    setError("");
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

  const handlePublishedChange = () => {
    setForm((previous) => ({
      ...previous,
      is_published:
        Number(previous.is_published) === 1
          ? 0
          : 1,
    }));
  };

  /*
  ==================================================
  SAVE FAQ
  ==================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    if (!form.question.trim()) {
      setError("Question is required.");
      return;
    }

    if (!form.answer.trim()) {
      setError("Answer is required.");
      return;
    }

    if (form.question.trim().length > 500) {
      setError(
        "Question cannot exceed 500 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        display_order: Number(
          form.display_order
        ) || 0,
        is_published:
          Number(form.is_published) === 1
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
            "Unable to save FAQ."
        );
      }

      setSuccess(
        editingId
          ? "FAQ updated successfully."
          : "FAQ created successfully."
      );

      setModalOpen(false);
      resetForm();

      await loadFAQs();
    } catch (err) {
      console.error(
        "ADMIN FAQ SAVE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save FAQ."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ==================================================
  DELETE FAQ
  ==================================================
  */

  const handleDelete = async (faq) => {
    const confirmed = window.confirm(
      `Delete this FAQ?\n\n"${faq.question}"`
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
        `${API_URL}/${faq.id}`,
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
            "Unable to delete FAQ."
        );
      }

      setSuccess(
        "FAQ deleted successfully."
      );

      await loadFAQs();
    } catch (err) {
      console.error(
        "ADMIN FAQ DELETE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete FAQ."
      );
    }
  };

  /*
  ==================================================
  QUICK PUBLISH TOGGLE
  ==================================================
  */

  const togglePublished = async (faq) => {
    const token = getToken();

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${faq.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_published:
              Number(faq.is_published) === 1
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
            "Unable to update FAQ."
        );
      }

      await loadFAQs();
    } catch (err) {
      console.error(
        "FAQ PUBLISH TOGGLE ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update FAQ."
      );
    }
  };

  return (
    <div className="admin-faq-page">
      {/* =========================================
          HEADER
      ========================================== */}

      <header className="admin-faq-header">
        <div className="admin-faq-header-left">
          <div className="admin-faq-icon">
            <CircleHelp size={24} />
          </div>

          <div>
            <span className="admin-faq-eyebrow">
              CONTENT MANAGEMENT
            </span>

            <h1>Frequently Asked Questions</h1>

            <p>
              Manage the FAQs displayed on the
              Rudraksh website.
            </p>
          </div>
        </div>

        <div className="admin-faq-header-actions">
          <button
            className="admin-faq-refresh"
            onClick={loadFAQs}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "admin-faq-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            className="admin-faq-add"
            onClick={openAddModal}
          >
            <Plus size={17} />

            Add FAQ
          </button>
        </div>
      </header>

      {/* =========================================
          MESSAGES
      ========================================== */}

      {error && (
        <div className="admin-faq-alert admin-faq-error">
          {error}

          <button
            onClick={() => setError("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-faq-alert admin-faq-success">
          {success}

          <button
            onClick={() => setSuccess("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =========================================
          STATS
      ========================================== */}

      <section className="admin-faq-stats">
        <div className="admin-faq-stat-card">
          <span>Total FAQs</span>
          <strong>{faqs.length}</strong>
        </div>

        <div className="admin-faq-stat-card">
          <span>Published</span>
          <strong>
            {
              faqs.filter(
                (faq) =>
                  Number(
                    faq.is_published
                  ) === 1
              ).length
            }
          </strong>
        </div>

        <div className="admin-faq-stat-card">
          <span>Hidden</span>
          <strong>
            {
              faqs.filter(
                (faq) =>
                  Number(
                    faq.is_published
                  ) !== 1
              ).length
            }
          </strong>
        </div>
      </section>

      {/* =========================================
          FAQ LIST
      ========================================== */}

      <main className="admin-faq-content">
        {loading ? (
          <div className="admin-faq-empty">
            <RefreshCw
              size={24}
              className="admin-faq-spin"
            />

            <p>Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="admin-faq-empty">
            <CircleHelp size={40} />

            <h2>No FAQs yet</h2>

            <p>
              Add your first frequently asked
              question.
            </p>

            <button
              className="admin-faq-add"
              onClick={openAddModal}
            >
              <Plus size={17} />
              Add First FAQ
            </button>
          </div>
        ) : (
          <div className="admin-faq-list">
            {faqs.map((faq, index) => (
              <article
                className="admin-faq-card"
                key={faq.id}
              >
                <div className="admin-faq-card-top">
                  <div className="admin-faq-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="admin-faq-card-content">
                    <div className="admin-faq-card-meta">
                      <span>
                        Order:{" "}
                        {faq.display_order}
                      </span>

                      <span
                        className={
                          Number(
                            faq.is_published
                          ) === 1
                            ? "faq-status-published"
                            : "faq-status-hidden"
                        }
                      >
                        {Number(
                          faq.is_published
                        ) === 1 ? (
                          <>
                            <Eye size={13} />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} />
                            Hidden
                          </>
                        )}
                      </span>
                    </div>

                    <h2>{faq.question}</h2>

                    <p>{faq.answer}</p>
                  </div>
                </div>

                <div className="admin-faq-card-actions">
                  <button
                    className="faq-action-publish"
                    onClick={() =>
                      togglePublished(faq)
                    }
                  >
                    {Number(
                      faq.is_published
                    ) === 1 ? (
                      <>
                        <EyeOff size={15} />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Publish
                      </>
                    )}
                  </button>

                  <button
                    className="faq-action-edit"
                    onClick={() =>
                      openEditModal(faq)
                    }
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    className="faq-action-delete"
                    onClick={() =>
                      handleDelete(faq)
                    }
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* =========================================
          MODAL
      ========================================== */}

      {modalOpen && (
        <div
          className="admin-faq-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="admin-faq-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-faq-modal-header">
              <div>
                <span>
                  {editingId
                    ? "EDIT FAQ"
                    : "NEW FAQ"}
                </span>

                <h2>
                  {editingId
                    ? "Update FAQ"
                    : "Create FAQ"}
                </h2>
              </div>

              <button
                className="admin-faq-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="admin-faq-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>Question *</span>

                <input
                  type="text"
                  name="question"
                  value={form.question}
                  onChange={handleChange}
                  maxLength={500}
                  placeholder="Enter the frequently asked question"
                  disabled={saving}
                />

                <small>
                  {form.question.length}/500
                </small>
              </label>

              <label>
                <span>Answer *</span>

                <textarea
                  name="answer"
                  value={form.answer}
                  onChange={handleChange}
                  rows={7}
                  placeholder="Enter the answer"
                  disabled={saving}
                />
              </label>

              <div className="admin-faq-form-row">
                <label>
                  <span>Display Order</span>

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

                <div className="admin-faq-publish-field">
                  <span>Visibility</span>

                  <button
                    type="button"
                    className={
                      Number(
                        form.is_published
                      ) === 1
                        ? "faq-visibility-on"
                        : "faq-visibility-off"
                    }
                    onClick={
                      handlePublishedChange
                    }
                    disabled={saving}
                  >
                    {Number(
                      form.is_published
                    ) === 1 ? (
                      <>
                        <Eye size={16} />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} />
                        Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="admin-faq-form-actions">
                <button
                  type="button"
                  className="faq-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="faq-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="admin-faq-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId
                        ? "Update FAQ"
                        : "Create FAQ"}
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

export default AdminFAQs;