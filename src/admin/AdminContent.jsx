import { useEffect, useState } from "react";

import {
  Save,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Home,
  BarChart3,
  Info,
  Users,
  Phone,
  PanelBottom,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import "./AdminContent.css";

import {
  API_URL,
  ADMIN_API_URL,
  BACKEND_URL,
} from "../config/api";

const initialContent = {
  hero: {
    eyebrow: "RUDRAKSH SOCIAL & CULTURAL ORGANIZATION",
    title: "Building Communities. Creating Change.",
    description:
      "Working together to create positive social and cultural impact in our community.",
    buttonText: "Explore Our Work",
    image: "",
  },

  impact: {
    heading: "Our Impact",
    description:
      "Every initiative is a step toward a stronger, more connected community.",
    stat1Number: "350+",
    stat1Label: "People Reached",
    stat2Number: "28",
    stat2Label: "Blood Donors",
    stat3Number: "80+",
    stat3Label: "Students Supported",
    stat4Number: "10+",
    stat4Label: "Community Initiatives",
  },

  about: {
    eyebrow: "WHO WE ARE",
    title: "Together for a Better Tomorrow",
    description:
      "Rudraksh Social & Cultural Organization works to create meaningful social impact through community programs, cultural activities, education, and humanitarian initiatives.",
    image: "",
  },

  membership: {
    eyebrow: "JOIN US",
    title: "Become a Member",
    description:
      "Join our community and contribute your time, skills, and energy toward meaningful change.",
    buttonText: "Apply for Membership",
    image: "",
  },

  contact: {
    title: "Get In Touch",
    description:
      "Have a question, want to collaborate, or need more information? Reach out to us.",
    address:
      "Main Road, Nilambazar, Karimganj, Assam - 788710",
    phone: "+91 93657 16093",
    email:
      "rudrakshsocialandculturalorganiza@gmail.com",
    mapUrl:
      "https://maps.app.goo.gl/FPXGBVp8tz6Fy8rf9",
  },

  footer: {
    description:
      "Rudraksh Social & Cultural Organization — serving communities through social and cultural initiatives.",
    copyright:
      "© 2026 Rudraksh Social & Cultural Organization. All rights reserved.",
    logo: "",
  },
};

const sections = [
  {
    id: "hero",
    label: "Hero",
    icon: Home,
  },
  {
    id: "impact",
    label: "Impact",
    icon: BarChart3,
  },
  {
    id: "about",
    label: "About",
    icon: Info,
  },
  {
    id: "membership",
    label: "Membership",
    icon: Users,
  },
  {
    id: "contact",
    label: "Contact",
    icon: Phone,
  },
  {
    id: "footer",
    label: "Footer",
    icon: PanelBottom,
  },
];

/* ============================================================
   HELPERS
============================================================ */

function normalizeImage(image) {
  if (!image) return null;

  if (typeof image === "object") {
    return image;
  }

  return {
    preview: image.startsWith("http")
      ? image
      : `${BACKEND_URL}${image}`,
    url: image,
    name: "Saved website image",
  };
}

/* ============================================================
   IMAGE DROPZONE
============================================================ */

function ImageDropzone({
  label,
  value,
  onChange,
}) {
  const handleFiles = (files) => {
    const file = files?.[0];

    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      alert(
        "Please select a JPG, PNG, or WEBP image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image must be smaller than 5MB."
      );
      return;
    }

    const preview =
      URL.createObjectURL(file);

    onChange({
      file,
      preview,
      name: file.name,
      isNew: true,
    });
  };

  return (
    <div className="content-image-field">
      <label>{label}</label>

      <div
        className="content-dropzone"
        onDragOver={(e) =>
          e.preventDefault()
        }
        onDrop={(e) => {
          e.preventDefault();

          handleFiles(
            e.dataTransfer.files
          );
        }}
      >
        {value?.preview ? (
          <div className="content-image-preview">
            <img
              src={value.preview}
              alt="Website preview"
            />

            <button
              type="button"
              className="content-image-remove"
              onClick={() =>
                onChange(null)
              }
            >
              Remove Image
            </button>

            {value.isNew && (
              <span
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontSize: "12px",
                }}
              >
                New image ready to upload
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="content-upload-icon">
              <Upload size={22} />
            </div>

            <strong>
              Drag & drop your image here
            </strong>

            <span>
              or click to browse
            </span>

            <label className="content-browse-button">
              <ImageIcon size={16} />

              Choose Image

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  handleFiles(
                    e.target.files
                  )
                }
                hidden
              />
            </label>

            <small>
              JPG, PNG or WEBP • Maximum 5MB
            </small>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN CONTENT
============================================================ */

function AdminContent() {
  const [
    content,
    setContent,
  ] = useState(initialContent);

  const [
    activeSection,
    setActiveSection,
  ] = useState("hero");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const [
    locked,
    setLocked,
  ] = useState(false);

  const [
    attemptsRemaining,
    setAttemptsRemaining,
  ] = useState(null);

  const [
    accessChecking,
    setAccessChecking,
  ] = useState(true);

  /* ==========================================================
     TOKEN
  ========================================================== */

  const getToken = () =>
    localStorage.getItem(
      "rudraksh_admin_token"
    );

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const forceLogout = () => {
    localStorage.removeItem(
      "rudraksh_admin_token"
    );

    localStorage.removeItem(
      "rudraksh_admin"
    );

    window.location.href = "/admin";
  };

  /* ==========================================================
     CHECK CMS ACCESS
     
     IMPORTANT:
     This endpoint is protected server-side.
     
     A normal admin attempting to access CMS
     consumes one security attempt.
  ========================================================== */

  const checkCmsAccess =
    async () => {
      const token = getToken();

      if (!token) {
        forceLogout();
        return false;
      }

      try {
        setAccessChecking(true);
        setError("");

        const response =
          await fetch(
            `${ADMIN_API_URL}/security/content-access`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        /* ----------------------------------------------
           SUPER ADMIN
        ---------------------------------------------- */

        if (
          response.ok &&
          data.success &&
          data.allowed
        ) {
          setAccessDenied(false);
          setLocked(false);
          setAttemptsRemaining(
            data.attempts_remaining ?? 3
          );

          return true;
        }

        /* ----------------------------------------------
           SECURITY LOCK
        ---------------------------------------------- */

        if (
          response.status === 423 ||
          data.code ===
            "ADMIN_SECURITY_LOCKED" ||
          data.locked
        ) {
          setLocked(true);
          setAccessDenied(true);
          setAttemptsRemaining(0);

          return false;
        }

        /* ----------------------------------------------
           CMS RESTRICTED
        ---------------------------------------------- */

        if (
          response.status === 403 ||
          data.code ===
            "CMS_RESTRICTED"
        ) {
          setAccessDenied(true);

          setAttemptsRemaining(
            data.attempts_remaining ??
              null
          );

          return false;
        }

        /* ----------------------------------------------
           SESSION INVALID
        ---------------------------------------------- */

        if (
          response.status === 401
        ) {
          forceLogout();
          return false;
        }

        throw new Error(
          data.message ||
            "Unable to verify CMS access."
        );
      } catch (err) {
        console.error(
          "CMS ACCESS CHECK ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to verify CMS access."
        );

        return false;
      } finally {
        setAccessChecking(false);
      }
    };

  /* ==========================================================
     LOAD CMS
     
     We deliberately use:
     
       /api/settings/content/admin
     
     instead of the public:
     
       /api/settings/content
     
     ========================================================== */

  const loadContent =
    async () => {
      const token = getToken();

      if (!token) {
        forceLogout();
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/content/admin`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          forceLogout();
          return;
        }

        if (
          response.status === 423 ||
          data.code ===
            "ADMIN_SECURITY_LOCKED"
        ) {
          setLocked(true);
          setAccessDenied(true);
          setAttemptsRemaining(0);
          return;
        }

        if (
          response.status === 403 ||
          data.code ===
            "CMS_RESTRICTED"
        ) {
          setAccessDenied(true);

          setAttemptsRemaining(
            data.attempts_remaining ??
              null
          );

          return;
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load website content."
          );
        }

        const databaseContent =
          data.content || {};

        const merged = {
          ...initialContent,
        };

        Object.keys(
          initialContent
        ).forEach(
          (section) => {
            merged[section] = {
              ...initialContent[
                section
              ],

              ...(databaseContent[
                section
              ] || {}),
            };

            if (
              merged[section]
                .image
            ) {
              merged[
                section
              ].image =
                normalizeImage(
                  merged[
                    section
                  ].image
                );
            }
          }
        );

        setContent(merged);
        setAccessDenied(false);
      } catch (err) {
        console.error(
          "LOAD CMS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load website content."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     INITIAL ACCESS CHECK
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const initialize =
      async () => {
        const allowed =
          await checkCmsAccess();

        if (!mounted) return;

        if (allowed) {
          await loadContent();
        } else {
          setLoading(false);
        }
      };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     UPDATE FIELD
  ========================================================== */

  const updateField = (
    section,
    field,
    value
  ) => {
    setContent(
      (current) => ({
        ...current,

        [section]: {
          ...current[
            section
          ],

          [field]: value,
        },
      })
    );

    setSaved(false);
    setMessage("");
  };

  /* ==========================================================
     RESET
  ========================================================== */

  const resetSection =
    () => {
      setContent(
        (current) => ({
          ...current,

          [activeSection]:
            structuredClone(
              initialContent[
                activeSection
              ]
            ),
        })
      );

      setSaved(false);
      setMessage("");
      setError("");
    };

  /* ==========================================================
     SAVE
  ========================================================== */

  const saveSection =
    async (e) => {
      e.preventDefault();

      const token =
        getToken();

      if (!token) {
        forceLogout();
        return;
      }

      try {
        setSaving(true);
        setError("");
        setMessage("");
        setSaved(false);

        const sectionData =
          content[
            activeSection
          ];

        const formData =
          new FormData();

        const cleanData = {
          ...sectionData,
        };

        if (
          cleanData.image &&
          typeof cleanData.image ===
            "object"
        ) {
          if (
            cleanData.image.isNew
          ) {
            cleanData.image = "";
          } else {
            cleanData.image =
              cleanData.image.url ||
              cleanData.image.preview ||
              "";
          }
        }

        formData.append(
          "content",
          JSON.stringify(
            cleanData
          )
        );

        if (
          sectionData.image &&
          typeof sectionData.image ===
            "object" &&
          sectionData.image.file
        ) {
          formData.append(
            "image",
            sectionData.image.file
          );
        }

        const response =
          await fetch(
            `${API_URL}/content/${activeSection}`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: formData,
            }
          );

        const data =
          await response.json();

        /* ----------------------------------------------
           SECURITY LOCK
        ---------------------------------------------- */

        if (
          response.status === 423 ||
          data.code ===
            "ADMIN_SECURITY_LOCKED"
        ) {
          setLocked(true);
          setAccessDenied(true);
          setAttemptsRemaining(0);

          setError(
            data.message ||
              "Your account has been security locked."
          );

          return;
        }

        /* ----------------------------------------------
           RESTRICTED
        ---------------------------------------------- */

        if (
          response.status === 403 ||
          data.code ===
            "CMS_RESTRICTED"
        ) {
          setAccessDenied(true);

          setAttemptsRemaining(
            data.attempts_remaining ??
              null
          );

          setError(
            data.message ||
              "Website Content is restricted."
          );

          return;
        }

        /* ----------------------------------------------
           SESSION INVALID
        ---------------------------------------------- */

        if (
          response.status === 401
        ) {
          forceLogout();
          return;
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to save website content."
          );
        }

        const savedSection =
          {
            ...data.content,
          };

        if (
          savedSection.image
        ) {
          savedSection.image =
            normalizeImage(
              savedSection.image
            );
        }

        setContent(
          (current) => ({
            ...current,

            [activeSection]: {
              ...current[
                activeSection
              ],

              ...savedSection,
            },
          })
        );

        setSaved(true);

        setMessage(
          `${
            sections.find(
              (item) =>
                item.id ===
                activeSection
            )?.label
          } section saved successfully.`
        );

        setTimeout(() => {
          setSaved(false);
          setMessage("");
        }, 3000);
      } catch (err) {
        console.error(
          "SAVE CMS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to save website content."
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================
     ACTIVE SECTION
  ========================================================== */

  const section =
    content[
      activeSection
    ];

  /* ==========================================================
     ACCESS CHECK SCREEN
  ========================================================== */

  if (accessChecking) {
    return (
      <div className="admin-content-page">
        <div
          style={{
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <Loader2
            size={32}
            className="admin-projects-spin"
          />

          <strong>
            Verifying CMS access...
          </strong>

          <span
            style={{
              opacity: 0.65,
              fontSize: "13px",
            }}
          >
            Checking Super Administrator
            permissions
          </span>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RESTRICTED / LOCKED SCREEN
  ========================================================== */

  if (accessDenied) {
    return (
      <div className="admin-content-page">
        <div
          style={{
            minHeight: "650px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              padding: "42px",
              borderRadius: "18px",
              border:
                "1px solid rgba(239,68,68,.25)",
              background:
                "rgba(239,68,68,.06)",
              textAlign: "center",
              boxShadow:
                "0 20px 70px rgba(0,0,0,.2)",
            }}
          >
            {locked ? (
              <LockKeyhole
                size={56}
                color="#ef4444"
                style={{
                  marginBottom: "20px",
                }}
              />
            ) : (
              <ShieldAlert
                size={56}
                color="#f59e0b"
                style={{
                  marginBottom: "20px",
                }}
              />
            )}

            <h1
              style={{
                margin: "0 0 12px",
              }}
            >
              {locked
                ? "Account Security Lock"
                : "Access Restricted"}
            </h1>

            <p
              style={{
                lineHeight: 1.7,
                opacity: 0.75,
                marginBottom: "20px",
              }}
            >
              {locked
                ? "You have been blocked by the system. Your IP address has been marked as terminated. Please contact the Super Admin."
                : "Website Content can only be accessed by the Super Administrator."}
            </p>

            {!locked &&
              attemptsRemaining !==
                null && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding:
                      "10px 16px",
                    borderRadius: "999px",
                    background:
                      "rgba(245,158,11,.1)",
                    color: "#f59e0b",
                    marginBottom:
                      "24px",
                    fontWeight: 700,
                  }}
                >
                  <AlertCircle
                    size={16}
                  />

                  Security attempts
                  remaining:{" "}
                  {
                    attemptsRemaining
                  }
                </div>
              )}

            {locked && (
              <div
                style={{
                  padding: "15px",
                  marginBottom:
                    "24px",
                  borderRadius: "10px",
                  background:
                    "rgba(239,68,68,.08)",
                  color: "#ef4444",
                  fontWeight: 700,
                }}
              >
                Attempts remaining: 0
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin";
              }}
              style={{
                border: "none",
                borderRadius: "10px",
                padding:
                  "12px 22px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="admin-content-page">
        <div
          style={{
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <Loader2
            size={30}
            className="admin-projects-spin"
          />

          <span>
            Loading website content...
          </span>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <div className="admin-content-page">
      {/* HEADER */}

      <div className="content-page-heading">
        <div>
          <span className="content-eyebrow">
            WEBSITE CMS
          </span>

          <h1>
            Website Content
          </h1>

          <p>
            Manage the main content and
            images displayed across the
            public Rudraksh website.
          </p>
        </div>

        <div className="content-status">
          <Globe size={16} />

          <span>
            Super Admin CMS
          </span>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            background:
              "rgba(220, 38, 38, 0.1)",
            border:
              "1px solid rgba(220, 38, 38, 0.25)",
            color: "#ef4444",
          }}
        >
          <AlertCircle size={17} />

          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            background:
              "rgba(34, 197, 94, 0.1)",
            border:
              "1px solid rgba(34, 197, 94, 0.25)",
            color: "#22c55e",
          }}
        >
          <CheckCircle2 size={17} />

          <span>{message}</span>
        </div>
      )}

      {/* LAYOUT */}

      <div className="content-layout">
        <aside className="content-section-nav">
          <div className="content-nav-title">
            SECTIONS
          </div>

          {sections.map((item) => {
            const Icon = item.icon;

            const active =
              activeSection ===
              item.id;

            return (
              <button
                type="button"
                key={item.id}
                className={`content-nav-item ${
                  active
                    ? "content-nav-active"
                    : ""
                }`}
                onClick={() => {
                  setActiveSection(
                    item.id
                  );

                  setSaved(false);
                  setMessage("");
                  setError("");
                }}
              >
                <Icon size={18} />

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}

          <div className="content-nav-note">
            <strong>
              MySQL CMS
            </strong>

            <span>
              Changes are saved directly
              to the website database.
            </span>
          </div>
        </aside>

        <main className="content-editor">
          <form
            onSubmit={saveSection}
          >
            {/* HERO */}

            {activeSection ===
              "hero" && (
              <>
                <EditorHeader
                  icon={Home}
                  title="Hero Section"
                  description="Control the first section visitors see on the homepage."
                />

                <div className="content-form-grid">
                  <TextField
                    label="Eyebrow"
                    value={
                      section.eyebrow
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "hero",
                        "eyebrow",
                        value
                      )
                    }
                  />

                  <TextField
                    label="Button Text"
                    value={
                      section.buttonText
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "hero",
                        "buttonText",
                        value
                      )
                    }
                  />

                  <TextField
                    className="full"
                    label="Hero Title"
                    value={
                      section.title
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "hero",
                        "title",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Hero Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "hero",
                        "description",
                        value
                      )
                    }
                  />

                  <div className="full">
                    <ImageDropzone
                      label="Hero Image"
                      value={
                        section.image
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "hero",
                          "image",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* IMPACT */}

            {activeSection ===
              "impact" && (
              <>
                <EditorHeader
                  icon={BarChart3}
                  title="Impact Section"
                  description="Update the numbers and text shown in the impact section."
                />

                <div className="content-form-grid">
                  <TextField
                    className="full"
                    label="Section Heading"
                    value={
                      section.heading
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "impact",
                        "heading",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Section Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "impact",
                        "description",
                        value
                      )
                    }
                  />

                  {[1, 2, 3, 4].map(
                    (number) => (
                      <div
                        className="content-stat-editor"
                        key={number}
                      >
                        <span>
                          STAT{" "}
                          {number}
                        </span>

                        <TextField
                          label="Number"
                          value={
                            section[
                              `stat${number}Number`
                            ]
                          }
                          onChange={(
                            value
                          ) =>
                            updateField(
                              "impact",
                              `stat${number}Number`,
                              value
                            )
                          }
                        />

                        <TextField
                          label="Label"
                          value={
                            section[
                              `stat${number}Label`
                            ]
                          }
                          onChange={(
                            value
                          ) =>
                            updateField(
                              "impact",
                              `stat${number}Label`,
                              value
                            )
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* ABOUT */}

            {activeSection ===
              "about" && (
              <>
                <EditorHeader
                  icon={Info}
                  title="About Section"
                  description="Manage the main organization introduction."
                />

                <div className="content-form-grid">
                  <TextField
                    label="Eyebrow"
                    value={
                      section.eyebrow
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "about",
                        "eyebrow",
                        value
                      )
                    }
                  />

                  <TextField
                    className="full"
                    label="Title"
                    value={
                      section.title
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "about",
                        "title",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "about",
                        "description",
                        value
                      )
                    }
                  />

                  <div className="full">
                    <ImageDropzone
                      label="About Image"
                      value={
                        section.image
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "about",
                          "image",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* MEMBERSHIP */}

            {activeSection ===
              "membership" && (
              <>
                <EditorHeader
                  icon={Users}
                  title="Membership Section"
                  description="Control the membership call-to-action on the website."
                />

                <div className="content-form-grid">
                  <TextField
                    label="Eyebrow"
                    value={
                      section.eyebrow
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "membership",
                        "eyebrow",
                        value
                      )
                    }
                  />

                  <TextField
                    label="Button Text"
                    value={
                      section.buttonText
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "membership",
                        "buttonText",
                        value
                      )
                    }
                  />

                  <TextField
                    className="full"
                    label="Title"
                    value={
                      section.title
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "membership",
                        "title",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "membership",
                        "description",
                        value
                      )
                    }
                  />

                  <div className="full">
                    <ImageDropzone
                      label="Membership Image"
                      value={
                        section.image
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "membership",
                          "image",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* CONTACT */}

            {activeSection ===
              "contact" && (
              <>
                <EditorHeader
                  icon={Phone}
                  title="Contact Section"
                  description="Update public contact information displayed on the website."
                />

                <div className="content-form-grid">
                  <TextField
                    className="full"
                    label="Title"
                    value={
                      section.title
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "title",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "description",
                        value
                      )
                    }
                  />

                  <TextArea
                    className="full"
                    label="Address"
                    value={
                      section.address
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "address",
                        value
                      )
                    }
                  />

                  <TextField
                    label="Phone"
                    value={
                      section.phone
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "phone",
                        value
                      )
                    }
                  />

                  <TextField
                    label="Email"
                    value={
                      section.email
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "email",
                        value
                      )
                    }
                  />

                  <TextField
                    className="full"
                    label="Google Maps URL"
                    value={
                      section.mapUrl
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "contact",
                        "mapUrl",
                        value
                      )
                    }
                  />
                </div>
              </>
            )}

            {/* FOOTER */}

            {activeSection ===
              "footer" && (
              <>
                <EditorHeader
                  icon={PanelBottom}
                  title="Footer Section"
                  description="Manage the public footer text and logo."
                />

                <div className="content-form-grid">
                  <TextArea
                    className="full"
                    label="Footer Description"
                    value={
                      section.description
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "footer",
                        "description",
                        value
                      )
                    }
                  />

                  <TextField
                    className="full"
                    label="Copyright Text"
                    value={
                      section.copyright
                    }
                    onChange={(
                      value
                    ) =>
                      updateField(
                        "footer",
                        "copyright",
                        value
                      )
                    }
                  />

                  <div className="full">
                    <ImageDropzone
                      label="Website Logo"
                      value={
                        section.logo
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "footer",
                          "logo",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* ACTIONS */}

            <div className="content-editor-actions">
              <button
                type="button"
                className="content-reset-button"
                onClick={
                  resetSection
                }
                disabled={saving}
              >
                <RotateCcw
                  size={16}
                />

                Reset
              </button>

              <button
                type="submit"
                className="content-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="admin-projects-spin"
                    />

                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2
                      size={17}
                    />

                    Saved
                  </>
                ) : (
                  <>
                    <Save size={17} />

                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   EDITOR HEADER
============================================================ */

function EditorHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="content-editor-header">
      <div className="content-editor-icon">
        <Icon size={22} />
      </div>

      <div>
        <span>
          EDIT CONTENT
        </span>

        <h2>{title}</h2>

        <p>{description}</p>
      </div>
    </div>
  );
}

/* ============================================================
   TEXT FIELD
============================================================ */

function TextField({
  label,
  value,
  onChange,
  className = "",
}) {
  return (
    <label
      className={`content-field ${className}`}
    >
      <span>{label}</span>

      <input
        type="text"
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      />
    </label>
  );
}

/* ============================================================
   TEXT AREA
============================================================ */

function TextArea({
  label,
  value,
  onChange,
  className = "",
}) {
  return (
    <label
      className={`content-field ${className}`}
    >
      <span>{label}</span>

      <textarea
        rows={5}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      />
    </label>
  );
}

export default AdminContent;