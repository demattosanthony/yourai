import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yo",
    short_name: "Yo",
    description: "Your AI",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    icons: [
      {
        src: "/YO_192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/YO_512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
