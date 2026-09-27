import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./Projects.css";

import { BACKEND_URL } from "../../config/api";

const API_URL = `${BACKEND_URL}/api/projects`;

function Projects() {
  const sectionRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        const data = await response.json();

        if (
          !response.ok ||
          !Array.isArray(data.projects)
        ) {
          throw new Error(
            data.message ||
              "Unable to load projects."
          );
        }

        if (cancelled) {
          return;
        }

        setProjects(data.projects);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "PUBLIC PROJECTS LOAD ERROR:",
          err
        );

        setError(
          "Unable to load projects right now."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements =
        section.querySelectorAll(
          ".projects-heading, .projects-intro, .project-item, .projects-view-all, .projects-empty"
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

      const rect =
        section.getBoundingClientRect();

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
      dependencies: [
        projects.length,
        loading,
      ],
    }
  );

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

  const previewProjects =
    projects.slice(0, 3);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="projects-section"
    >
      <div className="projects-container">

        {/* =========================
            HEADER
        ========================== */}

        <div className="projects-header">

          <div className="projects-heading">

            <div className="section-eyebrow">
              <span />
              OUR WORK
            </div>

            <h2>
              Turning intention,
              <br />
              into <em>impact.</em>
            </h2>

          </div>

          <div className="projects-intro">

            <p>
              From community support to
              education and health
              initiatives, our projects
              are built around people and
              the needs of the communities
              we serve.
            </p>

          </div>

        </div>

        {/* =========================
            PROJECT GRID
        ========================== */}

        <div className="projects-grid">

          {/* LOADING */}

          {loading && (
            <div className="projects-empty">
              Loading projects...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="projects-empty">
              {error}
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            previewProjects.length === 0 && (
              <div className="projects-empty">

                <strong>
                  No projects published
                  yet.
                </strong>

                <span>
                  Projects published from
                  the Admin Panel will
                  appear here.
                </span>

              </div>
            )}

          {/* PROJECTS */}

          {!loading &&
            !error &&
            previewProjects.map(
              (project, index) => {

                const imageUrl =
                  getImageUrl(
                    project.cover_image
                  );

                return (
                  <Link
                    key={
                      project.id ||
                      project.slug ||
                      index
                    }
                    to={`/projects/${project.id}`}
                    className={`project-item ${
                      index === 0
                        ? "project-item-large"
                        : ""
                    }`}
                  >

                    <div className="project-image-wrap">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={
                            project.title ||
                            "Rudraksh project"
                          }
                          className="project-image"
                          loading={
                            index === 0
                              ? "eager"
                              : "lazy"
                          }
                          onError={(
                            event
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="project-image-empty">
                          PROJECT
                        </div>
                      )}

                      {/* SAME AS GALLERY */}

                      <div className="project-image-overlay" />

                      <span className="project-label">
                        {project.title ||
                          project.status ||
                          "Rudraksh"}
                      </span>

                      <span className="project-index">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="project-card-arrow">
                        ↗
                      </span>

                    </div>

                  </Link>
                );
              }
            )}

        </div>

        {/* =========================
            VIEW ALL
        ========================== */}

        <Link
          to="/projects"
          className="projects-view-all"
        >
          View All Projects

          <span>
            ↗
          </span>
        </Link>

      </div>
    </section>
  );
}

export default Projects;