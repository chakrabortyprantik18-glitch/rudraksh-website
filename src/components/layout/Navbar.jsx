import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const sections = [
      "home",
      "about",
      "projects",
      "gallery",
      "members",
      "donate",
      "membership",
      "faq",
      "contact",
    ];

    const handleSectionChange = () => {
      const scrollPosition = window.scrollY + 180;
      let currentSection = "home";

      sections.forEach((id) => {
        const element = document.getElementById(id);

        if (!element) return;

        if (element.offsetTop <= scrollPosition) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    handleSectionChange();

    window.addEventListener("scroll", handleSectionChange, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleSectionChange);
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const scrollToSection = (id) => {
    closeMenu();

    const element = document.getElementById(id);

    if (!element) {
      console.warn(`Section "${id}" was not found.`);
      return;
    }

    const navbar = document.querySelector(".navbar");

    const navbarHeight = navbar
      ? navbar.getBoundingClientRect().height
      : 80;

    const elementPosition =
      element.getBoundingClientRect().top + window.scrollY;

    const targetPosition = Math.max(
      elementPosition - navbarHeight - 15,
      0
    );

    window.history.replaceState(null, "", `#${id}`);

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  };

  const navItems = [
    ["home", "Home"],
    ["about", "About Us"],
    ["projects", "Projects"],
    ["gallery", "Gallery"],
    ["members", "Members"],
    ["donate", "Donate"],
    ["membership", "Become a Member"],
    ["faq", "FAQ"],
    ["contact", "Contact Us"],
  ];

  return (
    <header
      className={`navbar ${
        scrolled ? "navbar-scrolled" : ""
      }`}
    >
      {/* LOGO */}
      <button
        type="button"
        className="navbar-brand"
        onClick={() => scrollToSection("home")}
        aria-label="Go to homepage"
      >
        <img
          src="/images/rudraksh-logo.png"
          alt="Rudraksh Social & Cultural Organization"
        />
      </button>

      {/* NAVIGATION */}
      <nav
        id="main-navigation"
        className={`navbar-links ${
          menuOpen ? "navbar-links-open" : ""
        }`}
        aria-label="Main navigation"
      >
        {navItems.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`navbar-link ${
              activeSection === id ? "active" : ""
            }`}
            onClick={() => scrollToSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* MOBILE OVERLAY */}
      <div
        className={`navbar-overlay ${
          menuOpen ? "navbar-overlay-visible" : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ACTIONS */}
      <div className="navbar-actions">
        {/* DESKTOP DONATE */}
        <button
          type="button"
          className="navbar-donate"
          onClick={() => scrollToSection("donate")}
        >
          Donate Now
        </button>

        {/* MOBILE MENU */}
        <button
          type="button"
          className={`navbar-menu ${
            menuOpen ? "active" : ""
          }`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={
            menuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export default Navbar;