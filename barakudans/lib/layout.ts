import type { Layout } from './types';

/**
 * Podrazumevani raspored lokala (koristi se dok admin ne sačuva svoj).
 * Koordinate su u prostoru 800 × 560. Pravi raspored se menja u admin panelu
 * ("Raspored") i čuva u bazi – ovde ga NE treba menjati.
 */
export const defaultLayout: Layout = {
  width: 800,
  height: 560,
  fixtures: [
    { id: 'bar', label: 'ŠANK', x: 40, y: 36, w: 380, h: 46 },
    { id: 'dj', label: 'DJ', x: 560, y: 36, w: 200, h: 56 },
    { id: 'door', label: 'ULAZ', x: 340, y: 520, w: 120, h: 28 },
    { id: 'wc', label: 'WC', x: 700, y: 500, w: 60, h: 40 },
  ],
  tables: [
    { id: 't1', label: '1', x: 50, y: 120, w: 58, h: 58, shape: 'round', seats: 2, zone: 'Uz šank' },
    { id: 't2', label: '2', x: 150, y: 120, w: 58, h: 58, shape: 'round', seats: 2, zone: 'Uz šank' },
    { id: 't3', label: '3', x: 250, y: 120, w: 58, h: 58, shape: 'round', seats: 2, zone: 'Uz šank' },
    { id: 't4', label: '4', x: 350, y: 120, w: 58, h: 58, shape: 'round', seats: 2, zone: 'Uz šank' },
    { id: 't5', label: '5', x: 40, y: 240, w: 96, h: 60, shape: 'rect', seats: 4, zone: 'Sala' },
    { id: 't6', label: '6', x: 190, y: 240, w: 96, h: 60, shape: 'rect', seats: 4, zone: 'Sala' },
    { id: 't7', label: '7', x: 340, y: 240, w: 96, h: 60, shape: 'rect', seats: 4, zone: 'Sala' },
    { id: 't8', label: '8', x: 480, y: 232, w: 76, h: 76, shape: 'round', seats: 4, zone: 'Sala' },
    { id: 'v1', label: 'V1', x: 590, y: 140, w: 150, h: 66, shape: 'rect', seats: 8, zone: 'VIP uz DJ' },
    { id: 'v2', label: 'V2', x: 610, y: 260, w: 130, h: 62, shape: 'rect', seats: 6, zone: 'VIP uz DJ' },
    { id: 't9', label: '9', x: 70, y: 380, w: 88, h: 88, shape: 'round', seats: 6, zone: 'Zadnja sala' },
    { id: 't10', label: '10', x: 220, y: 380, w: 88, h: 88, shape: 'round', seats: 6, zone: 'Zadnja sala' },
    { id: 't11', label: '11', x: 390, y: 392, w: 170, h: 66, shape: 'rect', seats: 10, zone: 'Zadnja sala' },
  ],
};
