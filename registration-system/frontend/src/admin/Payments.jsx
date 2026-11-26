
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAuthToken } from "../api/auth";
import "./Payments.css";

const API_URL = "http://localhost:5001/api";

const money = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
};

const statusClass = (status) =>
  `payment-status ${String(status || "unknown").toLowerCase()}`;

export default function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    totalPages: 1,
  });
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const headers = {
    Authorization: `Bearer ${getAuthToken()}`,
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);

      const response = await fetch(
        `${API_URL}/admin/payments?${params.toString()}`,
        { headers }
      );

      if (response.status === 401) {
        navigate("/admin");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load payments.");
      }

      setPayments(data.payments || []);
      setPagination(
        data.pagination || { total: 0, limit: 20, totalPages: 1 }
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, navigate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const openDetails = async (id) => {
    setSelected(null);
    setDetailLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/payments/${id}`,
        { headers }
      );

      if (response.status === 401) {
        navigate("/admin");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load payment details.");
      }

      setSelected(data.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const changeSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const currentTotal = pagination.total || 0;

  return (
    <main className="payments-page">
      <header className="payments-header">
        <div>
          <span className="payments-eyebrow">RUDRAKSH UTSAV 2026</span>
          <h1>Payment Management</h1>
          <p>View and monitor participant payment transactions.</p>
        </div>

        <button
          className="payments-refresh"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="payment-overview">
        <div className="payment-overview-card">
          <span>Total Transactions</span>
          <strong>{currentTotal}</strong>
          <CreditCard size={22} />
        </div>

        <div className="payment-overview-card">
          <span>Current Page</span>
          <strong>{payments.length}</strong>
          <Eye size={22} />
        </div>
      </section>

      <section className="payments-panel">
        <div className="payments-toolbar">
          <div className="payments-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search application, name, email, order ID..."
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            aria-label="Filter payment status"
          >
            <option value="">All payment statuses</option>
            <option value="created">Created</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {error && <div className="payments-error">{error}</div>}

        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Participant</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Gateway</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>
                        {payment.application_number || `Payment #${payment.id}`}
                      </strong>
                    </td>

                    <td>
                      <strong>{payment.applicant_name || "—"}</strong>
                      <small>{payment.applicant_email || "—"}</small>
                    </td>

                    <td className="payment-amount">
                      {money(payment.amount, payment.currency)}
                    </td>

                    <td>
                      <span className={statusClass(payment.status)}>
                        {payment.status}
                      </span>
                    </td>

                    <td>{payment.gateway || "—"}</td>

                    <td>{dateTime(payment.created_at)}</td>

                    <td>
                      <button
                        className="payment-view-btn"
                        onClick={() => openDetails(payment.id)}
                        aria-label={`View payment ${payment.id}`}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="payments-pagination">
          <span>
            {currentTotal} transaction(s) · Page {page} of{" "}
            {Math.max(1, pagination.totalPages || 1)}
          </span>

          <div>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(pagination.totalPages || 1, p + 1)
                )
              }
              disabled={page >= (pagination.totalPages || 1) || loading}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>

      {detailLoading && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal">
            <p>Loading payment details...</p>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="payment-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div>
                <span>TRANSACTION DETAILS</span>
                <h2>Payment #{selected.id}</h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="payment-modal-body">
              <div className="payment-detail-highlight">
                <span>Transaction Amount</span>
                <strong>
                  {money(selected.amount, selected.currency)}
                </strong>
                <span className={statusClass(selected.status)}>
                  {selected.status}
                </span>
              </div>

              <h3>Participant Information</h3>

              <div className="payment-detail-grid">
                <div>
                  <span>Application Number</span>
                  <strong>{selected.application_number || "—"}</strong>
                </div>

                <div>
                  <span>Participant Name</span>
                  <strong>{selected.applicant_name || "—"}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{selected.applicant_email || "—"}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{selected.applicant_phone || "—"}</strong>
                </div>

                <div>
                  <span>Application Status</span>
                  <strong>{selected.application_status || "—"}</strong>
                </div>

                <div>
                  <span>Review Status</span>
                  <strong>{selected.review_status || "—"}</strong>
                </div>
              </div>

              <h3>Gateway Information</h3>

              <div className="payment-detail-grid">
                <div>
                  <span>Gateway</span>
                  <strong>{selected.gateway || "—"}</strong>
                </div>

                <div>
                  <span>Currency</span>
                  <strong>{selected.currency || "INR"}</strong>
                </div>

                <div>
                  <span>Gateway Order ID</span>
                  <strong className="payment-id">
                    {selected.gateway_order_id || "—"}
                  </strong>
                </div>

                <div>
                  <span>Gateway Payment ID</span>
                  <strong className="payment-id">
                    {selected.gateway_payment_id || "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Created At</span>
                  <strong>{dateTime(selected.created_at)}</strong>
                </div>

                <div>
                  <span>Last Updated</span>
                  <strong>{dateTime(selected.updated_at)}</strong>
                </div>
              </div>

              <p className="payment-readonly-note">
                <CheckCircle size={15} />
                Transaction details are read-only. Payment records are not
                manually editable here.
              </p>
            </div>

            <div className="payment-modal-footer">
              <button onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
