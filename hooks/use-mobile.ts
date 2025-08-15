// hooks/use-mobile.ts
"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    };

    // Set initial
    onChange(mql);

    // Listen for changes
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener("change", onChange as (e: MediaQueryListEvent) => void);
    } else {
      // Safari < 14 fallback
      mql.addListener(onChange as any);
      return () => mql.removeListener(onChange as any);
    }
  }, [breakpoint]);

  return isMobile;
}
