// Signature Property Styling - layout set. Canvas 1080 x 1350.
// Style 10 descent (Elegant Serif Editorial) with photo integration.
// All colours from theme. No hardcoded brand values.
//
// v2: Serif Editorial and Editorial Quote now show the slide's own photo
// (under a cream-tinted wash) when one is set, instead of always being a
// plain cream card. Dark Inversion stays photo:'no' - a photo would fight
// its solid inverted block, the same reason Framed Dark's inverted layout
// never takes one.
//
// Engine-contract fields: name, swatch, frameBg, logoColor.
// Pack flags read by slideInner.js: bg, dominant

function buildTemplates(t) {
  const mk = (name, swatch, over) => Object.assign(
    { name, swatch, frameBg: t.DARK || '#272624', logoColor: 'dark',
      bg: 'cream', dominant: 'headline' }, over);
  return [
    mk('Serif Editorial', t.ACCENT, {
      meta: { bg: 'solid-cream', dominant: 'headline', inverts: 'no', photo: 'auto' } }),
    mk('Photo Panel', t.DARK, { bg: 'photo-panel', logoColor: 'light',
      meta: { bg: 'photo-cream-split', dominant: 'headline', inverts: 'no', photo: 'auto' } }),
    mk('Arch Frame', t.ACCENT, { bg: 'arch',
      meta: { bg: 'cream-arch', dominant: 'headline', inverts: 'no', photo: 'auto' } }),
    mk('Editorial Quote', t.SECONDARY || t.ACCENT, { dominant: 'quote',
      meta: { bg: 'solid-cream', dominant: 'quote-mark', inverts: 'no', photo: 'auto' } }),
    mk('Dark Inversion', '#FFFFFF', { bg: 'dark', logoColor: 'light', frameBg: t.ACCENT,
      meta: { bg: 'solid-dark', dominant: 'headline', inverts: 'yes', photo: 'no' } }),
    mk('Framed Photo', t.ACCENT, { bg: 'framed-photo', logoColor: 'light',
      meta: { bg: 'full-photo-inset', dominant: 'headline', inverts: 'no', photo: 'auto' } })
  ];
}
module.exports = { buildTemplates };
