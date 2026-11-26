/**
 * Text descriptions of the 10 original Rorschach plates (1921, public domain).
 * Gemini gets these as text instead of the images: it's cheaper and faster, and
 * it ties each answer to what is actually on the card.
 * If you swap in your own inkblots, update these descriptions to match.
 */
export const CARDS: { id: number; description: string; commonResponses: string }[] = [
  { id: 1, description: 'Black/grey achromatic blot, wide and winged, with small white gaps in the centre.', commonResponses: 'bat, butterfly, moth' },
  { id: 2, description: 'Black blot with red areas at the top and bottom; a large white space in the centre.', commonResponses: 'two animals (bears, dogs) facing each other' },
  { id: 3, description: 'Black and red; two figures facing each other, with separate red spots.', commonResponses: 'two humans bending over something' },
  { id: 4, description: 'Large, dark, heavily shaded black blot that looms toward the viewer, with a central lower part.', commonResponses: 'giant, monster, animal skin seen from below' },
  { id: 5, description: 'Compact black blot with spread wings and small protrusions at the top.', commonResponses: 'bat, butterfly' },
  { id: 6, description: 'Dark shaded blot with a distinctive textured surface and a narrow upper projection.', commonResponses: 'animal skin, pelt, rug' },
  { id: 7, description: 'Light grey blot forming a U shape around a large white space.', commonResponses: 'human heads or faces, often of women or children' },
  { id: 8, description: 'First fully coloured card: pink, orange, blue and grey; pink shapes on the sides.', commonResponses: 'animals (not cats or dogs) climbing on the sides' },
  { id: 9, description: 'Coloured blot in green, orange and pink, with diffuse and blended edges.', commonResponses: 'human figures (orange), less consistent than other cards' },
  { id: 10, description: 'Many separate coloured shapes (blue, yellow, pink, green, orange), scattered and busy.', commonResponses: 'crabs, lobsters, spiders, sea creatures' },
];
