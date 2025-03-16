"use client";

import "./globals.css";
import Logo from "@/components/ui/logo";
import { Funnel_Display } from "next/font/google";
const funnelDisplay = Funnel_Display({ subsets: ["latin"] });
import { useEffect, useState } from "react";
import Benchmark from "@/components/blocks/benchmark";
import Link from "next/link";
import { IconBrandX, IconBrandLinkedinFilled } from "@tabler/icons-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  return (
    <div className="max-w-[90rem] w-full mx-auto flex justify-between items-center py-4 px-5 md:px-20">
      <Logo />

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-1">
        <a
          href="#"
          className="text-neutral-800 px-3.5 py-1.5 hover:bg-neutral-200 transition"
        >
          Explore
        </a>
        <a
          href="#"
          className="text-neutral-800 px-3.5 py-1.5 hover:bg-neutral-200 transition"
        >
          Pricing
        </a>
        <a
          href="/auth/login"
          className="text-neutral-800 px-3.5 py-1.5 hover:bg-neutral-200 transition"
        >
          Sign In
        </a>
        <a
          href="/auth/register"
          className="text-white px-3.5 py-1.5 bg-gradient-to-b to-[#d44700] from-[#fa5f11] hover:bg-[#d44700] hover:bg-none font-light rounded-md"
        >
          Get Early Access
        </a>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span
          className={`block w-6 h-0.5 bg-neutral-800 transform transition duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
        ></span>
        <span
          className={`block w-6 h-0.5 bg-neutral-800 transition duration-300 ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
        ></span>
        <span
          className={`block w-6 h-0.5 bg-neutral-800 transform transition duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
        ></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-10" onClick={toggleMenu}>
          <div
            className="flex flex-col items-center justify-start h-full space-y-6 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="self-end p-2"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <a
              href="#"
              className="text-neutral-800 px-3.5 py-2 w-full text-center text-lg hover:bg-neutral-100 transition"
            >
              Explore
            </a>
            <a
              href="#"
              className="text-neutral-800 px-3.5 py-2 w-full text-center text-lg hover:bg-neutral-100 transition"
            >
              Pricing
            </a>
            <a
              href="/auth/login"
              className="text-neutral-800 px-3.5 py-2 w-full text-center text-lg hover:bg-neutral-100 transition"
            >
              Sign In
            </a>
            <a
              href="/auth/register"
              className="text-white px-3.5 py-2 w-full text-center text-lg bg-gradient-to-b to-[#d44700] from-[#fa5f11] hover:bg-[#d44700] hover:bg-none font-light rounded-md"
            >
              Get Early Access
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const Hero = () => {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-6 max-w-xl py-5 mx-auto text-center">
        <h1
          className={
            "text-[3rem] leading-[1.2] font-semibold " + funnelDisplay.className
          }
        >
          Web Automation,
          <br /> Made Effortless
        </h1>
        <p className="flex text-[17px] font-normal flex-col gap-4 my-6 text-black">
          <span>Tired of repetitive tasks eating up your time?</span>
          <span>
            Orchestrator lets you to automate your workflows with ease. Our AI
            powered web automation tool handles everything from finding best
            deals on flights to managing social media, freeing you to focus on
            what matters most.
          </span>
        </p>
      </div>
    </>
  );
};

const DemoVideo = () => {
  return (
    <div className="mx-auto max-w-4xl px-5">
      <video
        className="w-full h-full rounded-xl"
        src="https://orchestrator.company/demo-1.mp4"
        controls
        autoPlay={false}
        muted={false}
        loop={false}
      />
    </div>
  );
};

function GridBackground({ children }) {
  const [gridSize, setGridSize] = useState(1000);

  useEffect(() => {
    const calculateOptimalGridSize = () => {
      const windowWidth = window.innerWidth;
      // Find a grid size between 55-65px that divides evenly into the window width
      let optimalSize = 60; // Default

      // Try sizes from 55-65px
      for (let size = 55; size <= 65; size++) {
        // Check if this size divides more evenly into the window width
        if (windowWidth % size < windowWidth % optimalSize) {
          optimalSize = size;
        }
      }

      setGridSize(optimalSize);
    };

    calculateOptimalGridSize();
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-transparent">
      {/* Grid overlay with fading edges */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          maskImage: `radial-gradient(
            ellipse at center,
            white calc(100% - 400px),
            transparent
          )`,
          WebkitMaskImage: `radial-gradient(
            ellipse at center,
            white calc(100% - 40vw),
            transparent
          )`,
        }}
      />

      {/* Content container */}
      <div className="relative">{children}</div>
    </div>
  );
}

const Footer = () => {
  return (
    <footer className="max-w-[90rem] w-full mx-auto flex justify-between items-center py-4 px-5 md:px-20">
      <div className="text-sm">© 2025 Orchestrator. All rights reserved.</div>
      <div className="flex items-center space-x-4">
        <Link
          className="flex gap-2 items-center"
          href="https://twitter.com/orchestrator"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandX size={19} />
          Twitter / X
        </Link>
        <Link
          className="flex gap-2 items-center"
          href="https://linkedin.com/company/orchestrator"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandLinkedinFilled size={19} />
          LinkedIn
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="#">Explore</Link>
        <Link href="#">Pricing</Link>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <div className="bg-orange-900/5 min-h-screen">
      <GridBackground>
        <div className="flex flex-col gap-20">
          <Navbar />
          <Hero />
          <DemoVideo />
          <Benchmark />
          <Footer />
        </div>
      </GridBackground>
    </div>
  );
}
