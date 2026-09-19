import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";

function HomeCTA() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".cta-main",
            ".cta-card",
            ".cta-location",
          ],
          {
            opacity: 1,
            y: 0,
            x: 0,
          }
        );

        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        })
        .from(".cta-main", {
          y: 45,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
        })
        .from(
          ".cta-card",
          {
            y: 35,
            opacity: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: "power3.out",
          },
          "-=0.5"
        )
        .from(
          ".cta-location",
          {
            y: 25,
            opacity: 0,
            duration: 0.65,
            ease: "power3.out",
          },
          "-=0.35"
        );
    },
    {
      scope: sectionRef,
    }
  );

  return (
    <section
      ref={sectionRef}
      className="home-cta"
    >
      <div className="home-cta-container">

        <div className="cta-main">
          <div className="section-eyebrow cta-eyebrow">
            <span />
            MAKE A DIFFERENCE
          </div>

          <h2>
            Change starts
            <br />
            <em>with us.</em>
          </h2>

          <p>
            Whether you volunteer your time, support an
            initiative or simply help spread the word,
            every contribution can create meaningful
            change.
          </p>

          <div className="cta-main-actions">
            <a
              href="#membership"
              className="cta-primary-button"
            >
              Become a Member
              <span>→</span>
            </a>

            <a
              href="#donate"
              className="cta-secondary-button"
            >
              Support Our Work
              <span>↗</span>
            </a>
          </div>
        </div>

        <div className="cta-grid">

          <a
            href="#membership"
            className="cta-card cta-member-card"
          >
            <div className="cta-card-top">
              <span>01</span>

              <span className="cta-card-icon">
                ↗
              </span>
            </div>

            <div className="cta-card-content">
              <span>GET INVOLVED</span>

              <h3>
                Become a
                <br />
                Member
              </h3>

              <p>
                Join a growing community of people
                working together for positive change.
              </p>
            </div>
          </a>

          <a
            href="#donate"
            className="cta-card cta-donate-card"
          >
            <div className="cta-card-top">
              <span>02</span>

              <span className="cta-card-icon">
                ↗
              </span>
            </div>

            <div className="cta-card-content">
              <span>SUPPORT US</span>

              <h3>
                Give with
                <br />
                Purpose
              </h3>

              <p>
                Your support helps us continue reaching
                communities and creating opportunities.
              </p>
            </div>
          </a>

        </div>

        <div className="cta-location">
          <div className="cta-location-left">
            <div className="cta-location-icon">
              +
            </div>

            <div>
              <span>FIND US</span>

              <strong>
                Sribhumi District, Assam
              </strong>
            </div>
          </div>

          <a
            href="#contact"
            className="cta-location-link"
          >
            Contact Rudraksh
            <span>→</span>
          </a>
        </div>

      </div>
    </section>
  );
}

export default HomeCTA;