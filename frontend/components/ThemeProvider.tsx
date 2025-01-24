"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const updateThemeColor = React.useCallback((isDark: boolean) => {
    const themeColor = isDark ? "#121212" : "#ffffff";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", themeColor);
  }, []);

  React.useEffect(() => {
    // Set theme color whenever the pathname changes
    const isDark = document.documentElement.classList.contains("dark");
    updateThemeColor(isDark);
  }, [pathname, updateThemeColor]);

  React.useEffect(() => {
    // Set initial theme color
    const isDark = document.documentElement.classList.contains("dark");
    updateThemeColor(isDark);

    // Update theme color when dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLElement) {
          const isDark = mutation.target.classList.contains("dark");
          updateThemeColor(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [updateThemeColor]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
