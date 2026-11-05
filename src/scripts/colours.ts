/** Filament colour swatches (kept separate so pages can use them without loading three.js). */
export const COLOURS: Record<string, number> = {
  Black: 0x2a2d33, White: 0xf2f2f0, Grey: 0x8a9099, Red: 0xd2302c, Blue: 0x2f6fde, Green: 0x2e9e5b, Yellow: 0xf2c230,
  Orange: 0xf07a22, 'Silk Gold': 0xd4a640, Clear: 0xcfe3ef,
};
export const colourHex = (name: string) => '#' + (COLOURS[name] ?? 0x3b82f6).toString(16).padStart(6, '0');
