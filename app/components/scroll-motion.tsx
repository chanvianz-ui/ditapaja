"use client";
import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    const selectors = [
      ".concept-section-top",
      ".concept-product",
      ".concept-experience-head",
      ".concept-flow article",
      ".concept-experience-note",
      ".concept-dashboard-copy",
      ".concept-dashboard-visual",
      ".concept-faq > div",
      ".concept-final h2",
      ".concept-final p",
      ".concept-final-button"
    ];
    const elements = document.querySelectorAll<HTMLElement>(selectors.join(","));
    elements.forEach((element, index) => {
      element.classList.add("motion-item");
      element.style.setProperty("--motion-delay", `${Math.min(index % 4, 3) * 90}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
