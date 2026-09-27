import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Projects.css";
import { BACKEND_URL } from "../../config/api";

const API_URL = BACKEND_URL;

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch(
          `${API_URL}/api/projects`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Projects API returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data.projects)) {
          throw new Error(
            "Invalid projects response from server"
          );
        }

        setProjects(data.projects);
      } catch (err) {
        console.error(
          "PROJECTS LOAD ERROR:",
          err
        );

        setError(
          "Unable to load projects right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  function getImageUrl(image) {
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
      return `${API_URL}${image}`;
    }

    return `${API_URL}/${image}`;
  }

  // Gallery-style homepage preview:
  // Only the first 3 published projects are displayed.
  const previewProjects = projects.slice(0, 3);

  return (
    <section
      id="projects"
      className="projects-section"
    >
      <div className="projects-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="projects-header">

          <div className="projects-heading">

            <div className="section-eyebrow">
              <span />
              OUR WORK
            </div>

            <h2>
              Turning intention
              <br />
              into <em>impact.</em>
            </h2>

          </div>

          <div className="projects-intro">

            <p>
              From community support to education and
              health initiatives, our projects are built
              around people and the needs of the communities
              we serve.
            </p>

            <Link
              to="/projects"
              className="projects-view-all"
            >
              View All Projects
              <span>↗</span>
            </Link>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="projects-grid">

            {[1, 2, 3].map((item) => (
              <article
                className="project-item"
                key={item}
              >
                <div className="project-image-wrap">
                  <div className="project-loading">
                    Loading
                  </div>
                </div>
              </article>
            ))}

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="projects-empty">

            <span>ERROR</span>

            <h3>
              Projects unavailable
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          previewProjects.length === 0 && (
            <div className="projects-empty">

              <span>OUR WORK</span>

              <h3>
                No projects published yet.
              </h3>

              <p>
                Projects published from the Admin
                Panel will appear here.
              </p>

            </div>
          )}

        {/* =================================================
            PROJECT PREVIEW
        ================================================= */}

        {!loading &&
          !error &&
          previewProjects.length > 0 && (

            <div className="projects-grid">

              {previewProjects.map(
                (project, index) => {

                  const imageUrl =
                    getImageUrl(
                      project.cover_image
                    );

                  const number = String(
                    index + 1
                  ).padStart(2, "0");

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
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="project-image-empty">
                            PROJECT
                          </div>
                        )}

                        {/* Same visual overlay treatment */}
                        <div className="project-image-overlay" />

                        {/* Project status */}
                        <span className="project-label">
                          {project.status
                            ? project.status
                            : "PROJECT"}
                        </span>

                        {/* 01 / 02 / 03 */}
                        <span className="project-index">
                          {number}
                        </span>

                        {/* Hover button */}
                        <span className="project-plus">
                          +
                        </span>

                        {/* Project information */}
                        <div className="project-overlay-content">

                          <h3>
                            {project.title ||
                              "Rudraksh Project"}
                          </h3>

                          {project.short_description && (
                            <p>
                              {
                                project.short_description
                              }
                            </p>
                          )}

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}

      </div>
    </section>
  );
}

export default Projects;