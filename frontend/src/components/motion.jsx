import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";

const reducedMotion = () =>
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

/** Counts up from 0 to `value` when it scrolls into view. Uses Khmer digits in Khmer. */
export function CountUp({ value, duration = 1200, decimals = 0 }) {
  const { num } = useLang();
  const ref = useRef(null);
  const [shown, setShown] = useState(reducedMotion() ? value : 0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(target);
      return;
    }
    let frame;
    let started = false;
    const run = () => {
      started = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(target * eased);
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        run();
        io.disconnect();
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref}>{num(Number(shown).toFixed(decimals))}</span>;
}

/** An <img> that fades in once loaded (also when it came from the browser cache). */
export function FadeImg({ className = "", onLoad, ...props }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [props.src]);
  return (
    <img
      ref={ref}
      {...props}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={() => setLoaded(true)}
      className={`fade-img ${loaded ? "is-loaded" : ""} ${className}`}
    />
  );
}
