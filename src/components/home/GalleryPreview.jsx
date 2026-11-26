import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./GalleryPreview.css";

import { BACKEND_URL } from "../../config/api";

const API_URL = `${BACKEND_URL}/api/gallery?limit=5`;

function GalleryPreview() {
  const sectionRef = useRef(null);

  const [galleryItems, setGalleryItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * ============================================================
   * LOAD ONLY 5 GALLERY ITEMS
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadGallery = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load gallery."
          );
        }

        if (cancelled) {
          return;
        }

        const items = Array.isArray(data.gallery)
          ? data.gallery.slice(0, 5)
          : [];

        setGalleryItems(items);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "PUBLIC GALLERY LOAD ERROR:",
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

  /*
   * ============================================================
   * GSAP
   *
   * IMPORTANT:
   * We intentionally do NOT animate opacity.
   *
   * The previous implementation used opacity: 0 as the
   * animation starting point. That could make the section
   * appear faded during the initial page load.
   *
   * Everything remains fully visible and GSAP only provides
   * a small vertical entrance movement.
   * ============================================================
   */

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements = section.querySelectorAll(
        ".gallery-heading, .gallery-intro, .gallery-item, .gallery-view-all, .gallery-empty-state"
      );

      if (!elements.length) {
        return;
      }

      /*
       * Always keep everything fully visible.
       */

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

      const rect =
        section.getBoundingClientRect();

      const visible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      /*
       * If the section is already visible when the page
       * loads, give it a very small movement only.
       *
       * No opacity animation.
       */

      if (visible) {
        gsap.fromTo(
          elements,
          {
            y: 18,
            opacity: 1,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
            clearProps: "transform",
          }
        );
      } else {
        /*
         * When below the viewport, animate only when it
         * enters the viewport.
         */

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          })
          .fromTo(
            elements,
            {
              y: 18,
              opacity: 1,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              stagger: 0.06,
              ease: "power3.out",
              clearProps: "transform",
            }
          );
      }
    },
    {
      scope: sectionRef,
      dependencies: [
        galleryItems.length,
        loading,
      ],
    }
  );

  /*
   * ============================================================
   * IMAGE URL
   * ============================================================
   */

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

    if (image.startsWith("/uploads/")) {
      return `${BACKEND_URL}${image}`;
    }

    if (image.startsWith("/")) {
      return `${BACKEND_URL}${image}`;
    }

    return `${BACKEND_URL}/${image}`;
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="gallery-preview"
    >
      <div className="gallery-container">

        {/* =========================
            HEADER
        ========================== */}

        <div className="gallery-header">

          <div className="gallery-heading">

            <div className="section-eyebrow">
              <span />
              MOMENTS & MEMORIES
            </div>

            <h2>
              Stories captured,
              <br />
              <em>
                moments remembered.
              </em>
            </h2>

          </div>

          <div className="gallery-intro">

            <p>
              A glimpse into the
              moments, people and
              initiatives that make
              Rudraksh special.
            </p>

          </div>

        </div>

        {/* =========================
            GALLERY GRID
        ========================== */}

        <div className="gallery-grid">

          {/* LOADING */}

          {loading && (
            <div className="gallery-empty-state">
              Loading gallery...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="gallery-empty-state">
              {error}
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            galleryItems.length === 0 && (
              <div className="gallery-empty-state">

                <strong>
                  No gallery photos
                  published yet.
                </strong>

                <span>
                  Upload photos from
                  the Admin Panel to
                  populate this section.
                </span>

              </div>
            )}

          {/* ITEMS */}

          {!loading &&
            !error &&
            galleryItems.map(
              (item, index) => (
                <Link
                  key={item.id}
                  to="/gallery"
                  className={`gallery-item ${
                    index === 0
                      ? "gallery-item-large"
                      : ""
                  }`}
                >

                  <div className="gallery-image-wrap">

                    <img
                      src={getImageUrl(
                        item.image_url
                      )}
                      alt={
                        item.title ||
                        item.category ||
                        "Rudraksh gallery"
                      }
                      className="gallery-image"
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                    <div className="gallery-image-overlay" />

                    <span className="gallery-label">
                      {item.title ||
                        item.category ||
                        "Rudraksh"}
                    </span>

                    <span className="gallery-index">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <span className="gallery-card-arrow">
                      ↗
                    </span>

                  </div>

                </Link>
              )
            )}

        </div>

        {/* =========================
            FULL GALLERY BUTTON
        ========================== */}

        <Link
          to="/gallery"
          className="gallery-view-all"
        >
          View Full Gallery

          <span>
            ↗
          </span>
        </Link>

      </div>
    </section>
  );
}

export default GalleryPreview;