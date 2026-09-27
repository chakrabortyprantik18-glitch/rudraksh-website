import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

import { Link } from "react-router-dom";

import "./Footer.css";

import {
  useWebsiteContent,
  getContentImageUrl,
} from "../../hooks/useWebsiteContent";

function Footer() {
  const { content } =
    useWebsiteContent("footer");

  /*
   * ============================================================
   * CMS CONTENT
   * ============================================================
   */

  const description =
    content?.description ||
    "Building stronger communities through compassion, education, culture and collective action.";

  const copyright =
    content?.copyright ||
    `© ${new Date().getFullYear()} Rudraksh Social & Cultural Organization. All rights reserved.`;

  const logo =
    getContentImageUrl(
      content?.logo
    ) || "/images/rudraksh-logo.png";

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <footer className="footer">

      <div className="footer-container">

        {/* =========================
            BRAND
        ========================== */}

        <div className="footer-brand">

          <img
            src={logo}
            alt="Rudraksh Social & Cultural Organization"
            className="footer-logo"
            onError={(event) => {
              if (
                event.currentTarget.src.endsWith(
                  "/images/rudraksh-logo.png"
                )
              ) {
                return;
              }

              event.currentTarget.src =
                "/images/rudraksh-logo.png";
            }}
          />

          <p className="footer-description">
            {description}
          </p>

          {/* =========================
              SOCIAL MEDIA
          ========================== */}

          <div className="footer-socials">

            <a
              href="https://www.instagram.com/rudrakshsocialandculturalorg_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social"
            >
              <FaInstagram />
            </a>

            <a
              href="https://www.facebook.com/people/Rudraksh-Social-Cultural-Organization/61559876373123/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="footer-social"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://in.linkedin.com/in/rudraksh-social-and-cultural-organization-6b1b09405"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="footer-social"
            >
              <FaLinkedinIn />
            </a>

            <a
              href="https://youtube.com/@rudrakshsocialculturalorganiza"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="footer-social"
            >
              <FaYoutube />
            </a>

          </div>

        </div>

        {/* =========================
            EXPLORE
        ========================== */}

        <div className="footer-links">

          <h3>
            EXPLORE
          </h3>

          <Link to="/#home">
            Home
          </Link>

          <Link to="/#about">
            About Us
          </Link>

          <Link to="/projects">
            Projects
          </Link>

          <Link to="/gallery">
            Gallery
          </Link>

          <Link to="/members">
            Members
          </Link>

          <Link to="/#membership">
            Become a Member
          </Link>

          <Link to="/#donate">
            Donate
          </Link>

          <Link to="/#faq">
            FAQ
          </Link>

          <Link to="/#contact">
            Contact Us
          </Link>

        </div>

      </div>

      {/* =========================
          CONTACT STRIP
      ========================== */}

      <div className="footer-contact-strip">

        <a
          href="mailto:rudrakshsocialculturalorganiza@gmail.com"
        >
          rudrakshsocialculturalorganiza@gmail.com
        </a>

        <a
          href="tel:+918811863845"
        >
          +91  88118 63845
        </a>

        <a
          href="https://wa.link/tvck85"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp ↗
        </a>

        <a
          href="https://maps.app.goo.gl/FPXGBVp8tz6Fy8rf9"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Maps ↗
        </a>

      </div>

      {/* =========================
          BOTTOM
      ========================== */}

      <div className="footer-bottom">

        <div className="footer-bottom-left">

          <p>
            {copyright}
          </p>

          <p className="footer-credit">
            Designed &amp; Developed by{" "}
            <strong>
              Prantik Chakrabarty
            </strong>
          </p>

        </div>

        <span className="footer-bottom-brand">
          RUDRAKSH
        </span>

      </div>

    </footer>
  );
}

export default Footer;