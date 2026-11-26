import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Camera,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Music2,
  CreditCard,
  Clock,
} from "lucide-react";

import "./RegistrationPage.css";

import {
  submitParticipantApplication,
  createPaymentOrder,
  verifyPayment,
} from "./api/forms";

import rudrakshLogo from "./assets/rudraksh-logo.webp";
import landscapePoster from "./assets/utsav-landscape.png";
import portraitPoster from "./assets/utsav-portrait.png";

const API_URL =
  "https://forms-api.rudrakshsocialculturalorganization.online/api";

const INITIAL_PARTICIPANT = {
  fullName: "",
  schoolName: "",
  guardianName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  address: "",
};

function RegistrationPage() {
  const { slug } = useParams();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);

  const [participant, setParticipant] = useState(
    INITIAL_PARTICIPANT
  );

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const [validationError, setValidationError] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingApplicationId, setPendingApplicationId] =
    useState(null);

  const [paymentComplete, setPaymentComplete] = useState(false);
  const [passDownloadUrl, setPassDownloadUrl] = useState("");

  // Email notice appears on the public registration page.
  const [showEmailNotice, setShowEmailNotice] = useState(true);

  // LOAD REGISTRATION FORM
  useEffect(() => {
    const controller = new AbortController();

    async function loadForm() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/forms/public/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Registration form unavailable."
          );
        }

        setForm(data.form);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadForm();

    return () => controller.abort();
  }, [slug]);

  // PHOTO PREVIEW
  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const imageUrl = URL.createObjectURL(photo);
    setPhotoPreview(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [photo]);

  // FORM SELECTION DATA
  const category = form?.categories?.find(
    (item) => item.name === selectedCategory
  );

  const option = category?.options?.find(
    (item) =>
      (typeof item === "string" ? item : item.name) ===
      selectedOption
  );

  const groups = Array.isArray(option?.groups)
    ? option.groups
    : [];

  const registrationOpen =
    Number(form?.registration_open) === 1;

  // UPDATE PARTICIPANT DETAILS
  function updateParticipant(event) {
    const { name, value } = event.target;

    setParticipant((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // PERSONAL DETAILS VALIDATION
  function validatePersonalDetails() {
    if (
      !participant.fullName.trim() ||
      !participant.schoolName.trim() ||
      !participant.guardianName.trim() ||
      !participant.phone.trim() ||
      !participant.email.trim()
    ) {
      setValidationError(
        "Please complete all mandatory personal details."
      );
      return false;
    }

    if (!/^\d{10}$/.test(participant.phone.trim())) {
      setValidationError(
        "Please enter a valid 10-digit mobile number."
      );
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        participant.email.trim()
      )
    ) {
      setValidationError("Please enter a valid email address.");
      return false;
    }

    if (!photo) {
      setValidationError(
        "Please upload the participant photograph."
      );
      return false;
    }

    setValidationError("");
    return true;
  }

  // PERFORMANCE VALIDATION
  function validatePerformanceDetails() {
    if (!selectedCategory || !selectedOption) {
      setValidationError(
        "Please select a competition and performance type."
      );
      return false;
    }

    if (groups.length > 0 && !selectedGroup) {
      setValidationError("Please select your eligible group.");
      return false;
    }

    setValidationError("");
    return true;
  }
    // LOAD RAZORPAY CHECKOUT SCRIPT
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  // DOWNLOAD THE ENTRY PASS ONLY AFTER SERVER-SIDE VERIFICATION
  function downloadEntryPass(url) {
    if (!url) return;

    const trustedOrigin = new URL(API_URL).origin;
    const downloadUrl = new URL(url, API_URL);

    if (
      downloadUrl.origin !== trustedOrigin ||
      !downloadUrl.pathname.startsWith("/api/payments/pass/")
    ) {
      throw new Error("The entry pass download link is invalid.");
    }

    const link = document.createElement("a");
    link.href = downloadUrl.href;
    link.setAttribute(
      "download",
      "Rudraksh-Utsav-2026-Entry-Pass.pdf"
    );
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // SUBMIT APPLICATION AND OPEN RAZORPAY CHECKOUT
  async function handlePayment() {
    if (paymentLoading || paymentComplete) return;

    setPaymentLoading(true);
    setValidationError("");
    setPaymentMessage("");

    try {
      let applicationId = pendingApplicationId;

      if (!applicationId) {
        const applicationForm = new FormData();

        applicationForm.append("formId", String(form.id));
        applicationForm.append(
          "participant",
          JSON.stringify(participant)
        );

        applicationForm.append(
          "performance",
          JSON.stringify({
            category: selectedCategory,
            option: selectedOption,
            group: selectedGroup || "",
          })
        );

        applicationForm.append("photo", photo);

        const applicationResult =
          await submitParticipantApplication(applicationForm);

        if (
          !applicationResult?.success ||
          !applicationResult.applicationId
        ) {
          throw new Error(
            applicationResult?.message ||
              "Unable to submit your application."
          );
        }

        applicationId = applicationResult.applicationId;
        setPendingApplicationId(applicationId);
      }

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection."
        );
      }

      const order = await createPaymentOrder(applicationId);

      if (!order?.success || !order.orderId || !order.keyId) {
        throw new Error(
          order?.message || "Unable to create a payment order."
        );
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Rudraksh Social & Cultural Organization",
        description: "Utsav 2026 Participant Registration",
        order_id: order.orderId,

        prefill: {
          name: participant.fullName,
          email: participant.email,
          contact: participant.phone,
        },

        notes: {
          application_id: String(applicationId),
        },

        theme: {
          color: "#7b1e2b",
        },

        handler: async (result) => {
          try {
            setPaymentMessage(
              "Verifying your payment securely..."
            );

            const verification = await verifyPayment({
              applicationId,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            });

            if (!verification?.success) {
              throw new Error(
                verification?.message ||
                  "Payment verification failed."
              );
            }

            // Payment is confirmed by the backend.
            setPaymentComplete(true);

            // Use only the actual PDF URL returned by the backend.
            const returnedPassUrl =
              verification.passDownloadUrl || "";

            if (returnedPassUrl) {
              setPassDownloadUrl(returnedPassUrl);

              // Attempt automatic PDF download.
              try {
                downloadEntryPass(returnedPassUrl);
              } catch (downloadError) {
                console.error(
                  "Entry pass download failed:",
                  downloadError
                );
              }
            }

            setPaymentMessage(
              "Payment verified successfully. Your Utsav 2026 registration is confirmed."
            );
          } catch (err) {
            setPaymentMessage(
              err.response?.data?.message ||
                err.message ||
                "Payment was submitted but verification is pending. Please contact Rudraksh with your payment ID."
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setPaymentMessage(
              "Payment window closed. Your application is saved; you can retry payment."
            );
          },
        },
      });

      checkout.on("payment.failed", (event) => {
        setPaymentLoading(false);
        setPaymentMessage(
          event?.error?.description ||
            "Payment failed. Please try again."
        );
      });

      checkout.open();
    } catch (err) {
      setPaymentLoading(false);

      setValidationError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment."
      );
    }
  }

  // STEP NAVIGATION
  function goNext() {
    setValidationError("");

    if (step === 1) {
      if (!validatePersonalDetails()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validatePerformanceDetails()) return;
      setStep(3);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goBack() {
    setValidationError("");

    setStep((previous) => Math.max(1, previous - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setPhoto(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setValidationError(
        "Only JPG, PNG and WEBP images are accepted."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError(
        "Photograph must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setValidationError("");
    setPhoto(file);
  }
    // LOADING
  if (loading) {
    return (
      <main className="registration-loading">
        <div className="registration-spinner" />
        <p>Preparing your registration...</p>
      </main>
    );
  }

  // ERROR
  if (error || !form) {
    return (
      <main className="registration-error">
        <img src={rudrakshLogo} alt="Rudraksh logo" />
        <h1>Registration unavailable</h1>
        <p>
          {error || "This registration form could not be found."}
        </p>
        <Link to="/">Return to Utsav homepage</Link>
      </main>
    );
  }

  // CLOSED REGISTRATION
  if (!registrationOpen) {
    return (
      <main className="participant-registration">
        <header className="registration-header">
          <Link to="/" className="registration-brand">
            <img src={rudrakshLogo} alt="Rudraksh logo" />
            <span>RUDRAKSH</span>
          </Link>

          <Link to="/" className="back-home">
            <ArrowLeft size={16} />
            Back to Utsav
          </Link>
        </header>

        <section className="registration-closed">
          <ShieldCheck size={48} />
          <h1>Registration Closed</h1>
          <p>
            Registration for {form.title} is currently closed.
          </p>
          <Link to="/">Return to Utsav homepage</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="participant-registration">
      {/* EMAIL WARNING POPUP */}
      {showEmailNotice && (
        <div
          className="email-notice-backdrop"
          role="presentation"
        >
          <div
            className="email-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-notice-title"
          >
            <div className="email-notice-icon">
              <ShieldCheck size={28} />
            </div>

            <span className="email-notice-eyebrow">
              IMPORTANT NOTICE
            </span>

            <h2 id="email-notice-title">
              Please check your email address
            </h2>

            <p>
              Please enter your email address carefully and make
              sure it is correct. Your registration receipt and
              confirmation will be sent to this email address.
              If there is any server delay after successful
              payment, you will receive the receipt by email.
            </p>

            <p className="email-notice-emphasis">
              Please double-check your email address before
              proceeding.
            </p>

            <button
              type="button"
              className="email-notice-continue"
              onClick={() => setShowEmailNotice(false)}
            >
              I UNDERSTAND — CONTINUE
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="registration-header">
        <Link to="/" className="registration-brand">
          <img
            src={rudrakshLogo}
            alt="Rudraksh Social and Cultural Organization"
          />

          <div>
            <strong>RUDRAKSH</strong>
            <small>SOCIAL & CULTURAL ORGANIZATION</small>
          </div>
        </Link>

        <Link to="/" className="back-home">
          <ArrowLeft size={16} />
          Back to Utsav
        </Link>
      </header>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <section className="registration-layout">
        {/* LEFT: FESTIVAL INFORMATION */}
        <aside className="registration-sidebar">
          <div className="registration-poster">
            <picture>
              <source
                media="(max-width: 760px)"
                srcSet={landscapePoster}
              />

              <img
                src={portraitPoster}
                alt="Rudraksh Utsav 2026 festival poster"
              />
            </picture>
          </div>

          <div className="registration-event-details">
            <span className="event-overline">
              THE ANNUAL CULTURAL FESTIVAL
            </span>

            <h2>
              Celebrate
              <span> Talent & Culture.</span>
            </h2>

            <p>
              Be a part of Rudraksh Utsav 2026.
              Showcase your talent and celebrate
              music, creativity and tradition.
            </p>

            <div className="event-information">
              <div>
                <CalendarDays size={19} />
                <span>29–31 December 2026</span>
              </div>

              <div>
                <MapPin size={19} />
                <span>P.W.D Field, Nilambazar, Sribhumi</span>
              </div>

              <div>
                <Clock size={19} />
                <span>Registration deadline: 26 December</span>
              </div>

              <div>
                <Music2 size={19} />
                <span>Dance, Song & Cultural Competitions</span>
              </div>
            </div>

            <div className="sidebar-fee">
              <div>
                <small>REGISTRATION FEE</small>
                <strong>
                  ₹{Number(form.fee).toFixed(0)}
                </strong>
              </div>

              <span>Per participant</span>
            </div>
          </div>

          <div className="sidebar-footer">
            Organised by Rudraksh Social & Cultural Organization
          </div>
        </aside>

        {/* RIGHT: REGISTRATION FORM */}
        <div className="registration-content">
          {/* PAGE TITLE */}
          <div className="registration-title">
            <span>OFFICIAL PARTICIPANT APPLICATION</span>
            <h1>{form.title}</h1>

            <p>
              Complete all three steps to submit
              your Utsav 2026 registration.
            </p>
          </div>

          {/* THREE STEP PROGRESS */}
          <div className="wizard-progress">
            <div
              className={`wizard-step ${
                step >= 1 ? "active" : ""
              } ${step > 1 ? "completed" : ""}`}
            >
              <div className="wizard-circle">
                {step > 1 ? <Check size={18} /> : "1"}
              </div>

              <div className="wizard-step-label">
                <strong>Personal Details</strong>
                <small>Participant information</small>
              </div>
            </div>

            <div
              className={`wizard-connector ${
                step >= 2 ? "active" : ""
              }`}
            />

            <div
              className={`wizard-step ${
                step >= 2 ? "active" : ""
              } ${step > 2 ? "completed" : ""}`}
            >
              <div className="wizard-circle">
                {step > 2 ? <Check size={18} /> : "2"}
              </div>

              <div className="wizard-step-label">
                <strong>Performance</strong>
                <small>Competition details</small>
              </div>
            </div>

            <div
              className={`wizard-connector ${
                step >= 3 ? "active" : ""
              }`}
            />

            <div
              className={`wizard-step ${
                step >= 3 ? "active" : ""
              }`}
            >
              <div className="wizard-circle">3</div>

              <div className="wizard-step-label">
                <strong>Payment</strong>
                <small>Registration fee</small>
              </div>
            </div>
          </div>

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <section className="registration-card wizard-card">
              <div className="registration-card-heading">
                <span>01</span>

                <div>
                  <h2>Personal Details</h2>
                  <p>
                    Enter the participant's information.
                    Fields marked * are mandatory.
                  </p>
                </div>
              </div>

              <div className="participant-fields">
                <div className="registration-field">
                  <label>PARTICIPANT FULL NAME *</label>
                  <input
                    name="fullName"
                    value={participant.fullName}
                    onChange={updateParticipant}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                </div>

                <div className="registration-field">
                  <label>SCHOOL / INSTITUTION NAME *</label>
                  <input
                    name="schoolName"
                    value={participant.schoolName}
                    onChange={updateParticipant}
                    placeholder="Enter school name"
                  />
                </div>

                <div className="registration-field">
                  <label>PARENT / GUARDIAN NAME *</label>
                  <input
                    name="guardianName"
                    value={participant.guardianName}
                    onChange={updateParticipant}
                    placeholder="Enter parent or guardian name"
                  />
                </div>

                <div className="registration-field">
                  <label>CONTACT NUMBER *</label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={participant.phone}
                    onChange={updateParticipant}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                  />
                </div>

                <div className="registration-field">
                  <label>EMAIL ADDRESS *</label>
                  <input
                    name="email"
                    type="email"
                    value={participant.email}
                    onChange={updateParticipant}
                    placeholder="Enter email address"
                    autoComplete="email"
                  />
                </div>

                <div className="registration-field">
                  <label>DATE OF BIRTH</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={participant.dateOfBirth}
                    onChange={updateParticipant}
                  />
                </div>

                <div className="registration-field full-width">
                  <label>RESIDENTIAL ADDRESS</label>
                  <textarea
                    name="address"
                    value={participant.address}
                    onChange={updateParticipant}
                    placeholder="Enter residential address"
                    rows="3"
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD */}
              <div className="registration-photo-section">
                <h3>
                  <Camera size={19} />
                  Participant Photograph *
                </h3>

                <p>
                  Upload a recent and clear photograph.
                </p>

                <label className="photo-upload">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Participant preview"
                      className="participant-photo-preview"
                    />
                  ) : (
                    <>
                      <Camera size={30} />
                      <strong>Upload Photograph</strong>
                      <span>
                        JPG, PNG or WEBP · Maximum 5 MB
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>

                {photo && (
                  <p className="photo-selected">
                    <Check size={15} />
                    {photo.name}
                  </p>
                )}
              </div>
            </section>
          )}
                    {/* STEP 2: PERFORMANCE DETAILS */}
          {step === 2 && (
            <section className="registration-card wizard-card">
              <div className="registration-card-heading">
                <span>02</span>

                <div>
                  <h2>Performance Details</h2>
                  <p>
                    Select your competition and eligible group.
                  </p>
                </div>
              </div>

              <div className="registration-field">
                <label>MAIN CATEGORY *</label>

                <div className="competition-options">
                  {form.categories.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        selectedCategory === item.name
                          ? "competition-choice selected"
                          : "competition-choice"
                      }
                      onClick={() => {
                        setSelectedCategory(item.name);
                        setSelectedOption("");
                        setSelectedGroup("");
                        setValidationError("");
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {category && (
                <div className="registration-field">
                  <label>PERFORMANCE TYPE *</label>

                  <div className="competition-options">
                    {category.options.map((item, index) => {
                      const name =
                        typeof item === "string"
                          ? item
                          : item.name;

                      return (
                        <button
                          type="button"
                          key={`${name}-${index}`}
                          className={
                            selectedOption === name
                              ? "competition-choice selected"
                              : "competition-choice"
                          }
                          onClick={() => {
                            setSelectedOption(name);
                            setSelectedGroup("");
                            setValidationError("");
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedOption && groups.length > 0 && (
                <div className="registration-field">
                  <label>ELIGIBLE GROUP *</label>

                  <div className="competition-options">
                    {groups.map((group, index) => {
                      const name =
                        typeof group === "string"
                          ? group
                          : group.name || group.label;

                      return (
                        <button
                          type="button"
                          key={`${name}-${index}`}
                          className={
                            selectedGroup === name
                              ? "competition-choice selected"
                              : "competition-choice"
                          }
                          onClick={() => {
                            setSelectedGroup(name);
                            setValidationError("");
                          }}
                        >
                          <strong>{name}</strong>

                          {typeof group === "object" &&
                            group.eligibility && (
                              <small>{group.eligibility}</small>
                            )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCategory && (
                <div className="performance-summary">
                  <h3>Selection Summary</h3>

                  <p>
                    <strong>Category:</strong> {selectedCategory}
                  </p>

                  {selectedOption && (
                    <p>
                      <strong>Performance:</strong> {selectedOption}
                    </p>
                  )}

                  {selectedGroup && (
                    <p>
                      <strong>Group:</strong> {selectedGroup}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <section className="registration-card wizard-card">
              <div className="registration-card-heading">
                <span>03</span>

                <div>
                  <h2>Payment & Confirmation</h2>
                  <p>
                    Review your registration details.
                  </p>
                </div>
              </div>

              <div className="payment-review">
                <h3>Participant Summary</h3>

                <div className="payment-review-row">
                  <span>Participant</span>
                  <strong>{participant.fullName}</strong>
                </div>

                <div className="payment-review-row">
                  <span>School</span>
                  <strong>{participant.schoolName}</strong>
                </div>

                <div className="payment-review-row">
                  <span>Contact</span>
                  <strong>{participant.phone}</strong>
                </div>

                <div className="payment-review-row">
                  <span>Competition</span>
                  <strong>{selectedCategory}</strong>
                </div>

                <div className="payment-review-row">
                  <span>Performance</span>
                  <strong>{selectedOption}</strong>
                </div>

                {selectedGroup && (
                  <div className="payment-review-row">
                    <span>Group</span>
                    <strong>{selectedGroup}</strong>
                  </div>
                )}
              </div>

              <div className="payment-total">
                <div>
                  <span>REGISTRATION FEE</span>
                  <p>One participant</p>
                </div>

                <strong>
                  ₹{Number(form.fee).toFixed(2)}
                </strong>
              </div>

              <div className="payment-notice">
                <ShieldCheck size={23} />

                <div>
                  <strong>Secure Payment Verification</strong>
                  <p>
                    Registration confirmation will be generated
                    only after successful server-side payment
                    verification.
                  </p>
                </div>
              </div>

              <div className="payment-placeholder">
                <CreditCard size={35} />

                <h3>
                  {paymentComplete
                    ? "Registration Confirmed"
                    : "Complete Secure Payment"}
                </h3>

                <p>
                  {paymentComplete
                    ? paymentMessage
                    : "Pay the registration fee securely using Razorpay. Registration is confirmed only after server-side payment verification."}
                </p>

                {paymentMessage && !paymentComplete && (
                  <p role="status">{paymentMessage}</p>
                )}

                {/* MANUAL PDF DOWNLOAD */}
                {paymentComplete && passDownloadUrl && (
                  <a
                    href={passDownloadUrl}
                    className="download-pass-button"
                    target="_blank"
                    rel="noreferrer"
                  >
                    DOWNLOAD ENTRY PASS (PDF)
                    <ArrowRight size={17} />
                  </a>
                )}

                {paymentComplete && !passDownloadUrl && (
                  <p role="status">
                    Your payment is verified. Your receipt will
                    also be sent to your email. If the PDF does
                    not download automatically, please check
                    your inbox.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* VALIDATION */}
          {validationError && (
            <div
              className="registration-validation-error"
              role="alert"
            >
              {validationError}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="wizard-navigation">
            {step > 1 ? (
              <button
                type="button"
                className="wizard-back-button"
                onClick={goBack}
              >
                <ArrowLeft size={17} />
                PREVIOUS
              </button>
            ) : (
              <Link to="/" className="wizard-back-button">
                <ArrowLeft size={17} />
                CANCEL
              </Link>
            )}

            {step < 3 && (
              <button
                type="button"
                className="wizard-next-button"
                onClick={goNext}
              >
                CONTINUE
                <ArrowRight size={17} />
              </button>
            )}

            {step === 3 && !paymentComplete && (
              <button
                type="button"
                className="wizard-next-button"
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading
                  ? "PLEASE WAIT..."
                  : "PAY SECURELY"}
                <CreditCard size={17} />
              </button>
            )}

            {step === 3 && paymentComplete && (
              <span
                className="wizard-next-button"
                role="status"
              >
                PAYMENT VERIFIED <Check size={17} />
              </span>
            )}
          </div>

          <p className="registration-security-note">
            <ShieldCheck size={15} />
            Your information is collected for Utsav registration.
          </p>
        </div>
      </section>

      <footer className="registration-footer">
        <img src={rudrakshLogo} alt="Rudraksh logo" />

        <span>
          © 2026 Rudraksh Social & Cultural Organization
        </span>
      </footer>
    </main>
  );
}

export default RegistrationPage;