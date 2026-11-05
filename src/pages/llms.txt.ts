import type { APIRoute } from 'astro';
import { business } from '../config';
import { faqs } from '../data/faq';

const strip = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Plain-language summary for AI assistants (llmstxt.org convention). */
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  return new Response(`# ${business.name}

> ${business.name} (Google Business Profile: "${business.legalName}") is a 3D printing and 3D modelling studio in ${business.suburb}, Sydney, NSW, Australia, operating since ${business.since} with ${business.clients} clients. Rated ${business.google.rating.toFixed(1)}/5 on Google.

## Services
- FDM 3D printing in PLA, PETG, ASA, TPU 95A, polycarbonate and PETG-CF (carbon fibre). Layer heights 0.06–0.24 mm (0.2 mm and 0.4 mm nozzles). Max single piece 256 × 256 × 256 mm; larger objects are split and joined.
- 3D modelling / CAD design from hand sketches, photos, measurements or broken parts (no 3D file needed).
- Replacement and repair parts, prototypes, enclosures, jigs and fixtures, small-batch production (5–500 units).
- Typical turnaround 24–72 hours; next-business-day rush available.
- Pickup in Coogee (free), Sydney metro courier ($15), Australia Post Express Australia-wide ($18).

## How to order
- Design & print request (send any files, photos or a description; quote within one business day): ${u('/quote/')}
- Instant online quote for print-ready STL/3MF/STEP/OBJ files with user-selected slicer settings; card is only authorised at checkout and charged after a human checks the file: ${u('/instant-quote/')}

## Pricing (AUD, inc. GST)
Material $0.10–0.25 per gram (PLA lowest, PETG-CF highest) + machine time $3.50/hour + $3 setup per unique part + $8 order fee; $20 minimum order. 15% off 5–10 units, 25% off 11+. Details: ${u('/pricing/')}

## Contact
Phone ${business.phone} · Email ${business.email} · ${business.suburb} ${business.region} ${business.postcode}

## Pages
- [3D design from sketches](${u('/3d-design/')})
- [Materials comparison](${u('/materials/')})
- [Pricing](${u('/pricing/')})
- [FAQ](${u('/faq/')})

## FAQ
${faqs.map(f => `### ${f.q}\n${strip(f.a)}`).join('\n\n')}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
