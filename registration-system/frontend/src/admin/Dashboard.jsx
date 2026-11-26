
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRegistrationForms,
  updateRegistrationStatus,
} from "../api/forms";

function Dashboard() {
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      setLoading(true);
      setError("");

      const response = await getRegistrationForms();
      setForms(response.forms || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load registration forms."
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatus(form) {
    if (form.registration_status) {
      return form.registration_status.toUpperCase();
    }

    if (form.event_status === "cancelled") return "CANCELLED";
    if (form.event_status === "completed") return "COMPLETED";

    if (
      form.event_status === "published" &&
      Number(form.is_active) === 1
    ) {
      return "PUBLISHED";
    }

    return "DRAFT";
  }

  async function changeStatus(form, status) {
    const action = {
      published: "publish",
      closed: "close registration for",
      draft: "move back to draft",
    }[status];

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${form.title}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(form.id);
      setError("");

      await updateRegistrationStatus(form.id, status);

      await loadForms();

      window.alert(
        status === "published"
          ? "Registration published successfully!"
          : status === "closed"
          ? "Registration closed successfully!"
          : "Form moved back to draft."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update registration status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="school-dashboard">
      <header className="school-dashboard-header">
        <h1>🌸 RUDRAKSH ADMIN 🌸</h1>
        <p>Welcome to the Registration Management System!</p>
      </header>

      <section className="dashboard-actions">
        <h2>MY OPTIONS ⭐</h2>

        <button
          className="dashboard-action create-form-button"
          onClick={() => navigate("/admin/forms/new")}
        >
          ➕ CREATE NEW REGISTRATION FORM
        </button>

        <button
          className="dashboard-action applications-button"
          onClick={() => navigate("/admin/applications")}
        >
          📋 VIEW APPLICATIONS
        </button>

        <button
          className="dashboard-action payments-button"
          onClick={() => navigate("/admin/payments")}
        >
          💰 VIEW PAYMENTS
        </button>

        <button
          className="dashboard-action attendance-button"
          onClick={() => navigate("/admin/attendance")}
        >
          ✅ MANAGE ATTENDANCE
        </button>
      </section>

      <section className="dashboard-actions">
        <h2>MANAGE REGISTRATION FORMS 📝</h2>

        <button
          className="dashboard-action create-form-button"
          onClick={loadForms}
          disabled={loading || updatingId !== null}
        >
          🔄 REFRESH FORMS
        </button>

        {error && <p className="dashboard-error">{error}</p>}

        {loading ? (
          <p>Loading saved forms...</p>
        ) : forms.length === 0 ? (
          <p>No registration forms found.</p>
        ) : (
          forms.map((form) => {
            const status = getStatus(form);
            const updating = updatingId === form.id;

            return (
              <article
                key={form.id}
                className="dashboard-form-item"
              >
                <h3>{form.title}</h3>

                <p>
                  Event: {form.event_title || "Utsav"}
                </p>

                <p>Fee: ₹{form.fee}</p>

                <p>
                  Status: <strong>{status}</strong>
                </p>

                <p>Form ID: {form.id}</p>

                <div className="dashboard-form-buttons">
                  {status !== "PUBLISHED" && (
                    <button
                      className="dashboard-action publish-form-button"
                      disabled={updating || updatingId !== null}
                      onClick={() =>
                        changeStatus(form, "published")
                      }
                    >
                      {updating ? "PLEASE WAIT..." : "🟢 PUBLISH"}
                    </button>
                  )}

                  {status === "PUBLISHED" && (
                    <button
                      className="dashboard-action close-form-button"
                      disabled={updating || updatingId !== null}
                      onClick={() =>
                        changeStatus(form, "closed")
                      }
                    >
                      {updating ? "PLEASE WAIT..." : "🔴 CLOSE REGISTRATION"}
                    </button>
                  )}

                  {status === "CLOSED" && (
                    <button
                      className="dashboard-action publish-form-button"
                      disabled={updating || updatingId !== null}
                      onClick={() =>
                        changeStatus(form, "published")
                      }
                    >
                      {updating ? "PLEASE WAIT..." : "🟢 REOPEN REGISTRATION"}
                    </button>
                  )}

                  {status !== "DRAFT" &&
                    status !== "CANCELLED" &&
                    status !== "COMPLETED" && (
                      <button
                        className="dashboard-action draft-form-button"
                        disabled={updating || updatingId !== null}
                        onClick={() =>
                          changeStatus(form, "draft")
                        }
                      >
                        ↩ MOVE TO DRAFT
                      </button>
                    )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

export default Dashboard;
