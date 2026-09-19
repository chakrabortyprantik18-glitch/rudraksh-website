import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./FAQ.css";

const API_URL = "http://localhost:5000/api/faqs";

function FAQ() {
  const sectionRef = useRef(null);

  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ==================================================
  LOAD FAQs FROM BACKEND
  ==================================================
  */

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load FAQs."
          );
        }

        setFaqs(data.faqs || []);
      } catch (err) {
        console.error(
          "PUBLIC FAQ LOAD ERROR:",
          err
        );

        setError(
          "Unable to load FAQs right now."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, []);

  /*
  ==================================================
  GSAP ANIMATION
  ==================================================
  */

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const elements = section.querySelectorAll(
        ".faq-eyebrow, .faq-title, .faq-intro, .faq-item"
      );

      // Keep the content visible by default.
      gsap.set(elements, {
        opacity: 1,
        y: 0,
      });

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (prefersReducedMotion) {
        return;
      }

      const rect =
        section.getBoundingClientRect();

      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0;

      if (isVisible) {
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
        .from(".faq-eyebrow", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        .from(
          ".faq-title",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .from(
          ".faq-intro",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".faq-item",
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
          },
          "-=0.25"
        );
    },
    {
      scope: sectionRef,
      dependencies: [faqs.length],
    }
  );

  /*
  ==================================================
  TOGGLE FAQ
  ==================================================
  */

  const toggleFAQ = (index) => {
    setOpenIndex((current) =>
      current === index ? null : index
    );
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="faq-section"
    >
      <div className="faq-container">

        {/* =========================
            HEADER
        ========================== */}

        <div className="faq-header">
          <div className="faq-eyebrow">
            <span />
            FREQUENTLY ASKED QUESTIONS
          </div>

          <h2 className="faq-title">
            Questions?
            <br />
            <em>We've got answers.</em>
          </h2>

          <p className="faq-intro">
            Find answers to some of the common
            questions about Rudraksh, our work
            and how you can get involved.
          </p>
        </div>

        {/* =========================
            QUESTIONS
        ========================== */}

        <div className="faq-list">

          {/* LOADING */}

          {loading && (
            <div
              style={{
                padding: "30px 0",
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              Loading FAQs...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              style={{
                padding: "30px 0",
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              {error}
            </div>
          )}

          {/* NO FAQ */}

          {!loading &&
            !error &&
            faqs.length === 0 && (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  opacity: 0.7,
                }}
              >
                No FAQs available at the
                moment.
              </div>
            )}

          {/* FAQ DATA FROM DATABASE */}

          {!loading &&
            !error &&
            faqs.map((faq, index) => {
              const isOpen =
                openIndex === index;

              return (
                <div
                  key={faq.id}
                  className={`faq-item ${
                    isOpen
                      ? "faq-item-open"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() =>
                      toggleFAQ(index)
                    }
                    aria-expanded={isOpen}
                  >
                    <span className="faq-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                    <span className="faq-question-text">
                      {faq.question}
                    </span>

                    <span className="faq-icon">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  <div
                    className="faq-answer-wrapper"
                    style={{
                      gridTemplateRows:
                        isOpen
                          ? "1fr"
                          : "0fr",
                    }}
                  >
                    <div className="faq-answer">
                      <p>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

        </div>
      </div>

      {/* =========================
          BOTTOM BRAND LINE
      ========================== */}

      <div className="faq-bottom">
        <span>RUDRAKSH</span>
        <span>
          QUESTIONS · COMMUNITY · ACTION
        </span>
      </div>
    </section>
  );
}

export default FAQ;