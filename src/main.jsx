import React from "react";
import ReactDOM from "react-dom/client";

import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import App from "./App.jsx";

import AboutPage from "./pages/AboutPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>

        {/* Public Website */}
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/content" element={<AdminContent />} />
        <Route path="/admin/members" element={<AdminMembers />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/gallery" element={<AdminGallery />} />
        <Route path="/admin/donations" element={<AdminDonations />} />
        <Route path="/admin/memberships" element={<AdminMemberships />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/faqs" element={<AdminFAQs />} />
        <Route path="/admin/social-links" element={<AdminSocialLinks />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </HashRouter>
  </React.StrictMode>
);