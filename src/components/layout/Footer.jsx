import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* =========================
            BRAND
        ========================== */}

        <div className="footer-brand">

          <img
            src="/images/rudraksh-logo.png"
            alt="Rudraksh Social & Cultural Organization"
            className="footer-logo"
          />

          <p className="footer-description">
            Building stronger communities through compassion,
            education, culture and collective action.
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

          <h3>EXPLORE</h3>

          <a href="#home">Home</a>

          <a href="#about">About Us</a>

          <a href="#projects">Projects</a>

          <a href="#gallery">Gallery</a>

          <a href="#members">Members</a>

          <a href="#membership">Become a Member</a>

          <a href="#donate">Donate</a>

          <a href="#faq">FAQ</a>

          <a href="#contact">Contact Us</a>

        </div>

      </div>

      {/* =========================
          CONTACT STRIP
      ========================== */}

      <div className="footer-contact-strip">

        <a href="mailto:rudrakshsocialculturalorganiza@gmail.com">
          rudrakshsocialculturalorganiza@gmail.com
        </a>

        <a href="tel:+919365716093">
          +91 93657 16093
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
            © {new Date().getFullYear()} Rudraksh Social & Cultural
            Organization. All rights reserved.
          </p>

          <p className="footer-credit">
            Designed &amp; Developed by{" "}
            <strong>Prantik Chakrabarty</strong>
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