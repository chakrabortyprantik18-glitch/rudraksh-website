import "./App.css";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Hero from "./components/home/Hero";
import Impact from "./components/home/Impact";
import About from "./components/home/About";
import Projects from "./components/home/Projects";
import GalleryPreview from "./components/home/GalleryPreview";
import MembersPreview from "./components/home/MembersPreview";
import Membership from "./components/home/Membership";
import Donate from "./components/home/Donate";
import HomeCTA from "./components/home/HomeCTA";
import FAQ from "./components/home/FAQ";
import Contact from "./components/home/Contact";

import ChatBot from "./components/common/ChatBot";

function App() {
  return (
    <div className="app">

      <Navbar />

      <main>
        <Hero />

        <Impact />

        <About />

        <Projects />

        <GalleryPreview />

        <MembersPreview />

        <Membership />

        <Donate />

        <HomeCTA />

        <FAQ />

        <Contact />
      </main>

      <Footer />

      <ChatBot />

    </div>
  );
}

export default App;