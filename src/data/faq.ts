/** FAQ content. Used on /faq (with FAQPage structured data) and in snippets on other pages. */
export const faqs: { id: string; q: string; a: string }[] = [
  {
    id: 'no-file',
    q: 'I don’t have a 3D file. Can you still help?',
    a: '<p>Yes, and that’s a big part of what we do. Send a photo, a hand sketch with measurements, a broken part, or just describe what you need. We’ll model it in CAD, check the details with you, then print it. <a href="/3d-design/">How our 3D design service works →</a></p>',
  },
  {
    id: 'formats',
    q: 'What files can I send?',
    a: '<p>3D files: STL, 3MF, OBJ, STEP/STP and IGES. For design work: photos (JPG, PNG, HEIC), PDFs, drawings, DXF/SVG, or a ZIP of everything. Files up to 200&nbsp;MB each.</p>',
  },
  {
    id: 'two-ways',
    q: 'What’s the difference between a request and an instant quote?',
    a: '<p><b>Design &amp; print request</b>: you send whatever you have, we handle the rest (modelling, material choice, print settings) and email a quote within one business day.</p><p><b>Instant quote</b>: for print-ready 3D files. You choose nozzle, layer height, infill and walls yourself, our slicer prices it in seconds, and you pay online. We still check every file before printing.</p>',
  },
  {
    id: 'charged',
    q: 'When is my card charged for an instant order?',
    a: '<p>At checkout your card is only <b>authorised</b> (held), not charged. A person checks your file and settings first. If it prints as submitted, we capture the payment and start printing. If it can’t be printed, we release the hold and you pay nothing. No refund process, no waiting.</p>',
  },
  {
    id: 'turnaround',
    q: 'How fast can you print?',
    a: '<p>Typical turnaround is 24–48 hours. Larger batches or very long prints take longer, and we’ll tell you upfront. Need it tomorrow? Choose <b>rush</b> on an instant quote, or mention your deadline in a request.</p>',
  },
  {
    id: 'cost',
    q: 'How much does 3D printing cost?',
    a: '<p>Price is based on material used and machine time, plus a small setup fee. Orders start at $20, which often covers several small parts. A palm-sized functional part in PLA or PETG is typically $15–40. Upload a file to the <a href="/instant-quote/">instant quote</a> for an exact price, or see <a href="/pricing/">how pricing works</a>.</p>',
  },
  {
    id: 'materials',
    q: 'Which material should I choose?',
    a: '<p>PLA for display models and prototypes, PETG for tough everyday parts, ASA for heat and sun (car interiors, outdoors), TPU for flexible parts, polycarbonate for maximum toughness, and PETG-CF for stiff, light parts. <a href="/materials/">Compare materials →</a> Not sure? Pick “recommend one” and we’ll advise.</p>',
  },
  {
    id: 'size',
    q: 'How big can you print?',
    a: '<p>Our large-format machines handle big parts in one piece. Anything bigger can be split into sections that join with pins, glue or screws, and we design the joints for you. Upload it and we’ll tell you the best way to print it.</p>',
  },
  {
    id: 'accuracy',
    q: 'How accurate are the parts?',
    a: '<p>Typically within ±0.2–0.3 mm on well-designed features. Holes and press-fits depend on material and orientation, so tell us any critical dimensions and we’ll tune for them. Layer heights go down to 0.06 mm with our 0.2 mm nozzle for very fine detail.</p>',
  },
  {
    id: 'delivery',
    q: 'Do you deliver?',
    a: '<p>Yes. Free pickup in Coogee, courier across Sydney metro, and Australia Post Express Australia-wide.</p>',
  },
  {
    id: 'confidential',
    q: 'Are my designs kept private?',
    a: '<p>Yes. Your files are stored privately, used only to make your parts, and never shared. Happy to sign an NDA for commercial work.</p>',
  },
  {
    id: 'resin',
    q: 'Do you do resin (SLA) or SLS printing?',
    a: '<p>We specialise in FDM printing in-house. For jobs that really need resin or nylon powder printing we can advise or arrange it through trusted partners.</p>',
  },
];
