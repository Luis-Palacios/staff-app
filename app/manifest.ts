import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// A manifest can't use CSS variables, so these are navy-900 from tokens/brand.json. The install
// splash shows the white-and-gold mark on navy. The in-browser theme colors are in the
// `viewport` export of app/layout.tsx.
const NAVY_900 = "#0B2341";

// Served at /manifest.webmanifest. It has no request, so the description is not translated;
// the name is the brand.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.name,
    description:
      "Staff app for managing members, small groups and applications.",
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: NAVY_900,
    background_color: NAVY_900,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
  };
}
