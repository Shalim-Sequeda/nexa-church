export interface BackgroundPreset {
  id: string;
  category: 'bible' | 'worship' | 'landscapes' | 'church' | 'skies';
  name: string;
  path: string;
}

export const BACKGROUND_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'bible', label: 'Biblias' },
  { id: 'worship', label: 'Adoración' },
  { id: 'church', label: 'Santuario' },
  { id: 'landscapes', label: 'Paisajes' },
  { id: 'skies', label: 'Cielos' },
] as const;

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Biblias
  { id: 'b1', category: 'bible', name: 'Biblia 1', path: '/backgrounds/bible/b1.png' },
  { id: 'b2', category: 'bible', name: 'Biblia 2', path: '/backgrounds/bible/b2.png' },
  { id: 'b3', category: 'bible', name: 'Biblia 3', path: '/backgrounds/bible/b3.png' },
  { id: 'b4', category: 'bible', name: 'Biblia 4', path: '/backgrounds/bible/b4.png' },
  { id: 'b5', category: 'bible', name: 'Biblia 5', path: '/backgrounds/bible/b5.png' },
  { id: 'b6', category: 'bible', name: 'Biblia 6', path: '/backgrounds/bible/b6.png' },
  { id: 'b7', category: 'bible', name: 'Biblia 7', path: '/backgrounds/bible/b7.png' },
  { id: 'b8', category: 'bible', name: 'Biblia 8', path: '/backgrounds/bible/b8.png' },
  { id: 'b9', category: 'bible', name: 'Biblia 9', path: '/backgrounds/bible/b9.png' },
  { id: 'b10', category: 'bible', name: 'Biblia 10', path: '/backgrounds/bible/b10.png' },

  // Santuario e Iglesia
  { id: 'c1', category: 'church', name: 'Santuario 1', path: '/backgrounds/church/c1.png' },
  { id: 'c2', category: 'church', name: 'Santuario 2', path: '/backgrounds/church/c2.png' },
  { id: 'c3', category: 'church', name: 'Santuario 3', path: '/backgrounds/church/c3.png' },
  { id: 'c4', category: 'church', name: 'Santuario 4', path: '/backgrounds/church/c4.png' },
  { id: 'c5', category: 'church', name: 'Santuario 5', path: '/backgrounds/church/c5.png' },
  { id: 'c6', category: 'church', name: 'Santuario 6', path: '/backgrounds/church/c6.png' },
  { id: 'c7', category: 'church', name: 'Santuario 7', path: '/backgrounds/church/c7.png' },
  { id: 'c8', category: 'church', name: 'Santuario 8', path: '/backgrounds/church/c8.png' },
  { id: 'c9', category: 'church', name: 'Santuario 9', path: '/backgrounds/church/c9.png' },
  { id: 'c10', category: 'church', name: 'Santuario 10', path: '/backgrounds/church/c10.png' },

  // Adoración y Música
  { id: 'w1', category: 'worship', name: 'Adoración 1', path: '/backgrounds/worship/w1.png' },
  { id: 'w2', category: 'worship', name: 'Adoración 2', path: '/backgrounds/worship/w2.png' },
  { id: 'w3', category: 'worship', name: 'Adoración 3', path: '/backgrounds/worship/w3.png' },
  { id: 'w4', category: 'worship', name: 'Adoración 4', path: '/backgrounds/worship/w4.png' },
  { id: 'w5', category: 'worship', name: 'Adoración 5', path: '/backgrounds/worship/w5.png' },
  { id: 'w6', category: 'worship', name: 'Adoración 6', path: '/backgrounds/worship/w6.png' },
  { id: 'w7', category: 'worship', name: 'Adoración 7', path: '/backgrounds/worship/w7.png' },
  { id: 'w8', category: 'worship', name: 'Adoración 8', path: '/backgrounds/worship/w8.png' },
  { id: 'w9', category: 'worship', name: 'Adoración 9', path: '/backgrounds/worship/w9.png' },
  { id: 'w10', category: 'worship', name: 'Adoración 10', path: '/backgrounds/worship/w10.png' },

  // Paisajes y Creación
  { id: 'l1', category: 'landscapes', name: 'Paisaje 1', path: '/backgrounds/landscapes/l1.png' },
  { id: 'l2', category: 'landscapes', name: 'Paisaje 2', path: '/backgrounds/landscapes/l2.png' },
  { id: 'l3', category: 'landscapes', name: 'Paisaje 3', path: '/backgrounds/landscapes/l3.png' },
  { id: 'l4', category: 'landscapes', name: 'Paisaje 4', path: '/backgrounds/landscapes/l4.png' },
  { id: 'l5', category: 'landscapes', name: 'Paisaje 5', path: '/backgrounds/landscapes/l5.png' },
  { id: 'l6', category: 'landscapes', name: 'Paisaje 6', path: '/backgrounds/landscapes/l6.png' },
  { id: 'l7', category: 'landscapes', name: 'Paisaje 7', path: '/backgrounds/landscapes/l7.png' },
  { id: 'l8', category: 'landscapes', name: 'Paisaje 8', path: '/backgrounds/landscapes/l8.png' },
  { id: 'l9', category: 'landscapes', name: 'Paisaje 9', path: '/backgrounds/landscapes/l9.png' },
  { id: 'l10', category: 'landscapes', name: 'Paisaje 10', path: '/backgrounds/landscapes/l10.png' },

  // Cielos y Atmósfera
  { id: 's1', category: 'skies', name: 'Cielo 1', path: '/backgrounds/skies/s1.png' },
  { id: 's2', category: 'skies', name: 'Cielo 2', path: '/backgrounds/skies/s2.png' },
  { id: 's3', category: 'skies', name: 'Cielo 3', path: '/backgrounds/skies/s3.png' },
  { id: 's4', category: 'skies', name: 'Cielo 4', path: '/backgrounds/skies/s4.png' },
  { id: 's5', category: 'skies', name: 'Cielo 5', path: '/backgrounds/skies/s5.png' },
  { id: 's6', category: 'skies', name: 'Cielo 6', path: '/backgrounds/skies/s6.png' },
  { id: 's7', category: 'skies', name: 'Cielo 7', path: '/backgrounds/skies/s7.png' },
  { id: 's8', category: 'skies', name: 'Cielo 8', path: '/backgrounds/skies/s8.png' },
  { id: 's9', category: 'skies', name: 'Cielo 9', path: '/backgrounds/skies/s9.png' },
  { id: 's10', category: 'skies', name: 'Cielo 10', path: '/backgrounds/skies/s10.png' },
];
