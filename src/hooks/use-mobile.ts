
"use client";

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Corresponds to md: in Tailwind

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on initial load
    checkScreenSize();

    // Add event listener for screen size changes
    window.addEventListener('resize', checkScreenSize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return isMobile;
}
