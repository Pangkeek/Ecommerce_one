"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSiteMotion } from "./motion-preferences";

type RevealProps = {
  children: ReactNode;
  className?: string;
  variant?: "rise" | "wipe" | "drift";
  delay?: number;
};

export function Reveal({ children, className = "", variant = "rise", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useSiteMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const frames = variant === "wipe"
      ? [{ clipPath: "inset(0 0 100% 0 round 4px)", opacity: 1 }, { clipPath: "inset(0 0 0% 0 round 4px)", opacity: 1 }]
      : variant === "drift"
        ? [{ transform: "translate3d(0, 48px, 0) rotate(4deg)", opacity: 0 }, { transform: "translate3d(0, 0, 0) rotate(0)", opacity: 1 }]
        : [{ transform: "translate3d(0, 36px, 0)", opacity: 0 }, { transform: "translate3d(0, 0, 0)", opacity: 1 }];
    // Start only after hydration: SSR and the first client render stay identical.
    const animation = element.animate(frames, {
      duration: 1150, delay: Math.min(delay * 1000, 350), fill: "both",
      easing: "cubic-bezier(0.22, 0.68, 0, 1)",
    });
    animation.pause();
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { animation.play(); observer.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      animation.play();
    } else {
      observer.observe(element);
    }
    return () => { observer.disconnect(); animation.cancel(); };
  }, [enabled, variant, delay]);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
