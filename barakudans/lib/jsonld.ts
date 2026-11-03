import { config } from './config';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** schema.org BarOrPub markup za Google. */
export function barJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    name: config.name,
    description: config.description,
    url: config.siteUrl,
    telephone: config.contact.phone,
    email: config.contact.email,
    address: { '@type': 'PostalAddress', streetAddress: config.contact.address },
    sameAs: [config.social.instagram, config.social.facebook].filter(Boolean),
    acceptsReservations: true,
    openingHoursSpecification: config.hours.filter((h) => h.open).map((h) => ({
      '@type': 'OpeningHoursSpecification', dayOfWeek: DAY[h.day], opens: h.open, closes: h.close,
    })),
  };
}
