import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BACKEND_URL } from "../config/api";
import "./MembersPage.css";

const getImageUrl = (image) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${BACKEND_URL}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${BACKEND_URL}/api/members?limit=100`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load members."
          );
        }

        setMembers(data.members || []);
      } catch (err) {
        console.error("MEMBERS PAGE ERROR:", err);

        setError(
          err.message || "Unable to load members."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  return (
    <main className="members-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="members-page-hero">
        <div className="members-page-container">

          <Link
            to="/"
            className="members-page-back"
          >
            ← Back to Home
          </Link>

          <div className="members-page-heading">

            <div>
              <span className="members-page-kicker">
                RUDRAKSH COMMUNITY
              </span>

              <h1>
                THE <em>PEOPLE</em>
              </h1>
            </div>

            <p>
              Meet the people who contribute their time,
              energy and passion to Rudraksh Social &
              Cultural Organization.
            </p>

          </div>
        </div>
      </section>

      {/* =====================================================
          MEMBERS GALLERY
      ===================================================== */}

      <section className="members-page-gallery">
        <div className="members-page-container">

          {/* LOADING */}

          {loading && (
            <div className="members-page-state">
              <strong>
                Loading members...
              </strong>

              <span>
                Please wait while we load the community.
              </span>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="members-page-state">
              <strong>
                Unable to load members
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            members.length === 0 && (
              <div className="members-page-state">

                <strong>
                  No members available
                </strong>

                <span>
                  Member information has not been added yet.
                </span>

              </div>
            )}

          {/* MEMBERS */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="members-page-grid">

                {members.map((member, index) => {

                  /*
                    IMPORTANT:
                    The existing Members system stores
                    the uploaded image in photo_url.
                  */

                  const image = getImageUrl(
                    member.photo_url
                  );

                  return (
                    <article
                      className="members-page-card"
                      key={member.id || index}
                    >

                      {/* IMAGE */}

                      <div className="members-page-image-wrap">

                        {image ? (
                          <img
                            src={image}
                            alt={
                              member.name ||
                              "Rudraksh member"
                            }
                            className="members-page-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="members-page-image-empty">
                            No Photo
                          </div>
                        )}

                        <div className="members-page-overlay" />

                        <span className="members-page-index">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="members-page-label">
                          {member.position ||
                            "RUDRAKSH MEMBER"}
                        </span>

                        <span className="members-page-plus">
                          +
                        </span>

                      </div>

                      {/* CONTENT */}

                      <div className="members-page-card-content">

                        <div>

                          <h2>
                            {member.name ||
                              "Rudraksh Member"}
                          </h2>

                          <p>
                            {member.position ||
                              "RUDRAKSH MEMBER"}
                          </p>

                        </div>

                        <span className="members-page-arrow">
                          ↗
                        </span>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          {/* FOOTER */}

          {!loading &&
            !error &&
            members.length > 0 && (

              <div className="members-page-footer">

                <span>
                  {members.length}{" "}
                  {members.length === 1
                    ? "MEMBER"
                    : "MEMBERS"}
                </span>

                <Link to="/">
                  Return to Rudraksh →
                </Link>

              </div>
            )}

        </div>
      </section>

    </main>
  );
}