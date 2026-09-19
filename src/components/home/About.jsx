import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./About.css";

function About() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const animatedElements = [
        ".about-label",
        ".about-title",
        ".about-copy",
        ".about-actions",
        ".about-image-card",
        ".about-info-card",
      ];

      /*
       * IMPORTANT:
       * Make everything visible first.
       * GSAP should enhance the section, not be responsible
       * for making the content exist.
       */
      gsap.set(animatedElements, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      });

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        return;
      }

      /*
       * Check whether About is already visible.
       * This prevents blank content when navigating directly
       * to #about from the Navbar.
       */
      const rect = section.getBoundingClientRect();

      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      if (!isVisible) {
        /*
         * Normal scroll animation.
         */
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          })
          .from(".about-label", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          })
          .from(
            ".about-title",
            {
              y: 45,
              opacity: 0,
              duration: 0.9,
              ease: "power3.out",
            },
            "-=0.3"
          )
          .from(
            ".about-copy",
            {
              y: 30,
              opacity: 0,
              duration: 0.75,
              ease: "power3.out",
            },
            "-=0.5"
          )
          .from(
            ".about-actions",
            {
              y: 20,
              opacity: 0,
              duration: 0.6,
              ease: "power3.out",
            },
            "-=0.4"
          )
          .from(
            ".about-image-card",
            {
              x: 55,
              opacity: 0,
              scale: 0.96,
              duration: 1,
              ease: "power3.out",
            },
            "-=0.7"
          )
          .from(
            ".about-info-card",
            {
              y: 35,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
            },
            "-=0.55"
          );
      }

      /*
       * Subtle image parallax.
       */
      gsap.to(".about-image", {
        yPercent: -5,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    {
      scope: sectionRef,
    }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="about-section"
    >
      <div className="about-container">

        {/* =========================
            LEFT CONTENT
        ========================== */}

        <div className="about-content">

          <div className="about-label">
            <span className="about-label-line" />
            ABOUT RUDRAKSH
          </div>

          <h2 className="about-title">
            Creating change,
            <br />
            <span>together.</span>
          </h2>

          <p className="about-copy">
            Rudraksh Social & Cultural Organization is a
            community-focused organization working to create
            meaningful positive change through compassion,
            education, cultural activities and collective
            action.
          </p>

          <p className="about-copy about-copy-secondary">
            We believe that stronger communities are built
            when people come together, support one another
            and create opportunities for everyone to move
            forward.
          </p>

          <div className="about-actions">
            <a
              href="#membership"
              className="about-button about-button-primary"
            >
              Become a Member
              <span>→</span>
            </a>

            <a
              href="#projects"
              className="about-button about-button-link"
            >
              Explore Our Work
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* =========================
            RIGHT VISUAL
        ========================== */}

        <div className="about-visual">

          <div className="about-image-card">

            <div className="about-image-wrap">
              <img
                src="/images/rudraksh-logo.png"
                alt="Rudraksh Social & Cultural Organization"
                className="about-image"
              />
            </div>

            <div className="about-image-caption">
              <span>PEOPLE</span>
              <span>PURPOSE</span>
              <span>COMMUNITY</span>
            </div>

          </div>

          {/* INFO CARD */}

          <div className="about-info-card">

            <div className="about-info-number">
              34
            </div>

            <div className="about-info-text">
              <strong>Members</strong>

              <span>
                Working together for meaningful
                community initiatives.
              </span>
            </div>

          </div>

          {/* DECORATION */}

          <div className="about-decor">
            <span />
            <span />
            <span />
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;