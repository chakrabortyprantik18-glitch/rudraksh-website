import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import App from "./App.jsx";

import AboutPage from "./pages/AboutPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import MembersPage from "./pages/MembersPage.jsx";

import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminContent from "./admin/AdminContent.jsx";
import AdminMembers from "./admin/AdminMembers.jsx";
import AdminProjects from "./admin/AdminProjects.jsx";
import AdminEvents from "./admin/AdminEvents.jsx";
import AdminGallery from "./admin/AdminGallery.jsx";
import AdminMemberships from "./admin/AdminMemberships.jsx";
import AdminMessages from "./admin/AdminMessages.jsx";
import AdminFAQs from "./admin/AdminFAQs.jsx";
import AdminSocialLinks from "./admin/AdminSocialLinks.jsx";
import AdminDonations from "./admin/AdminDonations.jsx";
import AdminSettings from "./admin/AdminSettings.jsx";

import "./index.css";

/* =========================================================
   ADMIN AUTHENTICATION GUARD
========================================================= */

function isAdminAuthenticated() {
  const token = localStorage.getItem(
    "rudraksh_admin_token"
  );

  const admin = localStorage.getItem(
    "rudraksh_admin"
  );

  if (!token || !admin) {
    return false;
  }

  try {
    const parsedAdmin = JSON.parse(admin);

    if (!parsedAdmin || typeof parsedAdmin !== "object") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   PROTECTED ADMIN ROUTE
========================================================= */

function ProtectedAdminRoute() {
  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return <Outlet />;
}

/* =========================================================
   APPLICATION
========================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* =================================================
            PUBLIC WEBSITE
        ================================================= */}

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/about"
          element={<AboutPage />}
        />

        <Route
          path="/projects"
          element={<ProjectsPage />}
        />

        {/* =================================================
            INDIVIDUAL PROJECT PAGE
        ================================================= */}

        <Route
          path="/projects/:id"
          element={<ProjectDetailPage />}
        />

        <Route
          path="/gallery"
          element={<GalleryPage />}
        />

        {/* =================================================
            MEMBERS PAGE
        ================================================= */}

        <Route
          path="/members"
          element={<MembersPage />}
        />

        {/* =================================================
            ADMIN LOGIN
            PUBLIC
        ================================================= */}

        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        {/* =================================================
            PROTECTED ADMIN PANEL
        ================================================= */}

        <Route element={<ProtectedAdminRoute />}>

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/content"
            element={<AdminContent />}
          />

          <Route
            path="/admin/members"
            element={<AdminMembers />}
          />

          <Route
            path="/admin/projects"
            element={<AdminProjects />}
          />

          <Route
            path="/admin/events"
            element={<AdminEvents />}
          />

          <Route
            path="/admin/gallery"
            element={<AdminGallery />}
          />

          <Route
            path="/admin/donations"
            element={<AdminDonations />}
          />

          <Route
            path="/admin/memberships"
            element={<AdminMemberships />}
          />

          <Route
            path="/admin/messages"
            element={<AdminMessages />}
          />

          <Route
            path="/admin/faqs"
            element={<AdminFAQs />}
          />

          <Route
            path="/admin/social-links"
            element={<AdminSocialLinks />}
          />

          <Route
            path="/admin/settings"
            element={<AdminSettings />}
          />

        </Route>

        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);