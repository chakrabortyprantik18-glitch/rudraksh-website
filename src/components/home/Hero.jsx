import { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import {
  useWebsiteContent,
  getContentImageUrl,
} from "../../hooks/useWebsiteContent";

import heroBackground from "../../assets/hero-background.jpg";
import "./Hero.css";

function Hero() {
  const heroRef = useRef(null);

  const { content } = useWebsiteContent("hero");

  const eyebrow =
    content?.eyebrow ||
    "RUDRAKSH SOCIAL & CULTURAL ORGANIZATION";

  const title =
    content?.title ||
    "Building Communities. Creating Change.";

  const description =
    content?.description ||
    "Working together to create positive social and cultural impact in our community.";

  const buttonText =
    content?.buttonText ||
    "Explore Our Work";

  const heroImage =
    getContentImageUrl(content?.image) ||
    heroBackground;

  const organizationName =
    "Rudraksh Social & Cultural Organization";

  /* =========================================================
     HIGHLIGHT ORGANIZATION NAME
  ========================================================= */

  const renderHighlightedDescription = () => {
    const parts = description.split(
      /(Rudraksh Social & Cultural Organization)/gi
    );

    return parts.map((part, index) => {
      const isOrganizationName =
        part.toLowerCase() ===
        organizationName.toLowerCase();

      if (isOrganizationName) {
        return (
          <strong key={index}>
            {part}
          </strong>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    });
  };

  /* =========================================================
     GSAP
  ========================================================= */

  useGSAP(
    () => {
      const section = heroRef.current;

      if (!section) return;

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      const intro = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".hero-eyebrow",
            ".hero-title",
            ".hero-description",
            ".hero-actions",
            ".hero-community-note",
            ".hero-slider-control",
            ".hero-dots",
            ".hero-scroll-indicator",
          ],
          {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
          }
        );

        return;
      }

      intro
        .from(".hero-background", {
          scale: 1.1,
          duration: 2,
          ease: "power2.out",
        })
        .from(
          ".hero-eyebrow",
          {
            y: 24,
            opacity: 0,
            duration: 0.7,
          },
          "-=1.2"
        )
        .from(
          ".hero-title",
          {
            y: 45,
            opacity: 0,
            duration: 0.95,
          },
          "-=0.45"
        )
        .from(
          ".hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.75,
          },
          "-=0.5"
        )
        .from(
          ".hero-actions",
          {
            y: 22,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.4"
        )
        .from(
          ".hero-community-note",
          {
            x: 35,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.45"
        )
        .from(
          ".hero-slider-control",
          {
            scale: 0.7,
            opacity: 0,
            duration: 0.55,
            stagger: 0.08,
          },
          "-=0.35"
        )
        .from(
          ".hero-dots",
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.3"
        )
        .from(
          ".hero-scroll-indicator",
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.25"
        );

      /* =====================================================
         PARALLAX
      ===================================================== */

      gsap.to(".hero-background", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(".hero-content", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    {
      scope: heroRef,
    }
  );

  return (
    <section
      id="home"
      ref={heroRef}
      className="hero"
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="hero-media">
        <img
          src={heroImage}
          alt="Rudraksh community members standing together"
          className="hero-background"
        />
      </div>

      <div className="hero-overlay" />
      <div className="hero-overlay-soft" />

      {/* =====================================================
          PREVIOUS
      ===================================================== */}

      <button
        type="button"
        className="hero-slider-control hero-slider-prev"
        aria-label="Previous slide"
      >
        <span>←</span>
      </button>

      {/* =====================================================
          NEXT
      ===================================================== */}

      <button
        type="button"
        className="hero-slider-control hero-slider-next"
        aria-label="Next slide"
      >
        <span>→</span>
      </button>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="hero-content">
        <div className="hero-eyebrow">
          <span>{eyebrow}</span>
        </div>

        <h1 className="hero-title">
          {title}
        </h1>

        <p className="hero-description">
          {renderHighlightedDescription()}
        </p>

        <div className="hero-actions">
          <Link
            to="/projects"
            className="hero-button hero-button-primary"
          >
            <span>{buttonText}</span>
            <strong>→</strong>
          </Link>

          <a
            href="/#donate"
            className="hero-button hero-button-secondary"
          >
            Support Our Work
          </a>
        </div>
      </div>

      {/* =====================================================
          COMMUNITY NOTE
      ===================================================== */}

      <div className="hero-community-note">
        <span className="hero-community-line" />

        <div className="hero-community-text">
          <span>STRONGER</span>
          <span>COMMUNITIES</span>
          <span>HAPPIER LIVES</span>
        </div>
      </div>

      {/* =====================================================
          DOTS
      ===================================================== */}

      <div className="hero-dots">
        <button
          type="button"
          className="active"
          aria-label="Slide 1"
        />

        <button
          type="button"
          aria-label="Slide 2"
        />

        <button
          type="button"
          aria-label="Slide 3"
        />
      </div>

      {/* =====================================================
          SCROLL INDICATOR
      ===================================================== */}

      <div className="hero-scroll-indicator">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}

export default Hero;