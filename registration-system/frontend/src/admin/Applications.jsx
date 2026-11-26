
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Users,
  Clock,
  Filter,
} from "lucide-react";
import { getAuthToken } from "../api/auth";
import "./Applications.css";

const API_URL = "https://forms-api.rudrakshsocialculturalorganization.online/api";

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const headers = {
    Authorization: `Bearer ${getAuthToken()}`,
  };

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (reviewStatus) params.set("reviewStatus", reviewStatus);

      const response = await fetch(
        `${API_URL}/admin/applications?${params}`,
        { headers }
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/admin");
        throw new Error("Your admin session expired. Please log in again.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load applications.");
      }

      setApplications(data.applications || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, reviewStatus, navigate]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function loadDetails(id) {
    try {
      const response = await fetch(
        `${API_URL}/admin/applications/${id}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load details.");
      }

      setSelected(data.application);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function reviewApplication(action) {
    if (!selected) return;

    if (
      action === "rejected" &&
      !rejectionReason.trim()
    ) {
      window.alert("Please enter a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      action === "approved"
        ? "Are you sure you want to approve this application?"
        : "Are you sure you want to reject this application?"
    );

    if (!confirmed) return;

    try {
      setReviewing(true);

      const response = await fetch(
        `${API_URL}/admin/applications/${selected.id}/review`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason: action === "rejected" ? rejectionReason : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Review failed.");
      }

      window.alert(data.message);
      setSelected(null);
      setRejectionReason("");
      await loadApplications();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setReviewing(false);
    }
  }

  function participant(app) {
    return app.participant || {};
  }

  function performance(app) {
    return app.performance || {};
  }

  function paymentPaid(app) {
    return app.payment_status === "paid";
  }

  function canReview(app) {
    return (
      app.status === "confirmed" &&
      app.review_status === "pending" &&
      paymentPaid(app)
    );
  }

  return (
    <main className="applications-page">
      <header className="applications-header">
        <button
          className="app-back-button"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <span className="app-eyebrow">RUDRAKSH UTSAV 2026</span>
          <h1>Applications</h1>
          <p>Manage participant registrations and reviews.</p>
        </div>

        <button
          className="app-refresh-button"
          onClick={loadApplications}
          disabled={loading}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      <section className="app-stats">
        <article>
          <Users size={23} />
          <div>
            <span>Total applications</span>
            <strong>{pagination.total ?? 0}</strong>
          </div>
        </article>

        <article>
          <Clock size={23} />
          <div>
            <span>Pending review</span>
            <strong>
              {applications.filter(
                (a) => a.review_status === "pending"
              ).length}
            </strong>
          </div>
        </article>

        <article>
          <CheckCircle size={23} />
          <div>
            <span>Approved on this page</span>
            <strong>
              {applications.filter(
                (a) => a.review_status === "approved"
              ).length}
            </strong>
          </div>
        </article>
      </section>

      <section className="app-toolbar">
        <div className="app-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name, application number, email..."
          />
        </div>

        <div className="app-filter">
          <Filter size={17} />
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All application statuses</option>
            <option value="submitted">Submitted</option>
            <option value="pending_payment">Pending payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="app-filter">
          <select
            value={reviewStatus}
            onChange={(e) => {
              setPage(1);
              setReviewStatus(e.target.value);
            }}
          >
            <option value="">All review statuses</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      {error && <div className="app-error">{error}</div>}

      <section className="app-table-section">
        {loading ? (
          <div className="app-empty">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="app-empty">
            <Users size={38} />
            <h3>No applications found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Participant</th>
                  <th>Competition</th>
                  <th>Payment</th>
                  <th>Review</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.application_number}</strong>
                    </td>

                    <td>
                      <strong>{app.applicant_name}</strong>
                      <small>{app.applicant_phone}</small>
                      <small>{app.applicant_email}</small>
                    </td>

                    <td>
                      <strong>
                        {performance(app).category || "—"}
                      </strong>
                      <small>
                        {performance(app).option || ""}
                      </small>
                      <small>
                        {performance(app).group || ""}
                      </small>
                    </td>

                    <td>
                      <span className={`app-badge ${paymentPaid(app) ? "paid" : "unpaid"}`}>
                        {app.payment_status || "No payment"}
                      </span>
                      {app.payment_amount != null && (
                        <small>
                          ₹{Number(app.payment_amount).toFixed(2)}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className={`app-badge ${app.review_status}`}>
                        {app.review_status || "pending"}
                      </span>
                    </td>

                    <td>
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td>
                      <button
                        className="app-view-button"
                        onClick={() => loadDetails(app.id)}
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="app-pagination">
        <span>
          Page {pagination.page || 1} of {pagination.totalPages || 1}
          {" · "}
          {pagination.total || 0} applications
        </span>

        <div>
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <button
            disabled={
              page >= (pagination.totalPages || 1) || loading
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </footer>

      {selected && (
        <div
          className="app-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section className="app-modal">
            <header>
              <div>
                <span className="app-eyebrow">APPLICATION DETAILS</span>
                <h2>{selected.applicant_name}</h2>
                <p>{selected.application_number}</p>
              </div>

              <button
                className="app-close-button"
                onClick={() => setSelected(null)}
              >
                <X size={22} />
              </button>
            </header>

            {participant(selected).photo && (
              <img
                className="app-participant-photo"
                src={`${API_URL.replace("/api", "")}/${participant(selected).photo}`}
                alt="Participant"
              />
            )}

            <div className="app-detail-grid">
              <Detail label="School / Institution" value={participant(selected).schoolName} />
              <Detail label="Parent / Guardian" value={participant(selected).guardianName} />
              <Detail label="Phone" value={selected.applicant_phone} />
              <Detail label="Email" value={selected.applicant_email} />
              <Detail label="Date of Birth" value={participant(selected).dateOfBirth} />
              <Detail label="Address" value={participant(selected).address} />
              <Detail label="Competition" value={performance(selected).category} />
              <Detail label="Performance" value={performance(selected).option} />
              <Detail label="Group" value={performance(selected).group} />
              <Detail label="Payment" value={selected.payment_status} />
              <Detail label="Application status" value={selected.status} />
              <Detail label="Review status" value={selected.review_status} />
              <Detail label="Razorpay Order ID" value={selected.gateway_order_id} />
              <Detail label="Razorpay Payment ID" value={selected.gateway_payment_id} />
            </div>

            {selected.rejection_reason && (
              <div className="app-rejection-note">
                **Rejection reason:** {selected.rejection_reason}
              </div>
            )}

            {canReview(selected) ? (
              <div className="app-review-actions">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required only when rejecting)"
                />

                <div>
                  <button
                    className="app-approve-button"
                    disabled={reviewing}
                    onClick={() => reviewApplication("approved")}
                  >
                    <CheckCircle size={17} />
                    {reviewing ? "Please wait..." : "Approve"}
                  </button>

                  <button
                    className="app-reject-button"
                    disabled={reviewing || !rejectionReason.trim()}
                    onClick={() => reviewApplication("rejected")}
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="app-review-notice">
                {selected.review_status !== "pending"
                  ? `This application has been ${selected.review_status}.`
                  : "Review is available only after verified payment."}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="app-detail">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default Applications;
