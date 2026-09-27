import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./Contact.css";

import { BACKEND_URL } from "../../config/api";
import {
  useWebsiteContent,
} from "../../hooks/useWebsiteContent";

const API_URL = `${BACKEND_URL}/api/contact`;

function Contact() {
  const sectionRef = useRef(null);

  const {
    content,
  } = useWebsiteContent("contact");

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [submitStatus, setSubmitStatus] =
    useState({
      type: "",
      message: "",
    });

  /*
   * ============================================================
   * CMS CONTENT
   * ============================================================
   */

  const title =
    content?.title ||
    "Let's create something meaningful.";

  const description =
    content?.description ||
    "Have a question, want to volunteer, become a member or work with us? We'd love to hear from you.";

  const email =
    content?.email ||
    "rudrakshsocialculturalorganiza@gmail.com";

  const phone =
    content?.phone ||
    "+91 93657 16039";

  const address =
    content?.address ||
    "Nilambazar, Sribhumi, Assam, India";

  const mapUrl =
    content?.mapUrl ||
    "https://www.google.com/maps/search/?api=1&query=Nilambazar%2C%20Sribhumi%2C%20Assam%2C%20India";

  const whatsappNumber =
    String(phone).replace(
      /\D/g,
      ""
    );

  const whatsappUrl =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : "https://wa.me/8811863845";

  /*
   * ============================================================
   * FORM INPUT
   * ============================================================
   */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    if (submitStatus.message) {
      setSubmitStatus({
        type: "",
        message: "",
      });
    }
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      const cleanName =
        formData.name.trim();

      const cleanEmail =
        formData.email.trim();

      const cleanPhone =
        formData.phone.trim();

      const cleanSubject =
        formData.subject.trim();

      const cleanMessage =
        formData.message.trim();

      if (!cleanName) {
        setSubmitStatus({
          type: "error",
          message:
            "Please enter your name.",
        });

        return;
      }

      if (!cleanEmail) {
        setSubmitStatus({
          type: "error",
          message:
            "Please enter your email address.",
        });

        return;
      }

      if (!cleanMessage) {
        setSubmitStatus({
          type: "error",
          message:
            "Please enter your message.",
        });

        return;
      }

      setSubmitting(true);

      setSubmitStatus({
        type: "",
        message: "",
      });

      try {
        const response =
          await fetch(API_URL, {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              subject: cleanSubject,
              message: cleanMessage,
            }),
          });

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to send your message."
          );
        }

        setSubmitStatus({
          type: "success",
          message:
            "Message sent successfully. We'll get back to you soon.",
        });

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } catch (error) {
        console.error(
          "CONTACT FORM ERROR:",
          error
        );

        setSubmitStatus({
          type: "error",
          message:
            error.message ||
            "Something went wrong. Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * ============================================================
   * GSAP
   * ============================================================
   */

  useGSAP(
    () => {
      const section =
        sectionRef.current;

      if (!section) {
        return;
      }

      const elements =
        section.querySelectorAll(
          ".contact-eyebrow, .contact-title, .contact-description, .contact-details, .contact-form-card"
        );

      gsap.set(elements, {
        opacity: 1,
        x: 0,
        y: 0,
      });

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (
        prefersReducedMotion
      ) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

      const isVisible =
        rect.top <
          window.innerHeight &&
        rect.bottom > 0;

      if (isVisible) {
        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        })
        .from(".contact-eyebrow", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        .from(
          ".contact-title",
          {
            y: 45,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .from(
          ".contact-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .from(
          ".contact-details",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".contact-form-card",
          {
            x: 45,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.55"
        );
    },
    {
      scope: sectionRef,
    }
  );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="contact-section"
    >
      {/* Decorative elements */}

      <div className="contact-orb contact-orb-one" />

      <div className="contact-orb contact-orb-two" />

      <div className="contact-container">

        {/* =========================
            LEFT CONTENT
        ========================== */}

        <div className="contact-content">

          <div className="contact-eyebrow">
            <span />
            GET IN TOUCH
          </div>

          <h2 className="contact-title">
            {title}
          </h2>

          <p className="contact-description">
            {description}
          </p>

          {/* =========================
              CONTACT DETAILS
          ========================== */}

          <div className="contact-details">

            {/* EMAIL */}

            <a
              href={`mailto:${email}`}
              className="contact-detail"
            >
              <span className="contact-detail-number">
                01
              </span>

              <div>
                <small>
                  EMAIL
                </small>

                <strong>
                  {email}
                </strong>
              </div>
            </a>

            {/* PHONE */}

            <a
              href={`tel:${phone.replace(
                /[^\d+]/g,
                ""
              )}`}
              className="contact-detail"
            >
              <span className="contact-detail-number">
                02
              </span>

              <div>
                <small>
                  PHONE
                </small>

                <strong>
                  {phone}
                </strong>
              </div>
            </a>

            {/* LOCATION */}

            <div className="contact-detail">
              <span className="contact-detail-number">
                03
              </span>

              <div>
                <small>
                  LOCATION
                </small>

                <strong>
                  {address}
                </strong>
              </div>
            </div>

          </div>

          {/* =========================
              WHATSAPP
          ========================== */}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="contact-whatsapp"
          >
            <span>
              Chat with us on WhatsApp
            </span>

            <strong>
              ↗
            </strong>
          </a>

        </div>

        {/* =========================
            CONTACT FORM
        ========================== */}

        <div className="contact-form-card">

          <div className="contact-form-header">
            <span>
              01
            </span>

            <p>
              SEND US A MESSAGE
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
          >

            {/* NAME + EMAIL */}

            <div className="contact-form-row">

              <div className="contact-field">

                <label htmlFor="name">
                  YOUR NAME
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={150}
                  required
                />

              </div>

              <div className="contact-field">

                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={255}
                  required
                />

              </div>

            </div>

            {/* PHONE */}

            <div className="contact-field">

              <label htmlFor="phone">
                PHONE NUMBER
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                maxLength={30}
              />

            </div>

            {/* SUBJECT */}

            <div className="contact-field">

              <label htmlFor="subject">
                SUBJECT
              </label>

              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="What would you like to talk about?"
                value={
                  formData.subject
                }
                onChange={
                  handleChange
                }
                maxLength={255}
              />

            </div>

            {/* MESSAGE */}

            <div className="contact-field">

              <label htmlFor="message">
                YOUR MESSAGE
              </label>

              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="Tell us how we can help..."
                value={
                  formData.message
                }
                onChange={
                  handleChange
                }
                maxLength={5000}
                required
              />

            </div>

            {/* STATUS */}

            {submitStatus.message && (
              <div
                className={`contact-submit-status ${
                  submitStatus.type ===
                  "success"
                    ? "contact-submit-success"
                    : "contact-submit-error"
                }`}
              >
                {submitStatus.type ===
                "success"
                  ? "✓"
                  : "!"}

                <span>
                  {
                    submitStatus.message
                  }
                </span>
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="contact-submit"
              disabled={submitting}
            >
              <span>
                {submitting
                  ? "Sending..."
                  : "Send Message"}
              </span>

              <strong>
                {submitting
                  ? "..."
                  : "↗"}
              </strong>
            </button>

          </form>

          <div className="contact-form-note">
            We usually respond as soon
            as possible.
          </div>

        </div>

      </div>

      {/* =========================
          LOCATION
      ========================== */}

      <div className="contact-location">

        <div className="contact-location-inner">

          <div>

            <span className="contact-location-label">
              FIND US
            </span>

            <h3>
              {address}
            </h3>

          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="contact-map-button"
          >
            Open in Google Maps

            <span>
              ↗
            </span>
          </a>

        </div>

      </div>

      {/* =========================
          BOTTOM BRAND LINE
      ========================== */}

      <div className="contact-bottom">

        <span>
          RUDRAKSH
        </span>

        <span>
          SOCIAL · CULTURAL · COMMUNITY
        </span>

      </div>

    </section>
  );
}

export default Contact;