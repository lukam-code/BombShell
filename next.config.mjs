/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // CSS (~10 KB) se ugrađuje u HTML – nema dodatnog zahteva koji blokira prvi prikaz
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        // Slike se retko menjaju: keš 1 dan + do 7 dana stara kopija dok se proverava nova
        // (imena fajlova nemaju verziju, pa duži keš ne bi pokazao zamenjenu sliku)
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        // Linkovi za otkazivanje i admin panel ne smeju u pretragu
        source: "/(admin|otkazivanje)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
