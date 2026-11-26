import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";

function Reveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.9,
  distance = 45,
}) {
  const container = useRef(null);

  useGSAP(
    () => {
      const element = container.current;

      if (!element) {
        return;
      }

      const movement = {
        up: {
          y: distance,
          x: 0,
        },

        down: {
          y: -distance,
          x: 0,
        },

        left: {
          y: 0,
          x: distance,
        },

        right: {
          y: 0,
          x: -distance,
        },

        fade: {
          y: 0,
          x: 0,
        },
      };

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(element, {
          opacity: 1,
          x: 0,
          y: 0,
        });

        return;
      }

      gsap.from(element, {
        ...movement[direction],

        opacity: 0,

        duration,

        delay,

        ease: "power3.out",

        scrollTrigger: {
          trigger: element,

          start: "top 88%",

          once: true,
        },
      });
    },
    {
      scope: container,
    }
  );

  return (
    <div
      ref={container}
      className={className}
    >
      {children}
    </div>
  );
}

export default Reveal;