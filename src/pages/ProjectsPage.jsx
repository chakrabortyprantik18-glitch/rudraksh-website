import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useGSAP } from "@gsap/react";

import { gsap } from "../services/gsap";
import { BACKEND_URL } from "../config/api";

import "./ProjectsPage.css";

const API_URL =
  `${BACKEND_URL}/api/projects`;

function ProjectsPage() {
  const pageRef = useRef(null);

  const [projects, setProjects] =
    useState([]);

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * LOAD ALL PUBLISHED PROJECTS
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
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
              "Unable to load projects."
          );
        }

        if (cancelled) {
          return;
        }

        setProjects(
          Array.isArray(data.projects)
            ? data.projects
            : []
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "PROJECTS PAGE LOAD ERROR:",
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

  /*
   * ============================================================
   * FILTERS
   * ============================================================
   */

  const filters = useMemo(() => {
    const locations = projects
      .map(
        (project) =>
          project.location?.trim()
      )
      .filter(Boolean);

    return [
      "All",
      ...new Set(locations),
    ];
  }, [projects]);

  /*
   * ============================================================
   * FILTERED PROJECTS
   * ============================================================
   */

  const filteredProjects =
    useMemo(() => {
      if (
        activeFilter === "All"
      ) {
        return projects;
      }

      return projects.filter(
        (project) =>
          project.location ===
          activeFilter
      );
    }, [
      activeFilter,
      projects,
    ]);

  /*
   * ============================================================
   * RESET INVALID FILTER
   * ============================================================
   */

  useEffect(() => {
    if (
      !filters.includes(
        activeFilter
      )
    ) {
      setActiveFilter("All");
    }
  }, [
    activeFilter,
    filters,
  ]);

  /*
   * ============================================================
   * GSAP
   * ============================================================
   */

  useGSAP(
    () => {
      const page =
        pageRef.current;

      if (!page) {
        return;
      }

      const elements =
        page.querySelectorAll(
          ".projects-page-hero-content > *, .projects-page-filters, .projects-page-card, .projects-page-empty"
        );

      gsap.set(elements, {
        opacity: 1,
        y: 0,
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

      gsap.fromTo(
        elements,
        {
          y: 25,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.07,
          ease: "power3.out",
        }
      );
    },
    {
      scope: pageRef,
      dependencies: [
        filteredProjects.length,
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
      image.startsWith("/")
    ) {
      return `${BACKEND_URL}${image}`;
    }

    return `${BACKEND_URL}/${image}`;
  };

  /*
   * ============================================================
   * IMAGE FALLBACK
   * ============================================================
   */

  const handleImageError = (
    event
  ) => {
    event.currentTarget.style.display =
      "none";

    const parent =
      event.currentTarget.parentElement;

    if (!parent) {
      return;
    }

    const fallback =
      document.createElement(
        "div"
      );

    fallback.className =
      "projects-page-image projects-page-image-empty";

    fallback.innerHTML =
      "<span>No image</span>";

    parent.insertBefore(
      fallback,
      parent.firstChild
    );
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div
      ref={pageRef}
      className="projects-page"
    >

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="projects-page-hero">

        <div className="projects-page-hero-content">

          <div className="section-eyebrow projects-page-eyebrow">
            <span />

            OUR PROJECTS
          </div>

          <h1>
            Turning ideas
            <br />
            into{" "}
            <em>
              action.
            </em>
          </h1>

          <p>
            Explore the initiatives
            published by Rudraksh
            Social & Cultural
            Organization.
          </p>

        </div>

        <div className="projects-page-hero-number">

          <span>
            {String(
              projects.length
            ).padStart(
              2,
              "0"
            )}
          </span>

          <small>
            PROJECTS
          </small>

        </div>

      </section>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <section className="projects-page-content">

        <div className="projects-page-toolbar">

          <div className="projects-page-heading">

            <span>
              OUR INITIATIVES
            </span>

            <h2>
              Work that
              <br />
              <em>
                matters.
              </em>
            </h2>

          </div>

          {/* FILTERS */}

          {projects.length >
            0 && (
            <div
              className="projects-page-filters"
              role="tablist"
              aria-label="Project locations"
            >

              {filters.map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    role="tab"
                    aria-selected={
                      activeFilter ===
                      filter
                    }
                    className={
                      activeFilter ===
                      filter
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveFilter(
                        filter
                      )
                    }
                  >
                    {filter}
                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="projects-page-empty">

            <span>
              LOADING
            </span>

            <h3>
              Loading projects...
            </h3>

          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading &&
          error && (
            <div className="projects-page-empty">

              <span>
                ERROR
              </span>

              <h3>
                Unable to load
                <br />
                projects.
              </h3>

              <p>
                {error}
              </p>

            </div>
          )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          filteredProjects.length ===
            0 && (
            <div className="projects-page-empty">

              <span>
                NO PROJECTS
              </span>

              <h3>
                No projects are
                published
                <br />
                yet.
              </h3>

              <p>
                Projects added from
                the Admin Panel will
                appear here
                automatically.
              </p>

            </div>
          )}

        {/* ====================================================
            PROJECT GRID
        ==================================================== */}

        {!loading &&
          !error &&
          filteredProjects.length >
            0 && (
            <div className="projects-page-grid">

              {filteredProjects.map(
                (
                  project,
                  index
                ) => (
                  <article
                    key={
                      project.id
                    }
                    className="projects-page-card"
                  >

                    {/* IMAGE */}

                    <div className="projects-page-image-wrap">

                      {project.cover_image ? (
                        <img
                          src={getImageUrl(
                            project.cover_image
                          )}
                          alt={
                            project.title ||
                            "Rudraksh project"
                          }
                          className="projects-page-image"
                          loading={
                            index ===
                            0
                              ? "eager"
                              : "lazy"
                          }
                          onError={
                            handleImageError
                          }
                        />
                      ) : (
                        <div className="projects-page-image projects-page-image-empty">

                          <span>
                            No image
                          </span>

                        </div>
                      )}

                      <div className="projects-page-image-overlay" />

                      <span className="projects-page-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span className="projects-page-arrow">
                        ↗
                      </span>

                    </div>

                    {/* CONTENT */}

                    <div className="projects-page-card-content">

                      <span className="projects-page-category">
                        {project.status ||
                          "PROJECT"}
                      </span>

                      <h3>
                        {
                          project.title
                        }
                      </h3>

                      <p>
                        {
                          project.short_description ||
                          project.description ||
                          "No project description available."
                        }
                      </p>

                      {project.location && (
                        <span className="projects-page-location">
                          {project.location}
                        </span>
                      )}

                    </div>

                  </article>
                )
              )}

            </div>
          )}

      </section>

    </div>
  );
}

export default ProjectsPage;