import React, { useEffect, useState } from "react";
import "./AdminMessages.css";

const API_URL = "http://localhost:5000/api/contact";

function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem(
    "rudraksh_admin_token"
  );

  // ============================================================
  // FETCH MESSAGES
  // ============================================================

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError(
          "Admin authentication required. Please login again."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch messages."
        );
      }

      setMessages(data.messages || []);
    } catch (error) {
      console.error(
        "FETCH MESSAGES ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // ============================================================
  // UPDATE MESSAGE STATUS
  // ============================================================

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update message."
        );
      }

      setMessages((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                replied_at:
                  status === "replied"
                    ? new Date().toISOString()
                    : item.replied_at,
              }
            : item
        )
      );

      if (
        selectedMessage &&
        selectedMessage.id === id
      ) {
        setSelectedMessage(
          (previous) => ({
            ...previous,
            status,
            replied_at:
              status === "replied"
                ? new Date().toISOString()
                : previous.replied_at,
          })
        );
      }
    } catch (error) {
      console.error(
        "UPDATE MESSAGE ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to update message."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // DELETE MESSAGE
  // ============================================================

  const deleteMessage = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this message?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(id);
      setError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete message."
        );
      }

      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== id
        )
      );

      if (
        selectedMessage &&
        selectedMessage.id === id
      ) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error(
        "DELETE MESSAGE ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to delete message."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // OPEN MESSAGE
  // ============================================================

  const openMessage = async (message) => {
    setSelectedMessage(message);

    if (message.status === "unread") {
      await updateStatus(
        message.id,
        "read"
      );
    }
  };

  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "unread":
        return "status-unread";

      case "read":
        return "status-read";

      case "replied":
        return "status-replied";

      case "archived":
        return "status-archived";

      default:
        return "";
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const unreadCount =
    messages.filter(
      (item) => item.status === "unread"
    ).length;

  const readCount =
    messages.filter(
      (item) => item.status === "read"
    ).length;

  const repliedCount =
    messages.filter(
      (item) => item.status === "replied"
    ).length;

  const archivedCount =
    messages.filter(
      (item) => item.status === "archived"
    ).length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-messages-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-messages-header">

        <div>
          <span className="admin-messages-eyebrow">
            RUDRAKSH ADMIN
          </span>

          <h1>Messages</h1>

          <p>
            Manage contact messages received
            from the Rudraksh website.
          </p>
        </div>

        <button
          className="messages-refresh-btn"
          onClick={fetchMessages}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="messages-error">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="messages-stats">

        <div className="message-stat-card">
          <span className="stat-icon">✉</span>

          <div>
            <strong>
              {messages.length}
            </strong>

            <span>Total</span>
          </div>
        </div>

        <div className="message-stat-card unread-card">
          <span className="stat-icon">●</span>

          <div>
            <strong>
              {unreadCount}
            </strong>

            <span>Unread</span>
          </div>
        </div>

        <div className="message-stat-card">
          <span className="stat-icon">✓</span>

          <div>
            <strong>
              {readCount}
            </strong>

            <span>Read</span>
          </div>
        </div>

        <div className="message-stat-card">
          <span className="stat-icon">↗</span>

          <div>
            <strong>
              {repliedCount}
            </strong>

            <span>Replied</span>
          </div>
        </div>

        <div className="message-stat-card">
          <span className="stat-icon">□</span>

          <div>
            <strong>
              {archivedCount}
            </strong>

            <span>Archived</span>
          </div>
        </div>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="messages-panel">

        <div className="messages-panel-header">

          <div>
            <h2>Contact Inbox</h2>

            <span>
              {messages.length}{" "}
              {messages.length === 1
                ? "message"
                : "messages"}
            </span>
          </div>

        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div className="messages-loading">
            <div className="messages-spinner"></div>

            <p>
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">

            <div className="empty-icon">
              ✉
            </div>

            <h3>
              No messages yet
            </h3>

            <p>
              Messages submitted through
              the website contact form will
              appear here.
            </p>

          </div>
        ) : (

          /* ==================================================
             MESSAGE LIST
          ================================================== */

          <div className="messages-list">

            {messages.map((message) => (

              <div
                key={message.id}
                className={`message-row ${
                  message.status === "unread"
                    ? "message-unread"
                    : ""
                }`}
              >

                <div
                  className="message-main"
                  onClick={() =>
                    openMessage(message)
                  }
                >

                  <div className="message-avatar">
                    {message.name
                      ? message.name
                          .charAt(0)
                          .toUpperCase()
                      : "?"}
                  </div>

                  <div className="message-info">

                    <div className="message-top-line">

                      <h3>
                        {message.name}
                      </h3>

                      <span
                        className={`message-status ${getStatusClass(
                          message.status
                        )}`}
                      >
                        {message.status}
                      </span>

                    </div>

                    <p className="message-subject">
                      {message.subject ||
                        "No subject"}
                    </p>

                    <p className="message-preview">
                      {message.message}
                    </p>

                    <div className="message-meta">

                      {message.email && (
                        <span>
                          ✉{" "}
                          {message.email}
                        </span>
                      )}

                      {message.phone && (
                        <span>
                          ☎{" "}
                          {message.phone}
                        </span>
                      )}

                      <span>
                        {formatDate(
                          message.created_at
                        )}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="message-actions">

                  {message.status !==
                    "read" &&
                    message.status !==
                      "replied" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            message.id,
                            "read"
                          )
                        }
                        disabled={
                          updatingId ===
                          message.id
                        }
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}

                  {message.status !==
                    "replied" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          message.id,
                          "replied"
                        )
                      }
                      disabled={
                        updatingId ===
                        message.id
                      }
                      title="Mark as replied"
                    >
                      ↗
                    </button>
                  )}

                  {message.status !==
                    "archived" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          message.id,
                          "archived"
                        )
                      }
                      disabled={
                        updatingId ===
                        message.id
                      }
                      title="Archive"
                    >
                      □
                    </button>
                  )}

                  <button
                    className="delete-message-btn"
                    onClick={() =>
                      deleteMessage(
                        message.id
                      )
                    }
                    disabled={
                      updatingId ===
                      message.id
                    }
                    title="Delete message"
                  >
                    ×
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

      {/* ======================================================
          MESSAGE DETAILS MODAL
      ====================================================== */}

      {selectedMessage && (
        <div
          className="message-modal-overlay"
          onClick={() =>
            setSelectedMessage(null)
          }
        >

          <div
            className="message-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="message-modal-header">

              <div>
                <span className="modal-eyebrow">
                  CONTACT MESSAGE
                </span>

                <h2>
                  {selectedMessage.subject ||
                    "No subject"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedMessage(null)
                }
              >
                ×
              </button>

            </div>

            <div className="message-modal-body">

              <div className="sender-block">

                <div className="modal-avatar">
                  {selectedMessage.name
                    ?.charAt(0)
                    .toUpperCase() || "?"}
                </div>

                <div>
                  <h3>
                    {selectedMessage.name}
                  </h3>

                  {selectedMessage.email && (
                    <p>
                      {selectedMessage.email}
                    </p>
                  )}

                  {selectedMessage.phone && (
                    <p>
                      {selectedMessage.phone}
                    </p>
                  )}
                </div>

              </div>

              <div className="modal-divider"></div>

              <div className="full-message">

                <span>MESSAGE</span>

                <p>
                  {selectedMessage.message}
                </p>

              </div>

              <div className="message-details-grid">

                <div>
                  <span>Status</span>

                  <strong
                    className={`message-status ${getStatusClass(
                      selectedMessage.status
                    )}`}
                  >
                    {selectedMessage.status}
                  </strong>
                </div>

                <div>
                  <span>Received</span>

                  <strong>
                    {formatDate(
                      selectedMessage.created_at
                    )}
                  </strong>
                </div>

                {selectedMessage.replied_at && (
                  <div>
                    <span>Replied</span>

                    <strong>
                      {formatDate(
                        selectedMessage.replied_at
                      )}
                    </strong>
                  </div>
                )}

              </div>

            </div>

            <div className="message-modal-footer">

              {selectedMessage.email && (
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="modal-action primary"
                >
                  ✉ Reply by Email
                </a>
              )}

              {selectedMessage.phone && (
                <a
                  href={`tel:${selectedMessage.phone}`}
                  className="modal-action"
                >
                  ☎ Call
                </a>
              )}

              {selectedMessage.status !==
                "replied" && (
                <button
                  className="modal-action"
                  onClick={() =>
                    updateStatus(
                      selectedMessage.id,
                      "replied"
                    )
                  }
                  disabled={
                    updatingId ===
                    selectedMessage.id
                  }
                >
                  ↗ Mark Replied
                </button>
              )}

              <button
                className="modal-action danger"
                onClick={() =>
                  deleteMessage(
                    selectedMessage.id
                  )
                }
                disabled={
                  updatingId ===
                  selectedMessage.id
                }
              >
                🗑 Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminMessages;