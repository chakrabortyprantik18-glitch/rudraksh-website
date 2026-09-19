import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./GalleryPreview.css";

const API_URL = "http://localhost:5000/api/gallery";
const BACKEND_URL = "http://localhost:5000";

function GalleryPreview() {
  const sectionRef = useRef(null);

  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load gallery."
          );
        }

        setGalleryItems(data.gallery || []);
      } catch (err) {
        console.error("PUBLIC GALLERY LOAD ERROR:", err);
        setError("Unable to load gallery right now.");
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements = section.querySelectorAll(
        ".gallery-heading, .gallery-intro, .gallery-item, .gallery-view-all, .gallery-empty-state"
      );

      gsap.set(elements, {
        opacity: 1,
        y: 0,
        x: 0,
      });

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const visible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      if (visible) {
        gsap.fromTo(
          elements,
          {
            y: 35,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.08,
            ease: "power3.out",
          }
        );
      } else {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          })
          .from(elements, {
            y: 35,
            opacity: 0,
            duration: 0.75,
            stagger: 0.08,
            ease: "power3.out",
          });
      }
    },
    {
      scope: sectionRef,
      dependencies: [galleryItems.length, loading],
    }
  );

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/uploads/")) {
      return `${BACKEND_URL}${image}`;
    }

    return image;
  };

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="gallery-preview"
    >
      <div className="gallery-container">
        <div className="gallery-header">
          <div className="gallery-heading">
            <div className="section-eyebrow">
              <span />
              MOMENTS & MEMORIES
            </div>

            <h2>
              Stories captured,
              <br />
              <em>moments remembered.</em>
            </h2>
          </div>

          <div className="gallery-intro">
            <p>
              Photos published from the Admin Panel will
              appear here.
            </p>
          </div>
        </div>

        <div className="gallery-grid">
          {loading && (
            <div className="gallery-empty-state">
              Loading gallery...
            </div>
          )}

          {!loading && error && (
            <div className="gallery-empty-state">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            galleryItems.length === 0 && (
              <div className="gallery-empty-state">
                <strong>No gallery photos published yet.</strong>
                <span>
                  Upload photos from the Admin Panel to
                  populate this section.
                </span>
              </div>
            )}

          {!loading &&
            !error &&
            galleryItems.map((item, index) => (
              <a
                key={item.id}
                href="#gallery"
                className={`gallery-item ${
                  index === 0
                    ? "gallery-item-large"
                    : ""
                }`}
              >
                <div className="gallery-image-wrap">
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={
                      item.title ||
                      item.category ||
                      "Rudraksh gallery"
                    }
                    className="gallery-image"
                  />

                  <div className="gallery-image-overlay" />

                  <span className="gallery-label">
                    {item.title ||
                      item.category ||
                      "Rudraksh"}
                  </span>

                  <span className="gallery-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="gallery-card-arrow">
                    ↗
                  </span>
                </div>
              </a>
            ))}
        </div>

        <a
          href="#gallery"
          className="gallery-view-all"
        >
          View Full Gallery
          <span>↗</span>
        </a>
      </div>
    </section>
  );
}

export default GalleryPreview;
