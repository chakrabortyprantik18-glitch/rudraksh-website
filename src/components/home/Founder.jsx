import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../../services/gsap";
import "./Founder.css";

function Founder() {
  const sectionRef = useRef(null);

  const founders = [
    {
      name: "Saubhik Roy",
      role: "Founder & President",
      title: "Founding Member",
      description:
        "A founding member of Rudraksh Social & Cultural Organization, helping shape its journey and commitment toward community development.",
      image:
        "https://www.rudrakshsocialculturalorganization.online/images/founder.jpeg",
    },
  ];

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) return;

      const elements = section.querySelectorAll(
        ".founder-eyebrow, .founder-title, .founder-intro, .founder-card"
      );

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      gsap.set(elements, {
        opacity: 1,
        y: 0,
      });

      if (prefersReducedMotion) return;

      const rect = section.getBoundingClientRect();
      const visible =
        rect.top < window.innerHeight && rect.bottom > 0;

      gsap.fromTo(
        elements,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform",
          ...(visible
            ? {}
            : {
                scrollTrigger: {
                  trigger: section,
                  start: "top 82%",
                  once: true,
                },
              }),
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="founder-section"
      id="founders"
    >
      <div className="founder-container">
        <div className="founder-header">
          <div className="founder-eyebrow">
            <span />
            THE FOUNDERS
          </div>

          <h2 className="founder-title">
            The people who
            <br />
            <em>started the journey.</em>
          </h2>

          <p className="founder-intro">
            Behind every organization is a vision,
            and behind that vision are people who
            choose to take the first step.
          </p>
        </div>

        <div className="founder-list">
          {founders.map((founder, index) => (
            <article
              className="founder-card"
              key={`${founder.name}-${index}`}
            >
              <div className="founder-photo-area">
                <div className="founder-photo-circle">
                  <div className="founder-photo-ring" />

                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="founder-photo"
                    loading="eager"
                    decoding="async"
                    onError={(event) => {
                      console.error(
                        "Founder image failed to load:",
                        event.currentTarget.src
                      );
                    }}
                  />
                </div>

                <span className="founder-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="founder-info">
                <div className="founder-role">
                  {founder.title}
                </div>

                <h3>{founder.name}</h3>

                <p className="founder-position">
                  {founder.role}
                </p>

                <p className="founder-description">
                  {founder.description}
                </p>

                <div className="founder-line">
                  <span />
                  <span>RUDRAKSH</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Founder;
