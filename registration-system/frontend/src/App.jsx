
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
  MapPin,
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

// Production registration API
const API_URL =
  "https://forms-api.rudrakshsocialculturalorganization.online/api";


/* =========================================
   PUBLIC HOMEPAGE
========================================= */

function PublicPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadForms() {
      try {
        const response = await fetch(`${API_URL}/forms/public`);

        if (!response.ok) {
          throw new Error("Unable to load registration forms.");
        }

        const data = await response.json();

        if (!cancelled) {
          setForms(data.forms || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadForms();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="utsav-public">

      {/* =================================
          TOP NAVIGATION
      ================================= */}

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


      {/* =================================
          HERO SECTION
      ================================= */}

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


        {/* EVENT INFORMATION */}

        <div className="hero-details">

          <div>
            <CalendarDays size={19} />
            <span>29–31 December 2026</span>
          </div>

          <div>
            <MapPin size={19} />
            <span>Nilambazar, Sribhumi</span>
          </div>

          <div>
            <ShieldCheck size={19} />
            <span>Organised by Rudraksh</span>
          </div>

        </div>

      </section>


      {/* =================================
          ABOUT UTSAV 2026
      ================================= */}

      <section className="utsav-about">

        <div className="utsav-about-content">

          <span className="utsav-label">
            ABOUT THE FESTIVAL
          </span>

          <h2>
            Three Days of Art, Music & Culture.
          </h2>

          <p>
            Rudraksh Utsav 2026 is a three-day cultural festival
            organized by Rudraksh Social & Cultural Organization,
            celebrating the richness of art, music, creativity
            and tradition.

            Featuring cultural competitions, live music,
            performances and prize distribution, Utsav brings
            together talented participants from across the
            Barak Valley.
          </p>


          <div className="utsav-info-grid">

            <div className="utsav-info-item">

              <CalendarDays size={23} />

              <div>
                <strong>29–31 December 2026</strong>
                <span>Three-day cultural celebration</span>
              </div>

            </div>


            <div className="utsav-info-item">

              <MapPin size={23} />

              <div>
                <strong>P.W.D Field, Nilambazar</strong>
                <span>Sribhumi, Assam</span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =================================
          COMPETITION SCHEDULE
      ================================= */}

      <section className="utsav-schedule">

        <div className="schedule-heading">

          <span className="utsav-label">
            MARK YOUR CALENDAR
          </span>

          <h2>
            Competition Schedule
          </h2>

          <p>
            Check your competition date before registering.
          </p>

          <div className="heading-decoration" />

        </div>


        <div className="schedule-grid">


          {/* DAY 1 - DANCE */}

          <article className="schedule-card">

            <div className="schedule-card-top">
              <CalendarDays size={23} />

              <span className="schedule-date">
                29 DECEMBER 2026
              </span>
            </div>

            <h3>
              Dance Competitions
            </h3>

            <ul>
              <li>Rabindra Nritya</li>
              <li>Srijonshil Nritya</li>
            </ul>

            <div className="schedule-note">
              All Dance Participants
            </div>

          </article>


          {/* DAY 2 - MUSIC AND FANCY DRESS */}

          <article className="schedule-card">

            <div className="schedule-card-top">
              <CalendarDays size={23} />

              <span className="schedule-date">
                30 DECEMBER 2026
              </span>
            </div>

            <h3>
              Musical Contest
            </h3>

            <ul>
              <li>Rabindra Sangeet</li>
              <li>Adhunik Sangeet (Bengali/Hindi)</li>
              <li>Jemon Khushi Temon Shajo</li>
            </ul>

            <div className="schedule-note">
              All Music & Fancy Dress Participants
            </div>

          </article>


          {/* DAY 3 - PRIZE DISTRIBUTION */}

          <article className="schedule-card">

            <div className="schedule-card-top">
              <CalendarDays size={23} />

              <span className="schedule-date">
                31 DECEMBER 2026
              </span>
            </div>

            <h3>
              Prize Distribution & Orchestra Night
            </h3>

            <ul>
              <li>Prize Distribution Ceremony</li>
              <li>Orchestra Night</li>
            </ul>

            <div className="schedule-note">
              Celebrating Our Winners
            </div>

          </article>

        </div>


        {/* IMPORTANT NOTICE */}

        <div className="schedule-notice">

          <ShieldCheck size={20} />

          <p>
            Participants must report to the venue at least
            30 minutes before their respective competition.
          </p>

        </div>

      </section>


      {/* =================================
          REGISTRATION SECTION
      ================================= */}

      <section className="public-registration">

        <div className="public-section-heading">

          <span>
            BE PART OF THE CELEBRATION
          </span>

          <h2>
            Registrations
          </h2>

          <p>
            Choose an available event and begin your registration.
          </p>

          <div className="heading-decoration" />

        </div>


        {/* LOADING STATE */}

        {loading ? (

          <div className="public-state">

            <div className="loading-spinner" />

            <h3>
              Loading registrations...
            </h3>

            <p>
              Please wait a moment.
            </p>

          </div>


        ) : error ? (

          /* ERROR STATE */

          <div className="public-state">

            <h3>
              Unable to load registrations
            </h3>

            <p>
              {error}
            </p>

          </div>


        ) : forms.length === 0 ? (

          /* EMPTY STATE */

          <div className="public-state">

            <div className="empty-state-icon">
              ✦
            </div>

            <h3>
              Registrations opening soon
            </h3>

            <p>
              There are currently no published registration forms.
              Please check again soon.
            </p>

          </div>


        ) : (

          /* DYNAMIC REGISTRATION CARDS */

          <div className="public-form-grid">

            {forms.map((form) => (

              <article
                className="public-form-card"
                key={form.id}
              >

                <span className="form-card-label">
                  RUDRAKSH UTSAV 2026
                </span>

                <h3>
                  {form.title}
                </h3>

                <p>
                  {form.description ||
                    "Join us for this celebration of talent and culture."}
                </p>


                <div className="form-card-fee">

                  <small>
                    REGISTRATION FEE
                  </small>

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
                  REGISTER NOW
                  <ArrowRight size={17} />
                </Link>

              </article>

            ))}

          </div>

        )}

      </section>


      {/* =================================
          FOOTER
      ================================= */}

      <footer className="public-footer">

        <img
          src={rudrakshLogo}
          alt="Rudraksh Social & Cultural Organization"
          className="footer-logo"
        />

        <h3>
          RUDRAKSH
        </h3>

        <p>
          Social & Cultural Organization
        </p>

        <div className="footer-line" />

        <div className="footer-contact-details">
          <p>
            <strong>General Enquiries:</strong>{" "}
            <a href="tel:+918811863845">+91 88118 63845</a>
          </p>
          <p>
            <strong>Registration Support:</strong>{" "}
            <a href="tel:+919365716039">+91 9365716039</a>
          </p>
        </div>

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


/* =========================================
   APPLICATION ROUTES
========================================= */

function App() {

  return (

    <BrowserRouter basename="/forms">

      <Routes>

        {/* PUBLIC HOMEPAGE */}

        <Route
          path="/"
          element={<PublicPage />}
        />


        {/* PARTICIPANT REGISTRATION */}

        <Route
          path="/register/:slug"
          element={<RegistrationPage />}
        />


        {/* ADMIN LOGIN */}

        <Route
          path="/admin"
          element={<Login />}
        />


        {/* ADMIN DASHBOARD */}

        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />


        {/* CREATE REGISTRATION FORM */}

        <Route
          path="/admin/forms/new"
          element={<CreateForm />}
        />


        {/* ADMIN APPLICATIONS */}

        <Route
          path="/admin/applications"
          element={<Applications />}
        />


        {/* ADMIN PAYMENTS */}

        <Route
          path="/admin/payments"
          element={<Payments />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;