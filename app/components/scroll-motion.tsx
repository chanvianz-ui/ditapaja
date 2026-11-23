"use client";
import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    const selectors = [
      ".dt-v2-hero-copy", ".dt-v2-hero-art", ".dt-v2-section-heading", ".dt-edition-card", ".dt-v2-dashboard-copy", ".dt-v2-dashboard-stage", ".dt-v2-how-heading", ".dt-v2-steps article",
      ".dt-page-heading", ".dt-kpi", ".dt-overview-grid > *", ".dt-insights > *", ".dt-card-manager > *",
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
