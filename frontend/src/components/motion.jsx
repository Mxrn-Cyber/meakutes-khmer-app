import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { reducedMotion } from "../utils/motion";

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
