import { useEffect, useMemo, useState } from "react";

import {
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  FileText,
} from "lucide-react";

import "./AdminMemberships.css";
import { BACKEND_URL } from "../config/api";

const API_URL = `${BACKEND_URL}/api/memberships`;

function AdminMemberships() {
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [reviewStatus, setReviewStatus] =
    useState("pending");

  const [adminNotes, setAdminNotes] = useState("");

  /* ==========================================================
     TOKEN
  ========================================================== */

  const getToken = () => {
    return localStorage.getItem(
      "rudraksh_admin_token"
    );
  };

  /* ==========================================================
     AUTH REDIRECT
  ========================================================== */

  const handleUnauthorized = () => {
    localStorage.removeItem(
      "rudraksh_admin_token"
    );

    localStorage.removeItem(
      "rudraksh_admin"
    );

    window.location.href = "/admin";
  };

  /* ==========================================================
     IMAGE URL
  ========================================================== */

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    return `${BACKEND_URL}${imageUrl}`;
  };

  /* ==========================================================
     LOAD APPLICATIONS
  ========================================================== */

  const loadApplications = async () => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load joining requests."
        );
      }

      setApplications(
        data.applications || []
      );
    } catch (err) {
      console.error(
        "LOAD MEMBERSHIP ERROR:",
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

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadApplications();
  }, []);

  /* ==========================================================
     FILTER APPLICATIONS
  ========================================================== */

  const filteredApplications = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return applications.filter(
      (application) => {
        const matchesSearch =
          !query ||
          application.full_name
            ?.toLowerCase()
            .includes(query) ||
          application.email
            ?.toLowerCase()
            .includes(query) ||
          application.phone
            ?.toLowerCase()
            .includes(query) ||
          application.occupation
            ?.toLowerCase()
            .includes(query) ||
          String(application.id)
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          application.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    applications,
    search,
    statusFilter,
  ]);

  /* ==========================================================
     OPEN APPLICATION
  ========================================================== */

  const openApplication = (
    application
  ) => {
    setSelectedApplication(
      application
    );

    setReviewStatus(
      application.status ||
        "pending"
    );

    setAdminNotes(
      application.admin_notes ||
        ""
    );

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setSelectedApplication(null);

    setAdminNotes("");

    setReviewStatus("pending");
  };

  /* ==========================================================
     REVIEW APPLICATION
  ========================================================== */

  const handleReview = async () => {
    const token = getToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!selectedApplication) {
      return;
    }

    if (
      ![
        "pending",
        "approved",
        "rejected",
      ].includes(reviewStatus)
    ) {
      setError(
        "Invalid application status."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${selectedApplication.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: reviewStatus,

            admin_notes:
              adminNotes.trim() ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update joining request."
        );
      }

      setSuccess(
        "Joining request updated successfully."
      );

      setModalOpen(false);

      setSelectedApplication(null);

      await loadApplications();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "REVIEW MEMBERSHIP ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to update joining request."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     STATUS COUNTS
  ========================================================== */

  const pendingCount =
    applications.filter(
      (item) =>
        item.status === "pending"
    ).length;

  const approvedCount =
    applications.filter(
      (item) =>
        item.status === "approved"
    ).length;

  const rejectedCount =
    applications.filter(
      (item) =>
        item.status === "rejected"
    ).length;

  /* ==========================================================
     DATE FORMAT
  ========================================================== */

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ==========================================================
     TIME FORMAT
  ========================================================== */

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="admin-memberships-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-memberships-header">

        <div>
          <p className="admin-memberships-kicker">
            JOINING REQUESTS
          </p>

          <h1>
            New Member Applications
          </h1>

          <span>
            Review and manage people who
            have requested to join Rudraksh.
          </span>
        </div>

        <button
          className="admin-memberships-refresh"
          onClick={loadApplications}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "admin-memberships-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="admin-memberships-alert error">

          <AlertCircle size={17} />

          <span>
            {error}
          </span>

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
        <div className="admin-memberships-alert success">

          <Check size={17} />

          <span>
            {success}
          </span>

        </div>
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="admin-memberships-stats">

        <button
          type="button"
          className={
            statusFilter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("all")
          }
        >
          <span>
            Total
          </span>

          <strong>
            {applications.length}
          </strong>
        </button>

        <button
          type="button"
          className={
            statusFilter === "pending"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("pending")
          }
        >
          <span>
            Pending
          </span>

          <strong>
            {pendingCount}
          </strong>
        </button>

        <button
          type="button"
          className={
            statusFilter === "approved"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("approved")
          }
        >
          <span>
            Approved
          </span>

          <strong>
            {approvedCount}
          </strong>
        </button>

        <button
          type="button"
          className={
            statusFilter === "rejected"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("rejected")
          }
        >
          <span>
            Rejected
          </span>

          <strong>
            {rejectedCount}
          </strong>
        </button>

      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="admin-memberships-toolbar">

        <div className="admin-memberships-search">

          <Search size={16} />

          <input
            type="text"
            placeholder="Search name, email, phone or ID..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        <div className="admin-memberships-result-count">
          {filteredApplications.length}{" "}
          application
          {filteredApplications.length !==
          1
            ? "s"
            : ""}
        </div>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {loading ? (
        <div className="admin-memberships-loading">

          <RefreshCw
            size={26}
            className="admin-memberships-spin"
          />

          <span>
            Loading joining requests...
          </span>

        </div>
      ) : filteredApplications.length ===
        0 ? (
        <div className="admin-memberships-empty">

          <div className="admin-memberships-empty-icon">
            <UserPlus size={28} />
          </div>

          <h2>
            {search ||
            statusFilter !== "all"
              ? "No applications found"
              : "No joining requests yet"}
          </h2>

          <p>
            {search ||
            statusFilter !== "all"
              ? "Try changing your search or filter."
              : "New member applications will appear here."}
          </p>

        </div>
      ) : (
        <div className="admin-memberships-table-wrap">

          <table className="admin-memberships-table">

            <thead>
              <tr>

                <th>
                  Applicant
                </th>

                <th>
                  Contact
                </th>

                <th>
                  Occupation
                </th>

                <th>
                  Applied
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredApplications.map(
                (application) => (
                  <tr
                    key={
                      application.id
                    }
                  >

                    {/* APPLICANT */}

                    <td>

                      <div className="admin-membership-applicant">

                        <div className="admin-membership-avatar">

                          {application.photo_url ? (
                            <img
                              src={getImageUrl(
                                application.photo_url
                              )}
                              alt={
                                application.full_name ||
                                "Applicant"
                              }
                              className="admin-membership-avatar-image"
                            />
                          ) : (
                            application.full_name
                              ?.charAt(0)
                              .toUpperCase() || (
                              <User size={16} />
                            )
                          )}

                        </div>

                        <div>

                          <strong>
                            {application.full_name ||
                              "Unnamed Applicant"}
                          </strong>

                          <span>
                            Application #
                            {application.id}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* CONTACT */}

                    <td>

                      <div className="admin-membership-contact">

                        {application.phone && (
                          <span>
                            <Phone size={12} />
                            {application.phone}
                          </span>
                        )}

                        {application.email && (
                          <span>
                            <Mail size={12} />
                            {application.email}
                          </span>
                        )}

                      </div>

                    </td>

                    {/* OCCUPATION */}

                    <td>
                      {application.occupation ||
                        "—"}
                    </td>

                    {/* APPLIED */}

                    <td>

                      <span className="admin-membership-date">
                        {formatDate(
                          application.created_at
                        )}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`admin-membership-status ${
                          application.status ||
                          "pending"
                        }`}
                      >
                        {application.status ||
                          "pending"}
                      </span>

                    </td>

                    {/* ACTION */}

                    <td>

                      <button
                        type="button"
                        className="admin-membership-view"
                        onClick={() =>
                          openApplication(
                            application
                          )
                        }
                      >
                        <Eye size={15} />

                        View
                      </button>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      )}

      {/* ======================================================
          APPLICATION DETAILS MODAL
      ====================================================== */}

      {modalOpen &&
        selectedApplication && (
          <div
            className="admin-membership-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >

            <div className="admin-membership-modal">

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="admin-membership-modal-header">

                <div>

                  <p>
                    NEW MEMBER APPLICATION
                  </p>

                  <h2>
                    {
                      selectedApplication.full_name ||
                      "Unnamed Applicant"
                    }
                  </h2>

                  <span className="admin-membership-modal-id">
                    Application #
                    {
                      selectedApplication.id
                    }
                  </span>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close"
                >
                  <X size={19} />
                </button>

              </div>

              {/* =================================================
                  APPLICANT PROFILE
              ================================================= */}

              <div className="admin-membership-profile">

                <div className="admin-membership-profile-photo-wrap">

                  {selectedApplication.photo_url ? (
                    <img
                      src={getImageUrl(
                        selectedApplication.photo_url
                      )}
                      alt={
                        selectedApplication.full_name ||
                        "Applicant"
                      }
                      className="admin-membership-profile-photo"
                    />
                  ) : (
                    <div className="admin-membership-profile-photo-placeholder">
                      <User size={42} />
                    </div>
                  )}

                </div>

                <div className="admin-membership-profile-info">

                  <span>
                    APPLICANT
                  </span>

                  <h3>
                    {
                      selectedApplication.full_name ||
                      "Unnamed Applicant"
                    }
                  </h3>

                  <p>
                    Applied on{" "}
                    {formatDateTime(
                      selectedApplication.created_at
                    )}
                  </p>

                </div>

              </div>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <div className="admin-membership-details">

                <div className="admin-membership-detail">

                  <User size={16} />

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {
                        selectedApplication.full_name ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

                <div className="admin-membership-detail">

                  <Mail size={16} />

                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {
                        selectedApplication.email ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

                <div className="admin-membership-detail">

                  <Phone size={16} />

                  <div>

                    <span>
                      Phone
                    </span>

                    <strong>
                      {
                        selectedApplication.phone ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

                <div className="admin-membership-detail">

                  <CalendarDays size={16} />

                  <div>

                    <span>
                      Date of Birth
                    </span>

                    <strong>
                      {formatDate(
                        selectedApplication.date_of_birth
                      )}
                    </strong>

                  </div>

                </div>

                <div className="admin-membership-detail">

                  <Briefcase size={16} />

                  <div>

                    <span>
                      Occupation
                    </span>

                    <strong>
                      {
                        selectedApplication.occupation ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

                <div className="admin-membership-detail">

                  <MapPin size={16} />

                  <div>

                    <span>
                      Address
                    </span>

                    <strong>
                      {
                        selectedApplication.address ||
                        "—"
                      }
                    </strong>

                  </div>

                </div>

              </div>

              {/* =================================================
                  REASON
              ================================================= */}

              <div className="admin-membership-text-section">

                <div className="admin-membership-text-heading">

                  <FileText size={16} />

                  <span>
                    Reason for Joining
                  </span>

                </div>

                <p>
                  {
                    selectedApplication.reason ||
                    "No reason provided."
                  }
                </p>

              </div>

              {/* =================================================
                  APPLICATION PHOTO
              ================================================= */}

              {selectedApplication.photo_url && (
                <div className="admin-membership-photo">

                  <span>
                    Applicant Photo
                  </span>

                  <img
                    src={getImageUrl(
                      selectedApplication.photo_url
                    )}
                    alt={
                      selectedApplication.full_name ||
                      "Applicant"
                    }
                  />

                </div>
              )}

              {/* =================================================
                  REVIEW
              ================================================= */}

              <div className="admin-membership-review">

                <div className="admin-membership-form-group">

                  <label>
                    Application Status
                  </label>

                  <select
                    value={reviewStatus}
                    onChange={(event) =>
                      setReviewStatus(
                        event.target.value
                      )
                    }
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="approved">
                      Approved
                    </option>

                    <option value="rejected">
                      Rejected
                    </option>

                  </select>

                </div>

                <div className="admin-membership-form-group">

                  <label>
                    Admin Notes
                  </label>

                  <textarea
                    value={adminNotes}
                    onChange={(event) =>
                      setAdminNotes(
                        event.target.value
                      )
                    }
                    placeholder="Add internal notes about this application..."
                    rows="4"
                  />

                </div>

              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="admin-membership-modal-actions">

                <button
                  type="button"
                  className="admin-membership-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-membership-save"
                  onClick={handleReview}
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="admin-memberships-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />

                      Save Review
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default AdminMemberships;