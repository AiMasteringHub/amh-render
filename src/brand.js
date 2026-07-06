// Brand tokens: the contract, sane defaults, and theme derivation.
// One place that owns how a stored brand kit becomes a complete, safe `brand`,
// and how a `brand` becomes the concrete colour/gradient strings templates read.
// Nothing else in the engine should know how a colour becomes a gradient.

function rgba(rgb, a){ return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+a+')'; }

function hexToRgb(hex){
  let h=(hex||'').replace('#','').trim();
  if(h.length===3) h=h.split('').map(c=>c+c).join('');
  if(!/^[0-9a-fA-F]{6}$/.test(h)) return [0,0,0];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}

// Pick black or white text for best contrast on a given hex (fallback for accentInk).
function contrastInk(hex){
  const [r,g,b]=hexToRgb(hex); const L=(0.299*r+0.587*g+0.114*b)/255;
  return L>0.6 ? '#0C1316' : '#FFFFFF';
}

// Lighten a hex by mixing toward white by amount 0..1 (used to spread flat depth tones).
function lighten(hex, amt){
  const [r,g,b]=hexToRgb(hex);
  const m=v=>Math.round(v+(255-v)*amt);
  return '#'+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function colour(raw, fallbackHex){
  raw = raw || {};
  const hex = raw.hex || fallbackHex;
  return { hex, rgb: raw.rgb || hexToRgb(hex), ink: raw.ink };
}

// Take whatever the dashboard stored and return a COMPLETE, valid brand.
// Every missing field gets a sensible default so a half-filled kit never crashes a render.
function normaliseBrand(raw){
  raw = raw || {};
  const c = raw.colours || {};
  const accent = colour(c.accent, '#44F29F');
  accent.ink = accent.ink || contrastInk(accent.hex);
  const secondary = colour(c.secondary, '#3396AF');
  const white = colour(c.white, '#FFFFFF');
  let ink   = colour(c.ink,   '#0C1316');
  let dark  = colour(c.dark,  '#0F1619');
  let panel = colour(c.panel, '#1A2429');

  // Three depth tones must be distinct or cards go flat — spread them from ink if not.
  const flat = new Set([ink.hex.toLowerCase(), dark.hex.toLowerCase(), panel.hex.toLowerCase()]).size < 3;
  if(flat){
    dark  = colour({ hex: lighten(ink.hex, 0.06) });
    panel = colour({ hex: lighten(ink.hex, 0.14) });
  }

  const font = raw.font || {};
  return {
    name: raw.name || 'Brand',
    footer: raw.footer || '',
    font: {
      family: font.family || 'Manrope',
      url: font.url ||
        'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap',
      weights: font.weights || [400,600,700,800],
      embedded: !!font.embedded || /^data:text\/css/.test(font.url || '')
    },
    logoOnDark:  raw.logoOnDark  || raw.logoWhite || raw.logo || null,
    logoOnLight: raw.logoOnLight || raw.logoDark  || raw.logoOnDark || raw.logoWhite || raw.logo || null,
    logos: raw.logos || [],
    colours: { accent, secondary, white, ink, dark, panel },
    designNotes: raw.designNotes || '',
    references: raw.references || [],
    fontFallbackUsed: false
  };
}

// Turn a brand into all the concrete colour + gradient strings the templates need.
// Replaces the module-level constants and gradient literals in the old templates.js.
function makeTheme(brand){
  const A=brand.colours.accent, INK=brand.colours.ink, DK=brand.colours.dark,
        PN=brand.colours.panel, W=brand.colours.white.hex;
  return {
    ACCENT:A.hex, ACCENT_RGB:A.rgb, ACCENT_INK:A.ink,
    SECONDARY:brand.colours.secondary.hex,
    WHITE:W, INK:INK.hex, DARK:DK.hex, PANEL:PN.hex,
    frameBgDefault:PN.hex,                      // was '#131B1E'
    // gradients, built from the client's dark tones instead of AMH literals:
    PHOTO:'radial-gradient(120% 90% at 30% 22%, '+rgba(DK.rgb,1)+' 0%, '+rgba(INK.rgb,.25)+' 55%), linear-gradient(135deg,'+rgba(DK.rgb,1)+' 0%,'+rgba(INK.rgb,1)+' 72%)',
    vGrad:'linear-gradient(180deg, '+rgba(DK.rgb,.30)+' 0%, '+rgba(DK.rgb,.50)+' 42%, '+rgba(INK.rgb,.94)+' 100%)',
    topGrad:'linear-gradient(180deg, '+rgba(INK.rgb,.92)+' 0%, '+rgba(DK.rgb,.45)+' 40%, '+rgba(DK.rgb,.20)+' 100%)',
    evenWash:'linear-gradient(180deg, '+rgba(INK.rgb,.62)+' 0%, '+rgba(INK.rgb,.66)+' 100%)',
    splitGrad:'linear-gradient(180deg, '+rgba(DK.rgb,.15)+' 0%, '+rgba(DK.rgb,.20)+' 44%, '+DK.hex+' 52%, '+DK.hex+' 100%)',
    spotGrad:'radial-gradient(ellipse 78% 56% at 50% 40%, '+rgba(INK.rgb,.05)+' 0%, '+rgba(INK.rgb,.52)+' 58%, '+rgba(INK.rgb,.97)+' 100%)',
    glassGrad:'linear-gradient(180deg, '+rgba(INK.rgb,.20)+' 0%, '+rgba(INK.rgb,.55)+' 100%)',
    panelGlass:rgba(PN.rgb,.66),                // raised glass panel tint, from the brand's panel tone
    glowStrong:rgba(A.rgb,.18), glowFade:rgba(A.rgb,0), sheetHandle:rgba(A.rgb,.65)
  };
}

module.exports={ normaliseBrand, makeTheme, contrastInk, hexToRgb, lighten, rgba };
