import { siteConfig } from "./siteConfig";
import type { ReviewsSummary } from "./types";

/** schema.org BeautySalon. aggregateRating se dodaje SAMO ako postoje odobrene recenzije. */
export function beautySalonJsonLd(summary: ReviewsSummary) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteConfig.url}/#salon`,
    name: siteConfig.fullName,
    description: siteConfig.seo.description,
    slogan: siteConfig.slogan,
    url: siteConfig.url,
    telephone: siteConfig.phone.e164,
    email: siteConfig.email,
    image: `${siteConfig.url}/opengraph-image`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      postalCode: siteConfig.address.postalCode,
      addressLocality: siteConfig.address.city,
      addressCountry: siteConfig.address.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: siteConfig.geo.lat, longitude: siteConfig.geo.lng },
    hasMap: siteConfig.navigationUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: siteConfig.openingHoursSpec.days,
        opens: siteConfig.openingHoursSpec.opens,
        closes: siteConfig.openingHoursSpec.closes,
      },
    ],
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
  };
  if (summary.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(summary.average.toFixed(2)),
      reviewCount: summary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return data;
}
