import { useEffect } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll reveal for the whole app. Any element with a `data-reveal` attribute fades up
 * when it scrolls into view (see global.css). New elements added later (for example
 * after data loads) are picked up automatically. Call once, in the app shell.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || reducedMotion()) return;
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const watch = (node) => {
      if (!(node instanceof Element)) return;
      if (node.hasAttribute("data-reveal") && !node.classList.contains("is-visible")) io.observe(node);
      node.querySelectorAll?.("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    };
    watch(document.body);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) m.addedNodes.forEach(watch);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/** Props for a staggered reveal: <div {...reveal(i)}> */
export const reveal = (index = 0, step = 70, kind = "") => ({
  "data-reveal": kind,
  style: { "--reveal-delay": `${Math.min(index, 8) * step}ms` },
});
