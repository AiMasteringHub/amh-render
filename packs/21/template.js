// AMH "Framed Dark" — layout set v2, governed by Layout-variety-brief-GENERIC.md:
// no two layouts share the same BACKGROUND TYPE + DOMINANT ELEMENT combination.
// The family signature (inset frame, •••, circle-arrow, caps voice, accent
// discipline) is constant; the design underneath changes per layout.
//
// Rule 2 self-check — every layout declares meta:{bg,dominant,inverts,photo};
// the test suite enforces uniqueness of bg+dominant, and the universal preview
// tool prints this table.
//
// Engine-contract fields: name, swatch, frameBg, logoColor.
// Pack flags read by slideInner.js: bg, dominant, pos, align.

function buildTemplates(t){
  const mk=(name,swatch,over)=>Object.assign(
    {name,swatch,frameBg:t.INK,logoColor:'light',bg:'iso',dominant:'headline',pos:'low',align:'left'},over);
  return [
    // 1. The reference look: iso-dark bg, thin-caps headline dominant, lower-left.
    mk('Framed authority',t.ACCENT,{
      meta:{bg:'iso-dark',dominant:'headline',inverts:'no',photo:'no'}}),
    // 2. INVERTED: solid accent background, accentInk text + furniture, on-light logo.
    mk('Inverted accent','#FFFFFF',{bg:'accent',pos:'centre',align:'centre',logoColor:'dark',frameBg:t.ACCENT,
      meta:{bg:'solid-accent',dominant:'headline',inverts:'yes',photo:'no'}}),
    // 3. Quote: solid ink, oversized accent quote mark, ITALIC sentence-case quote.
    mk('Giant quote',t.INK,{bg:'ink',dominant:'quote',pos:'centre',
      meta:{bg:'solid-ink',dominant:'quote-mark',inverts:'no',photo:'no'}}),
    // 4. Number: iso-dark, giant OUTLINED accent numeral dominant, headline beneath.
    mk('Outlined number',t.ACCENT,{dominant:'number',pos:'top',
      meta:{bg:'iso-dark',dominant:'outlined-number',inverts:'no',photo:'no'}}),
    // 5. Stat: panel-tone background, one huge accent lead + small caption.
    mk('Stat lead','#FFFFFF',{bg:'panel',dominant:'stat',pos:'top',
      meta:{bg:'panel-gradient',dominant:'huge-stat',inverts:'no',photo:'no'}}),
    // 6. Split band: iso-dark top 2/3 + solid accent band bottom 1/3 carrying the sub-line.
    mk('Split band',t.ACCENT,{bg:'split',dominant:'band',
      meta:{bg:'split-dark-accent',dominant:'accent-band',inverts:'partial',photo:'no'}})
  ];
}

module.exports={ buildTemplates };
