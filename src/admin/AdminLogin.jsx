import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { ADMIN_API_URL } from "../config/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim() || !formData.password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${ADMIN_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to login. Please try again."
        );
      }

      // Store authentication information locally.
      localStorage.setItem("rudraksh_admin_token", data.token);
      localStorage.setItem(
        "rudraksh_admin",
        JSON.stringify(data.admin)
      );

      // Go to the admin dashboard.
      navigate("/admin/dashboard");
    } catch (loginError) {
      console.error("ADMIN LOGIN ERROR:", loginError);

      setError(
        loginError.message ||
          "Unable to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-background">
        <div className="admin-glow admin-glow-one"></div>
        <div className="admin-glow admin-glow-two"></div>
      </div>

      <main className="admin-login-container">
        <section className="admin-login-card">
          {/* Header */}
          <div className="admin-login-header">
            <div className="admin-logo">
              R
            </div>

            <p className="admin-panel-label">
              RUDRAKSH
            </p>

            <h1>Admin Panel</h1>

            <p className="admin-login-subtitle">
              Secure administrator access
            </p>
          </div>

          {/* Login Form */}
          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter admin username"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="admin-password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="admin-login-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="admin-security-notice">
            <div className="admin-security-icon">
              🔒
            </div>

            <div>
              <h3>Protected System</h3>

              <p>
                This backend server and database are
                the sole property of{" "}
                <strong>
                  Prantik Chakrabarty
                </strong>
                .
              </p>

              <p>
                Do not modify, delete, replace, or
                restructure backend files, database
                tables, API configurations, or system
                settings without proper prior notice
                and authorization.
              </p>

              <p>
                Unauthorized changes may cause API
                failures, data loss, authentication
                problems, or other system-wide errors.
              </p>
            </div>
          </div>

          <div className="admin-login-footer">
            <span>
              Rudraksh Social & Cultural Organization
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminLogin;