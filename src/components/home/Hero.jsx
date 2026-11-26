
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  const { content } = useWebsiteContent("hero");

  const organizationName =
    "Rudraksh Social & Cultural Organization";

  /* =========================================================
     SLIDE DATA
  ========================================================= */

  const slides = useMemo(() => {
    if (Array.isArray(content?.slides) && content.slides.length > 0) {
      return content.slides.slice(0, 3).map((slide, index) => ({
        id: index,
        eyebrow:
          slide.eyebrow ||
          "RUDRAKSH SOCIAL & CULTURAL ORGANIZATION",
        title:
          slide.title ||
          "Building Communities. Creating Change.",
        description:
          slide.description ||
          "Working together to create positive social and cultural impact in our community.",
        image: slide.image || "",
        buttons: Array.isArray(slide.buttons)
          ? slide.buttons
          : [],
      }));
    }

    // Backward compatibility with the previous single Hero CMS.
    return [
      {
        id: 0,
        eyebrow:
          content?.eyebrow ||
          "RUDRAKSH SOCIAL & CULTURAL ORGANIZATION",
        title:
          content?.title ||
          "Building Communities. Creating Change.",
        description:
          content?.description ||
          "Working together to create positive social and cultural impact in our community.",
        image: content?.image || "",
        buttons: [
          {
            text: content?.buttonText || "Apply Now",
            url: "/utsav-2026",
            enabled: true,
            style: "primary",
          },
          {
            text: "Support Our Work",
            url: "/#donate",
            enabled: true,
            style: "secondary",
          },
        ],
      },
    ];
  }, [content]);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, slides.length - 1)
    );
  }, [slides.length]);

  const currentSlide = slides[activeIndex] || slides[0];

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const resolveImage = (image) => {
    if (!image) return heroBackground;

    if (typeof image === "object") {
      if (image.preview) return image.preview;
      if (image.url) return getContentImageUrl(image.url);
      return heroBackground;
    }

    return getContentImageUrl(image) || heroBackground;
  };

  const heroImage = resolveImage(currentSlide?.image);

  /* =========================================================
     SLIDER CONTROLS
  ========================================================= */

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      (current + 1) % slides.length
    );
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      (current - 1 + slides.length) % slides.length
    );
  }, [slides.length]);

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  /* =========================================================
     AUTOPLAY
  ========================================================= */

  useEffect(() => {
    if (
      slides.length <= 1 ||
      content?.autoplay === false
    ) {
      return undefined;
    }

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (prefersReducedMotion) return undefined;

    const configuredInterval = Number(content?.interval);
    const interval =
      Number.isFinite(configuredInterval) &&
      configuredInterval >= 2500
        ? configuredInterval
        : 6000;

    const timer = window.setInterval(
      goToNext,
      interval
    );

    return () => window.clearInterval(timer);
  }, [
    slides.length,
    content?.autoplay,
    content?.interval,
    goToNext,
  ]);

  /* =========================================================
     HIGHLIGHT ORGANIZATION NAME
  ========================================================= */

  const renderHighlightedDescription = (description) => {
    const parts = String(description || "").split(
      /(Rudraksh Social & Cultural Organization)/gi
    );

    return parts.map((part, index) => {
      const isOrganizationName =
        part.toLowerCase() ===
        organizationName.toLowerCase();

      return isOrganizationName ? (
        <strong key={index}>{part}</strong>
      ) : (
        <span key={index}>{part}</span>
      );
    });
  };

  /* =========================================================
     BUTTON URL VALIDATION
  ========================================================= */

  const getSafeUrl = (url) => {
    const value = String(url || "").trim();

    if (!value) return null;

    if (/^(javascript|data|vbscript):/i.test(value)) {
      return null;
    }

    if (
      value.startsWith("/") ||
      value.startsWith("#") ||
      value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:")
    ) {
      return value;
    }

    return null;
  };

  /* =========================================================
     RENDER BUTTON
  ========================================================= */

  const renderButton = (button, index) => {
    if (
      !button ||
      button.enabled === false ||
      !button.text ||
      !button.url
    ) {
      return null;
    }

    const safeUrl = getSafeUrl(button.url);

    if (!safeUrl) return null;

    const buttonClass =
      button.style === "secondary"
        ? "hero-button hero-button-secondary"
        : "hero-button hero-button-primary";

    const buttonContent = (
      <>
        <span>{button.text}</span>
        <strong>→</strong>
      </>
    );

    if (
      safeUrl.startsWith("/") ||
      safeUrl.startsWith("#")
    ) {
      return (
        <Link
          key={index}
          to={safeUrl}
          className={buttonClass}
        >
          {buttonContent}
        </Link>
      );
    }

    const isExternal =
      safeUrl.startsWith("http://") ||
      safeUrl.startsWith("https://");

    return (
      <a
        key={index}
        href={safeUrl}
        className={buttonClass}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {buttonContent}
      </a>
    );
  };

  /* =========================================================
     GSAP INTRO + PARALLAX
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

      // Background parallax
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

      // Content parallax
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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      id="home"
      ref={heroRef}
      className="hero"
      aria-roledescription="carousel"
      aria-label="Rudraksh homepage highlights"
    >
      {/* BACKGROUND */}
      <div className="hero-media">
        <img
          key={heroImage}
          src={heroImage}
          alt="Rudraksh community members standing together"
          className="hero-background"
        />
      </div>

      <div className="hero-overlay" />
      <div className="hero-overlay-soft" />

      {/* PREVIOUS */}
      {slides.length > 1 && (
        <button
          type="button"
          className="hero-slider-control hero-slider-prev"
          aria-label="Previous slide"
          onClick={goToPrevious}
        >
          <span>←</span>
        </button>
      )}

      {/* NEXT */}
      {slides.length > 1 && (
        <button
          type="button"
          className="hero-slider-control hero-slider-next"
          aria-label="Next slide"
          onClick={goToNext}
        >
          <span>→</span>
        </button>
      )}

      {/* CONTENT */}
      <div className="hero-content" key={currentSlide.id}>
        <div className="hero-eyebrow">
          <span>{currentSlide.eyebrow}</span>
        </div>

        <h1 className="hero-title">
          {currentSlide.title}
        </h1>

        <p className="hero-description">
          {renderHighlightedDescription(
            currentSlide.description
          )}
        </p>

        <div className="hero-actions">
          {currentSlide.buttons
            .slice(0, 2)
            .map(renderButton)}
        </div>
      </div>

      {/* COMMUNITY NOTE */}
      <div className="hero-community-note">
        <span className="hero-community-line" />

        <div className="hero-community-text">
          <span>STRONGER</span>
          <span>COMMUNITIES</span>
          <span>HAPPIER LIVES</span>
        </div>
      </div>

      {/* SLIDE DOTS */}
      {slides.length > 1 && (
        <div
          className="hero-dots"
          role="group"
          aria-label="Choose homepage slide"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={
                index === activeIndex ? "active" : ""
              }
              aria-label={`Go to slide ${index + 1}`}
              aria-current={
                index === activeIndex ? "true" : undefined
              }
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {/* SCROLL INDICATOR */}
      <div className="hero-scroll-indicator">
        <span>SCROLL TO EXPLORE</span>
        <i />
      </div>
    </section>
  );
}

export default Hero;
