import { useEffect, useState } from "react";
import "./AdminDonations.css";

const API_URL = "http://localhost:5000/api/donations";

function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("rudraksh_admin_token");

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load donations."
        );
      }

      setDonations(data.donations || []);
    } catch (err) {
      console.error("DONATIONS ERROR:", err);
      setError(
        err.message || "Unable to load donations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatAmount = (amount, currency) => {
    const numericAmount = Number(amount);

    if (currency === "INR") {
      return `₹${numericAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${currency || ""} ${numericAmount.toFixed(2)}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-paid";

      case "failed":
        return "status-failed";

      case "refunded":
        return "status-refunded";

      case "pending":
        return "status-pending";

      default:
        return "status-created";
    }
  };

  return (
    <div className="admin-donations-page">
      <div className="admin-donations-header">
        <div>
          <p className="admin-donations-eyebrow">
            RUDRAKSH ADMIN
          </p>

          <h1>Donations</h1>

          <p className="admin-donations-subtitle">
            View and monitor donations received through
            Razorpay.
          </p>
        </div>

        <button
          type="button"
          className="admin-donations-refresh"
          onClick={fetchDonations}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="admin-donations-stats">
        <div className="admin-donation-stat">
          <span>Total Records</span>
          <strong>{donations.length}</strong>
        </div>

        <div className="admin-donation-stat">
          <span>Paid Donations</span>
          <strong>
            {
              donations.filter(
                (donation) =>
                  donation.payment_status === "paid"
              ).length
            }
          </strong>
        </div>

        <div className="admin-donation-stat">
          <span>Successful Amount</span>
          <strong>
            ₹
            {donations
              .filter(
                (donation) =>
                  donation.payment_status === "paid"
              )
              .reduce(
                (total, donation) =>
                  total + Number(donation.amount || 0),
                0
              )
              .toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      <div className="admin-donations-card">
        <div className="admin-donations-card-header">
          <div>
            <h2>Donation Records</h2>
            <p>
              All donation records stored in the database.
            </p>
          </div>
        </div>

        {loading && (
          <div className="admin-donations-state">
            <div className="admin-donations-loader" />
            <p>Loading donations...</p>
          </div>
        )}

        {!loading && error && (
          <div className="admin-donations-state admin-donations-error">
            <strong>Unable to load donations</strong>
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchDonations}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          donations.length === 0 && (
            <div className="admin-donations-state">
              <div className="admin-donations-empty-icon">
                ₹
              </div>

              <h3>No donations yet</h3>

              <p>
                Donations will appear here after users
                make payments.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          donations.length > 0 && (
            <div className="admin-donations-table-wrapper">
              <table className="admin-donations-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment ID</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id}>
                      <td>
                        <div className="admin-donor-cell">
                          <strong>
                            {donation.is_anonymous
                              ? "Anonymous Donor"
                              : donation.donor_name ||
                                "Unknown Donor"}
                          </strong>

                          {donation.is_anonymous ? (
                            <span className="anonymous-badge">
                              ANONYMOUS
                            </span>
                          ) : (
                            <small>
                              {donation.donor_email ||
                                donation.donor_phone ||
                                "No contact details"}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong className="donation-amount">
                          {formatAmount(
                            donation.amount,
                            donation.currency
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`donation-status ${getStatusClass(
                            donation.payment_status
                          )}`}
                        >
                          {donation.payment_status}
                        </span>
                      </td>

                      <td>
                        <span className="payment-id">
                          {donation.razorpay_payment_id ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        {donation.payment_method || "—"}
                      </td>

                      <td>
                        <span className="donation-date">
                          {formatDate(
                            donation.created_at
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

export default AdminDonations;