import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./MembersPreview.css";

import { BACKEND_URL } from "../../config/api";

const API_URL =
  `${BACKEND_URL}/api/members?limit=5`;

function MembersPreview() {
  const sectionRef = useRef(null);

  const [members, setMembers] =
    useState([]);

  const [totalMembers, setTotalMembers] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * LOAD ONLY 5 MEMBERS FOR HOMEPAGE
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(API_URL);

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load members."
          );
        }

        if (cancelled) {
          return;
        }

        const previewMembers =
          Array.isArray(data.members)
            ? data.members.slice(0, 5)
            : [];

        setMembers(
          previewMembers
        );

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

        console.error(
          "PUBLIC MEMBERS LOAD ERROR:",
          err
        );

        setError(
          "Unable to load members right now."
        );
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
          ".members-heading, .members-intro, .member-card, .members-bottom, .members-empty-state"
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

      if (
        prefersReducedMotion
      ) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

      const visible =
        rect.top <
          window.innerHeight &&
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
      dependencies: [
        members.length,
        loading,
      ],
    }
  );

  /*
   * ============================================================
   * IMAGE URL
   * ============================================================
   */

  const getImageUrl = (
    image
  ) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith(
        "http://"
      ) ||
      image.startsWith(
        "https://"
      ) ||
      image.startsWith("data:")
    ) {
      return image;
    }

    if (
      image.startsWith(
        "/uploads/"
      )
    ) {
      return `${BACKEND_URL}${image}`;
    }

    if (
      image.startsWith("/")
    ) {
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
      id="members"
      className="members-preview"
    >
      <div className="members-container">

        {/* =========================
            HEADER
        ========================== */}

        <div className="members-header">

          <div className="members-heading">

            <div className="section-eyebrow">
              <span />
              THE PEOPLE
            </div>

            <h2>
              People make
              <br />
              <em>
                the difference.
              </em>
            </h2>

          </div>

          <div className="members-intro">
            <p>
              Meet some of the people
              who are part of the
              Rudraksh community.
            </p>
          </div>

        </div>

        {/* =========================
            MEMBER GRID
        ========================== */}

        <div className="members-grid">

          {/* LOADING */}

          {loading && (
            <div className="members-empty-state">
              Loading members...
            </div>
          )}

          {/* ERROR */}

          {!loading &&
            error && (
              <div className="members-empty-state">
                {error}
              </div>
            )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            members.length === 0 && (
              <div className="members-empty-state">

                <strong>
                  No members published yet.
                </strong>

                <span>
                  Add active members from
                  the Admin Panel to
                  populate this section.
                </span>

              </div>
            )}

          {/* MEMBERS */}

          {!loading &&
            !error &&
            members.map(
              (member, index) => (
                <article
                  key={member.id}
                  className="member-card"
                >
                  <div className="member-image-wrap">

                    {member.photo_url ? (
                      <img
                        src={getImageUrl(
                          member.photo_url
                        )}
                        alt={
                          member.name ||
                          "Rudraksh member"
                        }
                        className="member-image"
                        loading={
                          index === 0
                            ? "eager"
                            : "lazy"
                        }
                      />
                    ) : (
                      <div className="member-image member-image-empty">
                        <span>
                          No photo
                        </span>
                      </div>
                    )}

                    <div className="member-image-overlay" />

                    <span className="member-index">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                  </div>

                  <div className="member-content">

                    <div>
                      <h3>
                        {member.name}
                      </h3>

                      <p>
                        {member.position ||
                          "Rudraksh Member"}
                      </p>
                    </div>

                    <span className="member-arrow">
                      ↗
                    </span>

                  </div>
                </article>
              )
            )}

        </div>

        {/* =========================
            BOTTOM
        ========================== */}

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

                  <span>
                    ↗
                  </span>
                </Link>

                <Link
                  to="/#membership"
                  className="members-join"
                >
                  Become Part of Rudraksh

                  <span>
                    →
                  </span>
                </Link>

              </div>

            </div>
          )}

      </div>
    </section>
  );
}

export default MembersPreview;