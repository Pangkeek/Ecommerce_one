"use client";

import { createContext, useContext, useEffect } from "react";
import { MotionConfig } from "motion/react";

const MotionContext = createContext({ enabled: true, toggle: () => {} });
export function MotionPreferences({ children }: { children: React.ReactNode }) {
  const enabled = true;
  useEffect(() => {
    document.documentElement.dataset.motion = "full";
  }, []);
  return <MotionContext.Provider value={{ enabled, toggle: () => {} }}>
    <MotionConfig reducedMotion="never">{children}</MotionConfig>
  </MotionContext.Provider>;
}

export const useSiteMotion = () => useContext(MotionContext);
