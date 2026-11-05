/**
 * Business details used across the whole site, structured data and footer.
 * Keep name / phone / suburb IDENTICAL to the Google Business Profile — Google
 * matches them to link the website and the map listing.
 */
export const business = {
  name: 'Ultimate3D Sydney',
  // Exact name on the Google Business Profile.
  legalName: 'Ultimate 3d Printing & Modeling',
  tagline: '3D printing & 3D modelling studio in Coogee, Sydney',
  phone: '0410 937 558',
  phoneIntl: '+61410937558',
  email: 'pro3dsydney@gmail.com',
  suburb: 'Coogee',
  city: 'Sydney',
  region: 'NSW',
  postcode: '2034',
  country: 'AU',
  // Street address is on the Google profile. Set showStreet=true to also show it here
  // (only do this if you're happy to publish it — e.g. not a home address).
  street: '101 Carrington Rd',
  showStreet: false,
  since: 2017,
  clients: '600+',
  turnaround: '24–72 h',
  google: {
    rating: 5.0,
    reviewCount: 5,
    // Replace with the "Share" link from your Google Business Profile.
    profileUrl: 'https://www.google.com/maps/search/?api=1&query=Ultimate+3d+Printing+%26+Modeling+Coogee',
    // Replace with the "Ask for reviews" link from your Google Business Profile.
    reviewUrl: 'https://www.google.com/maps/search/?api=1&query=Ultimate+3d+Printing+%26+Modeling+Coogee',
  },
  sameAs: [] as string[], // add Instagram / Facebook URLs here
};

export const API_BASE = (import.meta.env.PUBLIC_API_URL || '').replace(/\/$/, '');
export const GA_ID = import.meta.env.PUBLIC_GA_ID || '';
export const CLARITY_ID = import.meta.env.PUBLIC_CLARITY_ID || '';

export const nav = [
  { href: '/3d-design/', label: '3D design' },
  { href: '/instant-quote/', label: 'Instant quote' },
  { href: '/materials/', label: 'Materials' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/faq/', label: 'FAQ' },
];
