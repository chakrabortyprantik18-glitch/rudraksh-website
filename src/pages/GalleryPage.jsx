import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../services/gsap";
import { BACKEND_URL } from "../config/api";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ChatBot from "../components/common/ChatBot";

import "./GalleryPage.css";

const API_URL = `${BACKEND_URL}/api/gallery`;

function GalleryPage() {
  const pageRef = useRef(null);

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  /* ============================================================
     LOAD GALLERY
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadGallery = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load gallery."
          );
        }

        if (cancelled) {
          return;
        }

        setGallery(
          Array.isArray(data.gallery)
            ? data.gallery
            : []
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "GALLERY PAGE LOAD ERROR:",
          err
        );

        setError(
          "Unable to load gallery right now."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     IMAGE URL
  ============================================================ */

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${BACKEND_URL}${image}`;
    }

    return `${BACKEND_URL}/${image}`;
  };

  /* ============================================================
     GSAP
  ============================================================ */

  useGSAP(
    () => {
      const page = pageRef.current;

      if (!page) {
        return;
      }

      const elements =
        page.querySelectorAll(
          ".gallery-page-hero-content > *, .gallery-page-card, .gallery-page-empty"
        );

      gsap.set(elements, {
        opacity: 1,
        y: 0,
        x: 0,
      });

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (prefersReducedMotion) {
        return;
      }

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    },
    {
      scope: pageRef,
      dependencies: [
        gallery.length,
        loading,
      ],
    }
  );

  /* ============================================================
     CLOSE LIGHTBOX
  ============================================================ */

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  /* ============================================================
     KEYBOARD
  ============================================================ */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <Navbar />

      <main
        ref={pageRef}
        className="gallery-page"
      >
        {/* ==================================================
            HERO
        ================================================== */}

        <section className="gallery-page-hero">
          <div className="gallery-page-hero-content">
            <div className="section-eyebrow">
              <span />
              MOMENTS & MEMORIES
            </div>

            <h1>
              Stories captured,
              <br />
              <em>
                moments remembered.
              </em>
            </h1>

            <p>
              Explore moments from the
              social, cultural and
              community initiatives of
              Rudraksh.
            </p>
          </div>

          <div className="gallery-page-count">
            <span>
              {String(
                gallery.length
              ).padStart(2, "0")}
            </span>

            <small>
              PHOTOS
            </small>
          </div>
        </section>

        {/* ==================================================
            GALLERY
        ================================================== */}

        <section className="gallery-page-content">
          {loading && (
            <div className="gallery-page-empty">
              <span>
                LOADING
              </span>

              <h2>
                Loading gallery...
              </h2>
            </div>
          )}

          {!loading &&
            error && (
              <div className="gallery-page-empty">
                <span>
                  ERROR
                </span>

                <h2>
                  Unable to load
                  <br />
                  gallery.
                </h2>

                <p>
                  {error}
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            gallery.length === 0 && (
              <div className="gallery-page-empty">
                <span>
                  NO PHOTOS
                </span>

                <h2>
                  No gallery photos
                  <br />
                  published yet.
                </h2>

                <p>
                  Photos uploaded and
                  published from the
                  Admin Panel will appear
                  here automatically.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            gallery.length > 0 && (
              <div className="gallery-page-grid">
                {gallery.map(
                  (item, index) => (
                    <article
                      key={item.id}
                      className="gallery-page-card"
                      onClick={() =>
                        setSelectedImage(
                          item
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          setSelectedImage(
                            item
                          );
                        }
                      }}
                    >
                      <div className="gallery-page-image-wrap">
                        {item.image_url ? (
                          <img
                            src={getImageUrl(
                              item.image_url
                            )}
                            alt={
                              item.title ||
                              item.category ||
                              "Rudraksh gallery"
                            }
                            className="gallery-page-image"
                            loading={
                              index === 0
                                ? "eager"
                                : "lazy"
                            }
                          />
                        ) : (
                          <div className="gallery-page-image gallery-page-image-empty">
                            <span>
                              No image
                            </span>
                          </div>
                        )}

                        <div className="gallery-page-overlay" />

                        <span className="gallery-page-number">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <span className="gallery-page-arrow">
                          ↗
                        </span>
                      </div>

                      <div className="gallery-page-card-content">
                        <span className="gallery-page-category">
                          {item.category ||
                            "RUDRAKSH"}
                        </span>

                        <h3>
                          {item.title ||
                            "Community Moment"}
                        </h3>

                        {item.description && (
                          <p>
                            {
                              item.description
                            }
                          </p>
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </section>
      </main>

      {/* ====================================================
          LIGHTBOX
      ==================================================== */}

      {selectedImage && (
        <div
          className="gallery-lightbox"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="gallery-lightbox-content"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <img
              src={getImageUrl(
                selectedImage.image_url
              )}
              alt={
                selectedImage.title ||
                "Rudraksh gallery"
              }
              className="gallery-lightbox-image"
            />

            {(selectedImage.title ||
              selectedImage.description) && (
              <div className="gallery-lightbox-info">
                {selectedImage.title && (
                  <h2>
                    {
                      selectedImage.title
                    }
                  </h2>
                )}

                {selectedImage.description && (
                  <p>
                    {
                      selectedImage.description
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />

      <ChatBot />
    </>
  );
}

export default GalleryPage;