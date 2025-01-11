import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yo",
    short_name: "Your AI",
    description: "Chat with any LLM",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/appIcon.svg",
        sizes: "any", // SVG is scalable
        type: "image/svg+xml",
        purpose: "any", // Can also be "maskable" or "any maskable"
      },
    ],
  };
}
