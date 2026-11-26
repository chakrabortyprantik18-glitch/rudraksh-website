
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  Clock,
  ShieldCheck,
} from "lucide-react";

import "./App.css";

import landscapePoster from "./assets/utsav-landscape.png";
import portraitPoster from "./assets/utsav-portrait.png";
import rudrakshLogo from "./assets/rudraksh-logo.webp";

import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import CreateForm from "./admin/CreateForm";
import Applications from "./admin/Applications";
import Payments from "./admin/Payments";
import RegistrationPage from "./RegistrationPage";

const API_URL = "http://localhost:5001/api";

function PublicPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadForms() {
      try {
        const response = await fetch(`${API_URL}/forms/public`);

        if (!response.ok) {
          throw new Error("Unable to load registration forms.");
        }

        const data = await response.json();
        setForms(data.forms || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, []);

  return (
    <main className="utsav-public">
      <header className="public-topbar">
        <div className="public-brand">
          <img
            src={rudrakshLogo}
            alt="Rudraksh Social & Cultural Organization"
            className="public-logo"
          />

          <div>
            <strong>RUDRAKSH</strong>
            <small>SOCIAL & CULTURAL ORGANIZATION</small>
          </div>
        </div>

        <a
          href="https://www.rudrakshsocialculturalorganization.online"
          target="_blank"
          rel="noreferrer"
          className="official-link"
        >
          Official Website <ArrowRight size={15} />
        </a>
      </header>

      <section className="utsav-hero">
        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />

        <div className="hero-heading">
          <span className="hero-eyebrow">
            CELEBRATING CULTURE • CREATIVITY • COMMUNITY
          </span>

          <h1>
            RUDRAKSH
            <span>UTSAV 2026</span>
          </h1>

          <p>
            A celebration of talent, tradition, music and
            togetherness.
          </p>
        </div>

        <picture className="hero-poster">
          <source
            media="(max-width: 600px)"
            srcSet={portraitPoster}
          />

          <img
            src={landscapePoster}
            alt="Rudraksh Utsav 2026 festival poster"
          />
        </picture>

        <div className="hero-details">
          <div>
            <CalendarDays size={19} />
            <span>29–31 December 2026</span>
          </div>

          <div>
            <Clock size={19} />
            <span>Nilambazar, Sribhumi</span>
          </div>

          <div>
            <ShieldCheck size={19} />
            <span>Organised by Rudraksh</span>
          </div>
        </div>
      </section>

      <section className="public-registration">
        <div className="public-section-heading">
          <span>BE PART OF THE CELEBRATION</span>
          <h2>Registrations</h2>

          <p>
            Choose an available event and begin your registration.
          </p>

          <div className="heading-decoration" />
        </div>

        {loading ? (
          <div className="public-state">
            <div className="loading-spinner" />
            <h3>Loading registrations...</h3>
            <p>Please wait a moment.</p>
          </div>
        ) : error ? (
          <div className="public-state">
            <h3>Unable to load registrations</h3>
            <p>{error}</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="public-state">
            <div className="empty-state-icon">✦</div>

            <h3>Registrations opening soon</h3>

            <p>
              There are currently no published registration forms.
              Please check again soon.
            </p>
          </div>
        ) : (
          <div className="public-form-grid">
            {forms.map((form) => (
              <article
                className="public-form-card"
                key={form.id}
              >
                <span className="form-card-label">
                  RUDRAKSH UTSAV 2026
                </span>

                <h3>{form.title}</h3>

                <p>
                  {form.description ||
                    "Join us for this celebration of talent and culture."}
                </p>

                <div className="form-card-fee">
                  <small>REGISTRATION FEE</small>

                  <strong>
                    {Number(form.fee) === 0
                      ? "FREE"
                      : `₹${form.fee}`}
                  </strong>
                </div>

                <Link
                  to={`/register/${form.slug}`}
                  className="public-register-button"
                >
                  REGISTER NOW <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="public-footer">
        <img
          src={rudrakshLogo}
          alt="Rudraksh Social & Cultural Organization"
          className="footer-logo"
        />

        <h3>RUDRAKSH</h3>

        <p>Social & Cultural Organization</p>

        <div className="footer-line" />

        <p>
          © 2026 Rudraksh Social & Cultural Organization.
          All rights reserved.
        </p>

        <a
          href="https://www.rudrakshsocialculturalorganization.online"
          target="_blank"
          rel="noreferrer"
        >
          www.rudrakshsocialculturalorganization.online
        </a>
      </footer>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public homepage */}
        <Route path="/" element={<PublicPage />} />

        {/* Participant registration */}
        <Route
          path="/register/:slug"
          element={<RegistrationPage />}
        />

        {/* Admin panel */}
        <Route path="/admin" element={<Login />} />

        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/admin/forms/new"
          element={<CreateForm />}
        />

        {/* Admin applications */}
        <Route
          path="/admin/applications"
          element={<Applications />}
        />

        {/* Admin payments */}
        <Route
          path="/admin/payments"
          element={<Payments />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
