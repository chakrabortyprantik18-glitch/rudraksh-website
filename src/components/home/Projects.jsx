import { useEffect, useState } from "react";
import "./Projects.css";

const API_URL = "http://localhost:5000";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        console.log("📡 Loading projects...");

        const response = await fetch(
          `${API_URL}/api/projects`,
          {
            cache: "no-store",
          }
        );

        console.log(
          "📡 Projects API status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `Projects API returned ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          "📦 Projects API response:",
          data
        );

        if (!Array.isArray(data.projects)) {
          throw new Error(
            "Invalid projects response from server"
          );
        }

        setProjects(data.projects);
      } catch (err) {
        console.error(
          "❌ PROJECTS LOAD ERROR:",
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
      return null;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_URL}${image}`;
    }

    return `${API_URL}/${image}`;
  }

  return (
    <section
      id="projects"
      className="projects-section"
    >
      <div className="projects-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="projects-top">

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

            <a
              href="#projects"
              className="projects-view-all"
            >
              View All Projects
              <span>↗</span>
            </a>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="projects-grid">

            <article className="project-card">

              <div className="project-content">

                <span className="project-category">
                  PROJECTS
                </span>

                <h3>
                  Loading projects...
                </h3>

                <p>
                  Loading the latest projects from
                  Rudraksh.
                </p>

              </div>

            </article>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="projects-grid">

            <article className="project-card">

              <div className="project-content">

                <span className="project-category">
                  ERROR
                </span>

                <h3>
                  Projects unavailable
                </h3>

                <p>
                  {error}
                </p>

              </div>

            </article>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="projects-grid">

              <article className="project-card">

                <div className="project-content">

                  <span className="project-category">
                    OUR WORK
                  </span>

                  <h3>
                    No projects published yet.
                  </h3>

                  <p>
                    Projects published from the Admin
                    Panel will appear here.
                  </p>

                </div>

              </article>

            </div>
          )}

        {/* =================================================
            PROJECTS
        ================================================= */}

        {!loading &&
          !error &&
          projects.length > 0 && (

            <div className="projects-grid">

              {projects.map((project, index) => {

                const number = String(
                  index + 1
                ).padStart(2, "0");

                const imageUrl =
                  getImageUrl(
                    project.cover_image
                  );

                return (
                  <article
                    key={
                      project.id ||
                      project.slug ||
                      index
                    }
                    className="project-card"
                  >

                    {/* IMAGE */}

                    <div className="project-image-wrap">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={
                            project.title ||
                            "Rudraksh project"
                          }
                          className="project-image"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          className="project-image"
                          style={{
                            minHeight: "260px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          PROJECT
                        </div>
                      )}

                      <div className="project-image-overlay" />

                      <span className="project-number">
                        {number}
                      </span>

                      <span className="project-arrow">
                        ↗
                      </span>

                    </div>

                    {/* CONTENT */}

                    <div className="project-content">

                      <span className="project-category">
                        {project.status
                          ? project.status.toUpperCase()
                          : "PROJECT"}
                      </span>

                      <h3>
                        {project.title}
                      </h3>

                      <p>
                        {project.short_description ||
                          project.description ||
                          "Learn more about this project."}
                      </p>

                      {project.location && (
                        <p>
                          📍 {project.location}
                        </p>
                      )}

                      {project.project_date && (
                        <p>
                          📅{" "}
                          {new Date(
                            project.project_date
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}

                      <a
                        href="#projects"
                        className="project-link"
                      >
                        Explore Project
                        <span>→</span>
                      </a>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

      </div>
    </section>
  );
}

export default Projects;