import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./MembersPreview.css";

const API_URL = "http://localhost:5000/api/members";
const BACKEND_URL = "http://localhost:5000";

function MembersPreview() {
  const sectionRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load members."
          );
        }

        setMembers(data.members || []);
      } catch (err) {
        console.error("PUBLIC MEMBERS LOAD ERROR:", err);
        setError("Unable to load members right now.");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements = section.querySelectorAll(
        ".members-heading, .members-intro, .member-card, .members-bottom, .members-empty-state"
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
      dependencies: [members.length, loading],
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

  const visibleMembers = members.slice(0, 6);

  return (
    <section
      ref={sectionRef}
      id="members"
      className="members-preview"
    >
      <div className="members-container">
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
              Active members published through the Admin
              Panel will appear here.
            </p>
          </div>
        </div>

        <div className="members-grid">
          {loading && (
            <div className="members-empty-state">
              Loading members...
            </div>
          )}

          {!loading && error && (
            <div className="members-empty-state">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            members.length === 0 && (
              <div className="members-empty-state">
                <strong>No members published yet.</strong>
                <span>
                  Add active members from the Admin Panel
                  to populate this section.
                </span>
              </div>
            )}

          {!loading &&
            !error &&
            visibleMembers.map((member, index) => (
              <article
                key={member.id}
                className="member-card"
              >
                <div className="member-image-wrap">
                  {member.photo_url ? (
                    <img
                      src={getImageUrl(member.photo_url)}
                      alt={member.name}
                      className="member-image"
                    />
                  ) : (
                    <div className="member-image member-image-empty">
                      <span>No photo</span>
                    </div>
                  )}

                  <div className="member-image-overlay" />

                  <span className="member-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="member-content">
                  <div>
                    <h3>{member.name}</h3>

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
            ))}
        </div>

        {!loading &&
          !error &&
          members.length > 0 && (
            <div className="members-bottom">
              <div className="members-count">
                <strong>{members.length}</strong>

                <span>
                  active people currently connected
                  <br />
                  with Rudraksh
                </span>
              </div>

              <a
                href="#membership"
                className="members-join"
              >
                Become Part of Rudraksh
                <span>→</span>
              </a>
            </div>
          )}

        {members.length === 0 &&
          !loading &&
          !error && (
            <div className="members-bottom">
              <div className="members-count">
                <strong>0</strong>

                <span>
                  active members currently published
                  <br />
                  on the website
                </span>
              </div>

              <a
                href="#membership"
                className="members-join"
              >
                Become Part of Rudraksh
                <span>→</span>
              </a>
            </div>
          )}
      </div>
    </section>
  );
}

export default MembersPreview;
