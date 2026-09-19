import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  Image,
  IndianRupee,
  UserPlus,
  MessageSquare,
  CircleHelp,
  Share2,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  ChevronRight,
  RefreshCw,
  MonitorCog,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import "./AdminDashboard.css";
import "./AdminDashboardStats.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [activeItem, setActiveItem] =
    useState("Dashboard");

  const [statistics, setStatistics] =
    useState({
      members: 0,
      projects: 0,
      events: 0,
      gallery: 0,
    });

  const [loadingStats, setLoadingStats] =
    useState(true);

  const [statsError, setStatsError] =
    useState("");

  /* =========================================================
     ADMIN DATA
  ========================================================= */

  const adminData = localStorage.getItem(
    "rudraksh_admin"
  );

  let admin = null;

  try {
    admin = adminData
      ? JSON.parse(adminData)
      : null;
  } catch {
    admin = null;
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "rudraksh_admin_token"
    );

    localStorage.removeItem(
      "rudraksh_admin"
    );

    window.location.href = "/admin";
  };

  /* =========================================================
     LOAD LIVE DATABASE STATISTICS
  ========================================================= */

  const loadStatistics = async () => {
    const token = localStorage.getItem(
      "rudraksh_admin_token"
    );

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      setLoadingStats(true);
      setStatsError("");

      const response = await fetch(
        "http://localhost:5000/api/admin/dashboard",
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
            "Unable to load dashboard statistics."
        );
      }

      setStatistics({
        members: Number(
          data.statistics?.members || 0
        ),
        projects: Number(
          data.statistics?.projects || 0
        ),
        events: Number(
          data.statistics?.events || 0
        ),
        gallery: Number(
          data.statistics?.gallery || 0
        ),
      });
    } catch (error) {
      console.error(
        "DASHBOARD STATISTICS ERROR:",
        error
      );

      setStatsError(
        error.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoadingStats(false);
    }
  };

  /* =========================================================
     LOAD WHEN DASHBOARD OPENS
  ========================================================= */

  useEffect(() => {
    loadStatistics();
  }, []);

  /* =========================================================
     SIDEBAR MENU
  ========================================================= */

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      label: "Website Content",
      icon: MonitorCog,
      path: "/admin/content",
    },
    {
      label: "Members",
      icon: Users,
      path: "/admin/members",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      path: "/admin/projects",
    },
    {
      label: "Events",
      icon: CalendarDays,
      path: "/admin/events",
    },
    {
      label: "Gallery",
      icon: Image,
      path: "/admin/gallery",
    },
    {
      label: "Donations",
      icon: IndianRupee,
      path: "/admin/donations",
    },
    {
      label: "Memberships",
      icon: UserPlus,
      path: "/admin/memberships",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      path: "/admin/messages",
    },
    {
      label: "FAQs",
      icon: CircleHelp,
      path: "/admin/faqs",
    },
    {
      label: "Social Links",
      icon: Share2,
      path: "/admin/social-links",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  /* =========================================================
     UPDATE ACTIVE ITEM FROM URL
  ========================================================= */

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) =>
        item.path === location.pathname
    );

    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname]);

  /* =========================================================
     STATISTICS CARDS
  ========================================================= */

  const statisticCards = [
    {
      title: "Members",
      value: statistics.members,
      description:
        "Active organization members",
      icon: Users,
    },
    {
      title: "Projects",
      value: statistics.projects,
      description: "Published projects",
      icon: FolderKanban,
    },
    {
      title: "Events",
      value: statistics.events,
      description: "Published events",
      icon: CalendarDays,
    },
    {
      title: "Gallery",
      value: statistics.gallery,
      description: "Published photos",
      icon: Image,
    },
  ];

  /* =========================================================
     MENU CLICK
  ========================================================= */

  const handleMenuClick = (item) => {
    setActiveItem(item.label);
    setSidebarOpen(false);

    navigate(item.path);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-dashboard">

      {/* =========================================
          MOBILE OVERLAY
      ========================================= */}

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside
        className={`admin-sidebar ${
          sidebarOpen
            ? "admin-sidebar-open"
            : ""
        }`}
      >

        <div className="admin-sidebar-top">

          <div className="admin-brand">

            <div className="admin-brand-logo">
              R
            </div>

            <div className="admin-brand-text">

              <strong>
                RUDRAKSH
              </strong>

              <span>
                ADMIN PANEL
              </span>

            </div>

          </div>

          <button
            className="admin-mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="admin-navigation">

          <p className="admin-navigation-label">
            MANAGEMENT
          </p>

          {menuItems.map((item) => {

            const Icon = item.icon;

            const isActive =
              activeItem === item.label;

            return (
              <button
                key={item.label}
                className={`admin-nav-item ${
                  isActive
                    ? "admin-nav-active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuClick(item)
                }
              >

                <Icon size={18} />

                <span>
                  {item.label}
                </span>

                {isActive && (
                  <ChevronRight
                    size={15}
                    className="admin-nav-arrow"
                  />
                )}

              </button>
            );
          })}

        </nav>

        {/* Sidebar Bottom */}

        <div className="admin-sidebar-bottom">

          <div className="admin-sidebar-owner">

            <ShieldCheck size={16} />

            <span>
              System protected
            </span>

          </div>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >

            <LogOut size={18} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =========================================
          MAIN
      ========================================= */}

      <main className="admin-main">

        {/* Header */}

        <header className="admin-header">

          <div className="admin-header-left">

            <button
              className="admin-mobile-menu"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Rudraksh Header Logo */}
            <img
              src="/images/rudraksh-logo.png"
              alt="Rudraksh Social & Cultural Organization"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "contain",
                marginRight: "14px",
                flexShrink: 0,
              }}
            />

            <div>

              <p className="admin-header-small">
                RUDRAKSH ADMINISTRATION
              </p>

              <h1>
                {activeItem}
              </h1>

            </div>

          </div>

          <div className="admin-header-right">

            <button
              className="admin-notification-button"
              aria-label="Notifications"
            >

              <Bell size={19} />

              <span className="admin-notification-dot" />

            </button>

            <div className="admin-profile">

              <div className="admin-profile-avatar">

                {(admin?.name || "A")
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div className="admin-profile-info">

                <strong>
                  {admin?.name ||
                    "Administrator"}
                </strong>

                <span>
                  {admin?.role ||
                    "Administrator"}
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* =====================================
            CONTENT
        ===================================== */}

        <div className="admin-content">

          {/* Protection Notice */}

          <section className="admin-protection">

            <div className="admin-protection-icon">
              <ShieldCheck size={23} />
            </div>

            <div className="admin-protection-content">

              <div className="admin-protection-title">

                <h2>
                  Backend & Database
                  Protection Notice
                </h2>

                <span>
                  PROTECTED
                </span>

              </div>

              <p>
                This backend server and
                database are the sole
                property of{" "}
                <strong>
                  Prantik Chakrabarty
                </strong>
                .
              </p>

              <p>
                Do not modify, delete,
                replace, or restructure
                backend files, database
                tables, API configurations,
                or system settings without
                proper prior notice and
                authorization.
              </p>

              <p className="admin-protection-warning">
                Unauthorized changes may
                cause API failures, data
                loss, authentication
                problems, or other
                system-wide errors.
              </p>

            </div>

          </section>

          {/* Welcome */}

          <section className="admin-welcome">

            <div>

              <p>
                CONTROL CENTER
              </p>

              <h2>
                Welcome back,{" "}
                {admin?.name ||
                  "Administrator"}
              </h2>

              <span>
                Manage the Rudraksh
                organization website
                from one place.
              </span>

            </div>

          </section>

          {/* Statistics */}

          <section className="admin-section">

            <div className="admin-section-heading">

              <div>

                <span>
                  OVERVIEW
                </span>

                <h2>
                  Website Statistics
                </h2>

              </div>

              <button
                className="admin-refresh-button"
                onClick={
                  loadStatistics
                }
                disabled={
                  loadingStats
                }
              >

                <RefreshCw
                  size={14}
                  className={
                    loadingStats
                      ? "admin-refresh-spin"
                      : ""
                  }
                />

                <span>
                  Refresh
                </span>

              </button>

            </div>

            {/* API Error */}

            {statsError && (
              <div className="admin-stats-error">

                <span>
                  {statsError}
                </span>

                <button
                  onClick={
                    loadStatistics
                  }
                >
                  Try again
                </button>

              </div>
            )}

            {/* Statistic Cards */}

            <div className="admin-stat-grid">

              {statisticCards.map(
                (stat) => {

                  const Icon =
                    stat.icon;

                  return (
                    <div
                      className="admin-stat-card"
                      key={stat.title}
                    >

                      <div className="admin-stat-top">

                        <div className="admin-stat-icon">

                          <Icon
                            size={20}
                          />

                        </div>

                        <span>
                          LIVE
                        </span>

                      </div>

                      <h3>
                        {loadingStats
                          ? "..."
                          : stat.value}
                      </h3>

                      <strong>
                        {stat.title}
                      </strong>

                      <p>
                        {stat.description}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

          </section>

          {/* Quick Access */}

          <section className="admin-section">

            <div className="admin-section-heading">

              <div>

                <span>
                  QUICK ACCESS
                </span>

                <h2>
                  Management
                </h2>

              </div>

            </div>

            <div className="admin-quick-grid">

              {menuItems
                .filter(
                  (item) =>
                    item.label !==
                    "Dashboard"
                )
                .slice(0, 6)
                .map((item) => {

                  const Icon =
                    item.icon;

                  return (
                    <button
                      key={item.label}
                      className="admin-quick-card"
                      onClick={() =>
                        handleMenuClick(
                          item
                        )
                      }
                    >

                      <div className="admin-quick-icon">

                        <Icon
                          size={20}
                        />

                      </div>

                      <div>

                        <strong>
                          {item.label}
                        </strong>

                        <span>
                          Manage{" "}
                          {item.label.toLowerCase()}
                        </span>

                      </div>

                      <ChevronRight
                        size={17}
                      />

                    </button>
                  );
                })}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;