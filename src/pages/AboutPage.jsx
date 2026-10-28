import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../services/gsap";

function AboutPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const page = pageRef.current;

      if (!page) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".about-page-hero-content",
            ".about-page-story",
            ".about-value-card",
            ".about-page-cta",
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
          defaults: {
            ease: "power3.out",
          },
        })
        .from(".about-page-hero-content > *", {
          y: 35,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
        });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".about-page-story",
            start: "top 78%",
            once: true,
          },
        })
        .from(".about-page-story > *", {
          y: 35,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
        });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".about-values",
            start: "top 78%",
            once: true,
          },
        })
        .from(".about-value-card", {
          y: 45,
          opacity: 0,
          duration: 0.75,
          stagger: 0.12,
        });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".about-page-cta",
            start: "top 82%",
            once: true,
          },
        })
        .from(".about-page-cta", {
          y: 45,
          opacity: 0,
          duration: 0.9,
        });
    },
    {
      scope: pageRef,
    }
  );

  return (
    <div
      ref={pageRef}
      className="about-page"
    >
      <section className="about-page-hero">
        <div className="about-page-hero-bg" />

        <div className="about-page-hero-content">
          <div className="section-eyebrow about-page-eyebrow">
            <span />
            ABOUT RUDRAKSH
          </div>

          <h1>
            Together,
            <br />
            we create
            <br />
            <em>possibility.</em>
          </h1>

          <p>
            A community-focused organization built around
            compassion, education, culture and collective
            action.
          </p>
        </div>

        <div className="about-page-hero-side">
          <span>01</span>
          <span>OUR STORY</span>
        </div>
      </section>

      <section className="about-page-story">
        <div className="about-story-label">
          <span>01</span>
          OUR STORY
        </div>

        <div className="about-story-content">
          <h2>
            A community
            <br />
            built on <em>care.</em>
          </h2>

          <div className="about-story-text">
            <p>
              Rudraksh Social & Cultural Organization
              exists to bring people together around
              meaningful community initiatives.
            </p>

            <p>
              Through education, social support, cultural
              activities and community participation, we
              work to create opportunities for people to
              connect, contribute and move forward
              together.
            </p>

            <p>
              Our work is rooted in a simple belief:
              positive change becomes possible when
              people choose to take part.
            </p>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-heading">
          <div className="section-eyebrow">
            <span />
            WHAT DRIVES US
          </div>

          <h2>
            Our mission.
            <br />
            Our <em>vision.</em>
          </h2>
        </div>

        <div className="about-values-grid">
          <article className="about-value-card">
            <span className="about-value-number">
              01
            </span>

            <div>
              <h3>Mission</h3>

              <p>
                To support communities through meaningful
                initiatives in education, social welfare,
                health, culture and collective action.
              </p>
            </div>
          </article>

          <article className="about-value-card">
            <span className="about-value-number">
              02
            </span>

            <div>
              <h3>Vision</h3>

              <p>
                To help build stronger, more inclusive and
                compassionate communities where people have
                opportunities to grow and contribute.
              </p>
            </div>
          </article>

          <article className="about-value-card">
            <span className="about-value-number">
              03
            </span>

            <div>
              <h3>Community</h3>

              <p>
                We believe lasting impact comes from people
                working together, supporting one another
                and taking responsibility for their
                communities.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="about-beliefs">
        <div className="about-beliefs-inner">
          <div className="about-beliefs-mark">
            +
          </div>

          <div className="about-beliefs-content">
            <div className="section-eyebrow">
              <span />
              WHAT WE BELIEVE
            </div>

            <h2>
              Small actions can
              <br />
              create <em>lasting change.</em>
            </h2>

            <p>
              Every meal served, every student supported,
              every person who volunteers and every
              conversation that brings people together
              contributes to something bigger.
            </p>
          </div>
        </div>
      </section>

      <section className="about-page-cta">
        <div className="about-page-cta-content">
          <div className="section-eyebrow">
            <span />
            GET INVOLVED
          </div>

          <h2>
            Be part of
            <br />
            the <em>journey.</em>
          </h2>

          <p>
            There are many ways to contribute. Join our
            community, support an initiative or simply
            help us spread the word.
          </p>

          <div className="about-page-cta-actions">
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
      </section>
    </div>
  );
}

export default AboutPage;