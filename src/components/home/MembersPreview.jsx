import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "../../services/gsap";
import "./MembersPreview.css";
import { BACKEND_URL } from "../../config/api";

const API_URL = `${BACKEND_URL}/api/members?limit=3`;

function MembersPreview() {
  const sectionRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD MEMBERS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load members."
          );
        }

        if (cancelled) {
          return;
        }

        const previewMembers = Array.isArray(data.members)
          ? data.members.slice(0, 3)
          : [];

        setMembers(previewMembers);

        setTotalMembers(
          Number(
            data.total ??
              data.count ??
              data.members?.length ??
              0
          )
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("PUBLIC MEMBERS LOAD ERROR:", err);

        setError("Unable to load members right now.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     GSAP
     IMPORTANT:
     No opacity animation.
     Content stays visible on first load.
  ========================================================= */

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements = section.querySelectorAll(
        ".members-heading, .members-intro, .member-gallery-card, .members-bottom, .members-empty-state"
      );

      /*
       * Always keep content visible.
       * Only reset position for the animation.
       */
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
        /*
         * Section is already visible when the page loads.
         * Animate position only — never fade it out.
         */
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
         * When scrolling into the section,
         * use movement only.
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
      dependencies: [members.length, loading],
    }
  );

  /* =========================================================
     IMAGE URL
  ========================================================= */

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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      ref={sectionRef}
      id="members"
      className="members-preview"
    >
      <div className="members-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="members-header">

          <div className="members-heading">

            <div className="section-eyebrow">
              <span />
              THE PEOPLE
            </div>

            <h2>
              People make
              <br />
              <em>the difference.</em>
            </h2>

          </div>

          <div className="members-intro">

            <p>
              Meet the people who are part
              of the Rudraksh community.
            </p>

            <Link
              to="/members"
              className="members-gallery-link"
            >
              View Full Members Gallery
              <span>↗</span>
            </Link>

          </div>

        </div>

        {/* =================================================
            MEMBERS GALLERY
        ================================================= */}

        {loading && (
          <div className="members-gallery-grid">

            <div className="members-empty-state">
              Loading members...
            </div>

          </div>
        )}

        {!loading && error && (
          <div className="members-gallery-grid">

            <div className="members-empty-state">
              {error}
            </div>

          </div>
        )}

        {!loading &&
          !error &&
          members.length === 0 && (
            <div className="members-gallery-grid">

              <div className="members-empty-state">

                <strong>
                  No members published yet.
                </strong>

                <span>
                  Add active members from
                  the Admin Panel to populate
                  this section.
                </span>

              </div>

            </div>
          )}

        {!loading &&
          !error &&
          members.length > 0 && (

            <div className="members-gallery-grid">

              {members.map((member, index) => {

                const imageUrl = getImageUrl(
                  member.photo_url
                );

                return (
                  <Link
                    key={member.id}
                    to="/members"
                    className={`member-gallery-card ${
                      index === 0
                        ? "member-gallery-card-large"
                        : ""
                    }`}
                  >

                    <div className="member-gallery-image-wrap">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={
                            member.name ||
                            "Rudraksh member"
                          }
                          className="member-gallery-image"
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
                      ) : (
                        <div className="member-gallery-image-empty">
                          No photo
                        </div>
                      )}

                      <div className="member-gallery-overlay" />

                      <span className="member-gallery-label">
                        {member.position ||
                          "RUDRAKSH MEMBER"}
                      </span>

                      <span className="member-gallery-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="member-gallery-plus">
                        +
                      </span>

                    </div>

                    <div className="member-gallery-content">

                      <div>

                        <h3>
                          {member.name ||
                            "Rudraksh Member"}
                        </h3>

                        <p>
                          {member.position ||
                            "Rudraksh Member"}
                        </p>

                      </div>

                      <span className="member-gallery-arrow">
                        ↗
                      </span>

                    </div>

                  </Link>
                );
              })}

            </div>
          )}

        {/* =================================================
            BOTTOM
        ================================================= */}

        {!loading &&
          !error && (
            <div className="members-bottom">

              <div className="members-count">

                <strong>
                  {totalMembers}
                </strong>

                <span>
                  active people currently
                  connected
                  <br />
                  with Rudraksh
                </span>

              </div>

              <div className="members-bottom-actions">

                <Link
                  to="/members"
                  className="members-view-all"
                >
                  View All Members
                  <span>↗</span>
                </Link>

                <Link
                  to="/#membership"
                  className="members-join"
                >
                  Become Part of Rudraksh
                  <span>→</span>
                </Link>

              </div>

            </div>
          )}

      </div>
    </section>
  );
}

export default MembersPreview;