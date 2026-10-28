import { useRef } from "react";

import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";

import { useWebsiteContent } from "../../hooks/useWebsiteContent";

import "./Impact.css";

function parseStatValue(value, fallback = "0") {
  const text =
    value === undefined ||
    value === null ||
    value === ""
      ? fallback
      : String(value);

  const match = text.match(
    /^([\d,]+(?:\.\d+)?)(.*)$/
  );

  if (!match) {
    return {
      number: 0,
      suffix: text,
      raw: text,
    };
  }

  return {
    number: Number(
      match[1].replace(/,/g, "")
    ),
    suffix: match[2] || "",
    raw: text,
  };
}

function Impact() {
  const sectionRef = useRef(null);

  const { content } =
    useWebsiteContent("impact");

  /* ============================================================
     CMS CONTENT
  ============================================================ */

  const heading =
    content?.heading ||
    "Our Impact";

  const description =
    content?.description ||
    "Every initiative is a step toward a stronger, more connected community.";

  const rawStats = [
    {
      value:
        content?.stat1Number ||
        "350+",
      label:
        content?.stat1Label ||
        "Meals Served",
    },
    {
      value:
        content?.stat2Number ||
        "80+",
      label:
        content?.stat2Label ||
        "Students Reached",
    },
    {
      value:
        content?.stat3Number ||
        "28",
      label:
        content?.stat3Label ||
        "Blood Donors",
    },
    {
      value:
        content?.stat4Number ||
        "34",
      label:
        content?.stat4Label ||
        "Active Members",
    },
  ];

  const stats = rawStats.map((stat) => ({
    ...stat,
    parsed: parseStatValue(stat.value),
  }));

  /* ============================================================
     GSAP

     IMPORTANT:
     No opacity animation is used.
     Content remains visible during first load.
  ============================================================ */

  useGSAP(
    () => {
      const section =
        sectionRef.current;

      if (!section) {
        return;
      }

      const items =
        section.querySelectorAll(
          ".impact-item"
        );

      const numbers =
        section.querySelectorAll(
          ".impact-number"
        );

      /*
       * Always keep content visible.
       */
      gsap.set(
        [
          ".impact-heading",
          ".impact-description",
          ".impact-item",
          ".impact-bottom-line",
        ],
        {
          opacity: 1,
          y: 0,
        }
      );

      /*
       * Initial counter values.
       */
      numbers.forEach(
        (element, index) => {
          const stat = stats[index];

          if (!stat) {
            return;
          }

          element.textContent =
            `0${stat.parsed.suffix}`;
        }
      );

      /*
       * Reduced motion.
       */
      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (prefersReducedMotion) {
        numbers.forEach(
          (element, index) => {
            const stat = stats[index];

            if (!stat) {
              return;
            }

            element.textContent =
              stat.parsed.raw;
          }
        );

        return;
      }

      /*
       * Check whether section is already visible.
       */
      const rect =
        section.getBoundingClientRect();

      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      if (isVisible) {
        /*
         * The section is already visible.
         * Keep all content visible and do not
         * run an opacity animation.
         */
        numbers.forEach(
          (element, index) => {
            const stat = stats[index];

            if (!stat) {
              return;
            }

            element.textContent =
              stat.parsed.raw;
          }
        );

        /*
         * Small movement only.
         */
        gsap.fromTo(
          [
            ".impact-heading",
            ".impact-description",
            ".impact-item",
            ".impact-bottom-line",
          ],
          {
            y: 18,
            opacity: 1,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
            clearProps: "transform",
          }
        );

        return;
      }

      /*
       * Heading + description animation.
       * Movement only — no opacity fade.
       */
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        })
        .fromTo(
          ".impact-heading",
          {
            y: 18,
            opacity: 1,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            clearProps: "transform",
          }
        )
        .fromTo(
          ".impact-description",
          {
            y: 18,
            opacity: 1,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
            clearProps: "transform",
          },
          "-=0.3"
        );

      /*
       * Statistics animation.
       * Movement only.
       */
      gsap.fromTo(
        items,
        {
          y: 18,
          opacity: 1,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            once: true,
          },
        }
      );

      /*
       * Animated counters.
       */
      stats.forEach(
        (stat, index) => {
          const counter = {
            value: 0,
          };

          const numberElement =
            numbers[index];

          if (!numberElement) {
            return;
          }

          /*
           * Don't animate text-only values.
           */
          if (
            !Number.isFinite(
              stat.parsed.number
            ) ||
            stat.parsed.number <= 0
          ) {
            numberElement.textContent =
              stat.parsed.raw;

            return;
          }

          gsap.to(counter, {
            value:
              stat.parsed.number,

            duration: 1.8,

            delay:
              index * 0.12,

            ease: "power2.out",

            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },

            onUpdate: () => {
              numberElement.textContent =
                `${Math.round(
                  counter.value
                )}${stat.parsed.suffix}`;
            },

            onComplete: () => {
              numberElement.textContent =
                stat.parsed.raw;
            },
          });
        }
      );

      /*
       * Bottom statement.
       * Movement only — no opacity fade.
       */
      gsap.fromTo(
        ".impact-bottom-line",
        {
          y: 18,
          opacity: 1,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
            once: true,
          },
        }
      );
    },
    {
      scope: sectionRef,

      /*
       * Re-run GSAP whenever CMS content changes.
       */
      dependencies: [content],

      /*
       * Clean up previous GSAP animations.
       */
      revertOnUpdate: true,
    }
  );

  return (
    <section
      ref={sectionRef}
      className="impact"
      id="impact"
    >
      {/* ======================================================
          HEADING
      ====================================================== */}

      <div className="impact-heading">
        <span>
          {heading}
        </span>
      </div>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      <p className="impact-description">
        {description}
      </p>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="impact-inner">
        {stats.map(
          (stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className="impact-item"
            >
              <div className="impact-number">
                0{stat.parsed.suffix}
              </div>

              <div className="impact-label">
                {stat.label}
              </div>
            </div>
          )
        )}
      </div>

      {/* ======================================================
          BOTTOM STATEMENT
      ====================================================== */}

      <div className="impact-bottom-line">
        <span />

        <p>
          Small actions. Meaningful
          change. Stronger communities.
        </p>

        <span />
      </div>
    </section>
  );
}

export default Impact;