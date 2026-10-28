import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BACKEND_URL } from "../config/api";
import "./ProjectDetailPage.css";

const API_URL = BACKEND_URL;

function ProjectDetailPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [gallery, setGallery] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        /* =================================================
           LOAD PROJECT
        ================================================= */

        const projectResponse = await fetch(
          `${API_URL}/api/projects/${id}`,
          {
            cache: "no-store",
          }
        );

        if (!projectResponse.ok) {
          throw new Error(
            `Project API returned ${projectResponse.status}`
          );
        }

        const projectData =
          await projectResponse.json();

        if (
          !projectData.success ||
          !projectData.project
        ) {
          throw new Error(
            "Project was not found."
          );
        }

        setProject(projectData.project);

        /* =================================================
           LOAD GALLERY
        ================================================= */

        const galleryResponse = await fetch(
          `${API_URL}/api/gallery`,
          {
            cache: "no-store",
          }
        );

        if (!galleryResponse.ok) {
          throw new Error(
            `Gallery API returned ${galleryResponse.status}`
          );
        }

        const galleryData =
          await galleryResponse.json();

        if (
          galleryData.success &&
          Array.isArray(galleryData.gallery)
        ) {
          const projectGallery =
            galleryData.gallery.filter(
              (image) =>
                Number(image.project_id) ===
                Number(id) &&
                Number(image.is_published) === 1
            );

          setGallery(projectGallery);
        } else {
          setGallery([]);
        }
      } catch (err) {
        console.error(
          "❌ PROJECT DETAIL LOAD ERROR:",
          err
        );

        setError(
          "Unable to load this project right now."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProject();
    }
  }, [id]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="project-detail-page">
        <div className="project-detail-container">
          <div className="project-detail-loading">
            <span>LOADING PROJECT</span>
            <h1>Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !project) {
    return (
      <main className="project-detail-page">
        <div className="project-detail-container">
          <div className="project-detail-error">
            <span>PROJECT</span>

            <h1>
              Project unavailable
            </h1>

            <p>
              {error ||
                "This project could not be found."}
            </p>

            <Link
              to="/projects"
              className="project-detail-back"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const coverImage = getImageUrl(
    project.cover_image
  );

  return (
    <main className="project-detail-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="project-detail-hero">

        <div className="project-detail-container">

          <Link
            to="/projects"
            className="project-detail-back"
          >
            ← Back to Projects
          </Link>

          <div className="project-detail-category">
            <span />
            {project.status
              ? project.status.toUpperCase()
              : "PROJECT"}
          </div>

          <h1>
            {project.title}
          </h1>

          {project.short_description && (
            <p className="project-detail-intro">
              {project.short_description}
            </p>
          )}

        </div>
      </section>

      {/* =================================================
          COVER IMAGE
      ================================================= */}

      {coverImage && (
        <section className="project-detail-cover-section">

          <div className="project-detail-container">

            <div className="project-detail-cover">

              <img
                src={coverImage}
                alt={
                  project.title ||
                  "Rudraksh project"
                }
              />

            </div>

          </div>

        </section>
      )}

      {/* =================================================
          PROJECT INFORMATION
      ================================================= */}

      <section className="project-detail-content">

        <div className="project-detail-container">

          <div className="project-detail-layout">

            <div className="project-detail-description">

              <span className="project-detail-label">
                ABOUT THIS PROJECT
              </span>

              <h2>
                {project.title}
              </h2>

              <p>
                {project.description ||
                  project.short_description ||
                  "More information about this project will be available soon."}
              </p>

            </div>

            <aside className="project-detail-meta">

              {project.location && (
                <div className="project-meta-item">
                  <span>
                    LOCATION
                  </span>

                  <strong>
                    {project.location}
                  </strong>
                </div>
              )}

              {project.project_date && (
                <div className="project-meta-item">
                  <span>
                    DATE
                  </span>

                  <strong>
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
                  </strong>
                </div>
              )}

              <div className="project-meta-item">
                <span>
                  STATUS
                </span>

                <strong>
                  {project.status
                    ? project.status
                        .charAt(0)
                        .toUpperCase() +
                      project.status.slice(1)
                    : "Completed"}
                </strong>
              </div>

            </aside>

          </div>

        </div>

      </section>

      {/* =================================================
          PROJECT GALLERY
      ================================================= */}

      <section className="project-gallery-section">

        <div className="project-detail-container">

          <div className="project-gallery-heading">

            <div>
              <span className="project-detail-label">
                PROJECT GALLERY
              </span>

              <h2>
                Moments from{" "}
                <em>
                  {project.title}
                </em>
              </h2>
            </div>

            <span className="project-gallery-count">
              {gallery.length}{" "}
              {gallery.length === 1
                ? "IMAGE"
                : "IMAGES"}
            </span>

          </div>

          {gallery.length > 0 ? (
            <div className="project-gallery-grid">

              {gallery.map((image) => {

                const imageUrl =
                  getImageUrl(
                    image.image_url
                  );

                if (!imageUrl) {
                  return null;
                }

                return (
                  <article
                    key={image.id}
                    className="project-gallery-item"
                  >

                    <img
                      src={imageUrl}
                      alt={
                        image.title ||
                        project.title ||
                        "Project gallery image"
                      }
                      loading="lazy"
                    />

                    <div className="project-gallery-overlay">

                      {image.title && (
                        <h3>
                          {image.title}
                        </h3>
                      )}

                      {image.description && (
                        <p>
                          {image.description}
                        </p>
                      )}

                    </div>

                  </article>
                );
              })}

            </div>
          ) : (
            <div className="project-gallery-empty">

              <span>
                NO GALLERY IMAGES
              </span>

              <p>
                Gallery images connected to
                this project will appear here.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          BACK TO PROJECTS
      ================================================= */}

      <section className="project-detail-footer">

        <div className="project-detail-container">

          <Link
            to="/projects"
            className="project-detail-back-large"
          >
            ← View All Projects
          </Link>

        </div>

      </section>

    </main>
  );
}

export default ProjectDetailPage;