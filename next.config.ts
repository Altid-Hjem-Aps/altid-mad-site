import type { NextConfig } from "next";
import { assertRetiredFlag, isRetired } from "./lib/retire";

assertRetiredFlag();

// STATIC_EXPORT=1 builds a fully static site (for the GitHub Pages preview at
// thorfraaltid.github.io) — no API routes, no redirects; the waitlist form
// can't submit there.
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const } : {}),
  // Retired: proxy.ts must see the path as requested. Next's own trailing-slash redirect would
  // add a hop before the 301 (/madbudget/ -> /madbudget -> altidhjem.dk), and its URL
  // normalisation would hide the original path from the proxy.
  ...(isRetired() ? { skipTrailingSlashRedirect: true, skipProxyUrlNormalize: true } : {}),
  ...(isExport
    ? {}
    : {
        async redirects() {
          // Retired (SITE_RETIRED=1): proxy.ts sends every page to www.altidhjem.dk in one hop.
          // These rules run before the proxy and would add a hop (www -> apex -> altidhjem.dk).
          if (isRetired()) return [];
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
