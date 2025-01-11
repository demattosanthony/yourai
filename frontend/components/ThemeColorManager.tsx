"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ThemeColorManager() {
  const { theme, systemTheme } = useTheme();
  const pathname = usePathname(); // Add this to track route changes

  useEffect(() => {
    const updateThemeColor = () => {
      const themeColor = document.querySelector('meta[name="theme-color"]');
      const currentTheme = theme === "system" ? systemTheme : theme;

      if (themeColor) {
        themeColor.setAttribute(
          "content",
          currentTheme === "dark" ? "hsl(0 0% 7%)" : "#ffffff"
        );
      }
    };

    // Update immediately
    updateThemeColor();

    // Also update on route changes
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme, systemTheme, pathname]); // Include pathname in dependencies

  return null;
}
