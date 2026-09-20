import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./Membership.css";
import { BACKEND_URL } from "../../config/api";

const benefits = [
  {
    number: "01",
    title: "Be Part of Change",
    text: "Join people working together to create meaningful change in our communities.",
  },
  {
    number: "02",
    title: "Volunteer & Participate",
    text: "Take part in social, educational, cultural and community initiatives.",
  },
  {
    number: "03",
    title: "Grow Together",
    text: "Connect with people, share ideas and help build stronger communities.",
  },
];

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  date_of_birth: "",
  occupation: "",
  reason: "",
  photo: null,
};

function Membership() {
  const sectionRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] =
    useState(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".membership-label",
            ".membership-title",
            ".membership-description",
            ".membership-button",
            ".membership-benefits",
            ".membership-benefit",
          ],
          {
            opacity: 1,
            y: 0,
            x: 0,
          }
        );

        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        })
        .from(".membership-label", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        .from(
          ".membership-title",
          {
            y: 50,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .from(
          ".membership-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .from(
          ".membership-button",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.35"
        )
        .from(
          ".membership-benefit",
          {
            y: 35,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
          },
          "-=0.25"
        );
    },
    {
      scope: sectionRef,
    }
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Photo must be smaller than 5 MB.",
      });

      event.target.value = "";
      return;
    }

    setMessage({
      type: "",
      text: "",
    });

    setFormData((previous) => ({
      ...previous,
      photo: file,
    }));
  };

  const openForm = () => {
    setMessage({
      type: "",
      text: "",
    });

    setSubmitted(false);
    setFormData(initialForm);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);

    setSubmitted(false);

    setMessage({
      type: "",
      text: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!formData.full_name.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your full name.",
      });
      return;
    }

    if (!formData.phone.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your phone number.",
      });
      return;
    }

    setSubmitting(true);

    setMessage({
      type: "",
      text: "",
    });

    try {
      const payload = new FormData();

      payload.append(
        "full_name",
        formData.full_name.trim()
      );

      payload.append(
        "email",
        formData.email.trim()
      );

      payload.append(
        "phone",
        formData.phone.trim()
      );

      payload.append(
        "address",
        formData.address.trim()
      );

      payload.append(
        "date_of_birth",
        formData.date_of_birth
      );

      payload.append(
        "occupation",
        formData.occupation.trim()
      );

      payload.append(
        "reason",
        formData.reason.trim()
      );

      if (formData.photo) {
        payload.append(
          "photo",
          formData.photo
        );
      }

      const response = await fetch(
        `${BACKEND_URL}/api/membership`,
        {
          method: "POST",
          body: payload,
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit membership application."
        );
      }

      /*
       * SUCCESS
       *
       * Instead of resetting the form and leaving
       * the user on the same form, we switch to a
       * dedicated success screen.
       */

      setFormData(initialForm);

      setSubmitted(true);

      setMessage({
        type: "success",
        text:
          "Your membership application has been sent successfully.",
      });
    } catch (error) {
      console.error(
        "Membership submission error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        ref={sectionRef}
        id="membership"
        className="membership-section"
      >
        <div className="membership-glow membership-glow-one" />

        <div className="membership-glow membership-glow-two" />

        <div className="membership-container">
          <div className="membership-main">
            <div className="membership-label">
              <span />
              BECOME A MEMBER
            </div>

            <h2 className="membership-title">
              Don't just watch
              <br />
              <em>change happen.</em>
              <br />
              Be part of it.
            </h2>

            <p className="membership-description">
              Rudraksh is a community of people
              who believe that meaningful change
              begins when we come together. Become
              a member and be part of the journey.
            </p>

            <button
              type="button"
              className="membership-button"
              onClick={openForm}
            >
              <span>Join Rudraksh</span>
              <strong>↗</strong>
            </button>
          </div>

          <div className="membership-benefits">
            {benefits.map((benefit) => (
              <div
                key={benefit.number}
                className="membership-benefit"
              >
                <span className="membership-benefit-number">
                  {benefit.number}
                </span>

                <div className="membership-benefit-content">
                  <h3>
                    {benefit.title}
                  </h3>

                  <p>
                    {benefit.text}
                  </p>
                </div>

                <span className="membership-benefit-line" />
              </div>
            ))}
          </div>
        </div>

        <div className="membership-bottom-text">
          <span>RUDRAKSH</span>
          <span>
            SOCIAL & CULTURAL ORGANIZATION
          </span>
        </div>
      </section>

      {/* =====================================================
          MEMBERSHIP MODAL
      ===================================================== */}

      {formOpen && (
        <div
          className="membership-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-form-title"
          >
            <button
              type="button"
              className="membership-modal-close"
              onClick={closeForm}
              disabled={submitting}
              aria-label="Close membership form"
            >
              ×
            </button>

            {/* =================================================
                SUCCESS SCREEN
            ================================================= */}

            {submitted ? (
              <div className="membership-success">
                <div className="membership-success-icon">
                  ✓
                </div>

                <span className="membership-success-label">
                  APPLICATION SENT
                </span>

                <h2>
                  Thank you for joining
                  <em> Rudraksh.</em>
                </h2>

                <p>
                  Your membership application
                  has been successfully sent to
                  our team.
                </p>

                <strong>
                  Our team will contact you shortly.
                </strong>

                <button
                  type="button"
                  className="membership-success-close"
                  onClick={closeForm}
                >
                  CLOSE
                  <span>↗</span>
                </button>
              </div>
            ) : (
              <>
                {/* =============================================
                    FORM HEADER
                ============================================= */}

                <div className="membership-modal-header">
                  <span>
                    RUDRAKSH MEMBERSHIP
                  </span>

                  <h2 id="membership-form-title">
                    Become a <em>member.</em>
                  </h2>

                  <p>
                    Fill in your details below
                    and submit your membership
                    application.
                  </p>
                </div>

                {/* =============================================
                    FORM
                ============================================= */}

                <form
                  className="membership-form"
                  onSubmit={handleSubmit}
                >
                  <div className="membership-form-grid">
                    <div className="membership-field">
                      <label htmlFor="membership-full-name">
                        Full Name *
                      </label>

                      <input
                        id="membership-full-name"
                        name="full_name"
                        type="text"
                        placeholder="Enter your full name"
                        value={
                          formData.full_name
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                      />
                    </div>

                    <div className="membership-field">
                      <label htmlFor="membership-phone">
                        Phone Number *
                      </label>

                      <input
                        id="membership-phone"
                        name="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                      />
                    </div>

                    <div className="membership-field">
                      <label htmlFor="membership-email">
                        Email
                      </label>

                      <input
                        id="membership-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleInputChange
                        }
                      />
                    </div>

                    <div className="membership-field">
                      <label htmlFor="membership-dob">
                        Date of Birth
                      </label>

                      <input
                        id="membership-dob"
                        name="date_of_birth"
                        type="date"
                        value={
                          formData.date_of_birth
                        }
                        onChange={
                          handleInputChange
                        }
                      />
                    </div>

                    <div className="membership-field">
                      <label htmlFor="membership-occupation">
                        Occupation
                      </label>

                      <input
                        id="membership-occupation"
                        name="occupation"
                        type="text"
                        placeholder="Student, business, employee..."
                        value={
                          formData.occupation
                        }
                        onChange={
                          handleInputChange
                        }
                      />
                    </div>

                    <div className="membership-field">
                      <label htmlFor="membership-photo">
                        Photo
                      </label>

                      <input
                        id="membership-photo"
                        name="photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={
                          handlePhotoChange
                        }
                      />

                      <small>
                        JPG, PNG, WEBP or GIF ·
                        Maximum 5 MB
                      </small>
                    </div>
                  </div>

                  <div className="membership-field">
                    <label htmlFor="membership-address">
                      Address
                    </label>

                    <textarea
                      id="membership-address"
                      name="address"
                      rows="3"
                      placeholder="Enter your address"
                      value={
                        formData.address
                      }
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>

                  <div className="membership-field">
                    <label htmlFor="membership-reason">
                      Why do you want to join?
                    </label>

                    <textarea
                      id="membership-reason"
                      name="reason"
                      rows="4"
                      placeholder="Tell us briefly why you want to become a member..."
                      value={
                        formData.reason
                      }
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>

                  {message.text && (
                    <div
                      className={`membership-form-message ${message.type}`}
                    >
                      {message.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="membership-submit-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "SENDING APPLICATION..."
                      : "SUBMIT APPLICATION"}

                    <span>
                      {submitting
                        ? "..."
                        : "↗"}
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Membership;