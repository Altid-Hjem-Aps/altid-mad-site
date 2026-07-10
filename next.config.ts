import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a fully static site (for the GitHub Pages preview at
// thorfraaltid.github.io) — no API routes, no redirects; the waitlist form
// can't submit there.
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const } : {}),
  ...(isExport
    ? {}
    : {
        async redirects() {
          return [
            // Canonical host: www serves the same content as the apex, so 301
            // it to https://altidmad.dk (metadata already assumes the apex).
            {
              source: "/:path*",
              has: [{ type: "host" as const, value: "www.altidmad.dk" }],
              destination: "https://altidmad.dk/:path*",
              permanent: true,
            },
            // SEO-siden flyttede til søgeords-slug (12. jun 2026) — 301 bevarer
            // evt. indekserede /elpriser-links og delte URL'er.
            {
              source: "/elpriser",
              destination: "/hvornar-er-strommen-billigst",
              permanent: true,
            },
          ];
        },
      }),
};

export default nextConfig;
