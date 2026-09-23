import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { BACKEND_URL } from "../../config/api";
import "./MembersPreview.css";

const API_URL = `${BACKEND_URL}/api/members?limit=3`;

const getImageUrl = (image) => {
  if (!image) return "";

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

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function MembersPreview() {
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to load members");
        }

        const data = await response.json();

        if (!mounted) return;

        if (data?.success) {
          const memberList = Array.isArray(data.members)
            ? data.members.slice(0, 3)
            : [];

          setMembers(memberList);

          setTotalMembers(
            Number(
              data.total ??
                data.totalMembers ??
                data.count ??
                data.members?.length ??
                memberList.length
            )
          );
        } else {
          setMembers([]);
          setTotalMembers(0);
          setError(data?.message || "Unable to load members");
        }
      } catch (err) {
        if (!mounted) return;

        console.error("Members preview error:", err);

        setMembers([]);
        setTotalMembers(0);
        setError("Unable to load members");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="members" className="members-preview">
      <div className="members-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="members-header">
          <motion.div
            className="members-heading"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7 }}
          >
            <h2>
              The people
              <br />
              <em>behind</em> Rudraksh.
            </h2>
          </motion.div>

          <motion.div
            className="members-intro"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p>
              Meet the people who contribute their time, energy and
              dedication to the Rudraksh Social & Cultural Organization.
            </p>

            <Link
              to="/members"
              className="members-gallery-link"
            >
              View Full Members Gallery
              <span>↗</span>
            </Link>
          </motion.div>
        </div>

        {/* =====================================================
            MEMBERS GALLERY
        ===================================================== */}

        {loading ? (
          <div className="members-gallery-grid">
            {[1, 2, 3].map((item) => (
              <div
                className="member-gallery-card"
                key={item}
              >
                <div
                  className="member-gallery-image-wrap"
                  style={{
                    animation: "membersPulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="members-empty-state">
            <strong>Members unavailable</strong>
            <span>{error}</span>
          </div>
        ) : members.length === 0 ? (
          <div className="members-empty-state">
            <strong>No members available</strong>
            <span>
              Members will appear here once they are added.
            </span>
          </div>
        ) : (
          <motion.div
            className="members-gallery-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.15,
            }}
          >
            {members.map((member, index) => {
              const imageUrl = getImageUrl(member.photo_url);

              return (
                <motion.div
                  className="member-gallery-card"
                  variants={cardVariants}
                  key={member.id || index}
                >
                  <Link
                    to="/members"
                    className="member-gallery-card"
                  >
                    <div className="member-gallery-image-wrap">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={member.name || "Rudraksh member"}
                          className="member-gallery-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="member-gallery-image-empty">
                          No Photo
                        </div>
                      )}

                      <div className="member-gallery-overlay" />

                      <div className="member-gallery-index">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="member-gallery-plus">
                        <Plus size={18} strokeWidth={1.5} />
                      </div>

                      {member.role && (
                        <div className="member-gallery-label">
                          {member.role}
                        </div>
                      )}
                    </div>

                    <div className="member-gallery-content">
                      <div>
                        <h3>
                          {member.name || "Rudraksh Member"}
                        </h3>

                        {member.role && (
                          <p>{member.role}</p>
                        )}
                      </div>

                      <ArrowUpRight
                        className="member-gallery-arrow"
                        size={20}
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* =====================================================
            BOTTOM
        ===================================================== */}

        <motion.div
          className="members-bottom"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{ duration: 0.6 }}
        >
          <div className="members-count">
            <strong>
              {totalMembers || members.length}
            </strong>

            <span>
              People
              <br />
              & Counting
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
        </motion.div>
      </div>

      <style>{`
        @keyframes membersPulse {
          0% {
            opacity: 0.55;
          }

          50% {
            opacity: 0.9;
          }

          100% {
            opacity: 0.55;
          }
        }
      `}</style>
    </section>
  );
}