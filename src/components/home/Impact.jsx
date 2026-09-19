import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./Impact.css";

const stats = [
  {
    value: 350,
    suffix: "+",
    label: "Meals Served",
  },
  {
    value: 80,
    suffix: "+",
    label: "Students Reached",
  },
  {
    value: 28,
    suffix: "",
    label: "Blood Donors",
  },
  {
    value: 34,
    suffix: "",
    label: "Active Members",
  },
];

function Impact() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const items = section.querySelectorAll(".impact-item");
      const numbers = section.querySelectorAll(".impact-number");

      /*
        IMPORTANT:
        Keep everything visible by default.

        This prevents the section from becoming blank if
        the user navigates directly to a hash like #home
        or #about.
      */
      gsap.set(items, {
        opacity: 1,
        y: 0,
      });

      // Set initial counter values
      numbers.forEach((number, index) => {
        const stat = stats[index];

        number.textContent = `0${stat.suffix}`;
      });

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        numbers.forEach((number, index) => {
          const stat = stats[index];

          number.textContent = `${stat.value}${stat.suffix}`;
        });

        return;
      }

      /*
        Check whether the section is already visible.

        This is important when the user clicks Navbar links
        or refreshes while already around this section.
      */
      const rect = section.getBoundingClientRect();

      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      /*
        If Impact is already visible, immediately show
        the final numbers instead of waiting for ScrollTrigger.
      */
      if (isVisible) {
        numbers.forEach((number, index) => {
          const stat = stats[index];

          number.textContent = `${stat.value}${stat.suffix}`;
        });

        return;
      }

      /*
        Normal scroll animation.
      */

      const triggerConfig = {
        trigger: section,
        start: "top 82%",
        once: true,
      };

      // Items animate upward when entering viewport
      gsap.from(items, {
        y: 45,
        opacity: 0,
        duration: 0.9,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: triggerConfig,
      });

      // Animated counters
      stats.forEach((stat, index) => {
        const counter = {
          value: 0,
        };

        gsap.to(counter, {
          value: stat.value,
          duration: 1.8,
          delay: index * 0.12,
          ease: "power2.out",

          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },

          onUpdate: () => {
            numbers[index].textContent =
              `${Math.round(counter.value)}${stat.suffix}`;
          },

          onComplete: () => {
            numbers[index].textContent =
              `${stat.value}${stat.suffix}`;
          },
        });
      });
    },
    {
      scope: sectionRef,
    }
  );

  return (
    <section
      ref={sectionRef}
      className="impact"
      id="impact"
    >
      {/* Section heading */}
      <div className="impact-heading">
        <span>OUR IMPACT</span>
      </div>

      {/* Statistics */}
      <div className="impact-inner">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="impact-item"
          >
            <div className="impact-number">
              0{stat.suffix}
            </div>

            <div className="impact-label">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom statement */}
      <div className="impact-bottom-line">
        <span />

        <p>
          Small actions. Meaningful change. Stronger communities.
        </p>

        <span />
      </div>
    </section>
  );
}

export default Impact;