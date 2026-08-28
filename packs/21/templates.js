// AMH "Framed Dark" — layout set v3. Same six layouts as v2; the only change is
// the meta photo flag: photo:'auto' means the layout shows a slide's own image
// (under a dark wash) when one exists, and its original background when not.
// The inverted accent layout stays photo:'no' — a photo would break its inversion.
//
// Engine-contract fields: name, swatch, frameBg, logoColor.
// Pack flags read by slideInner.js: bg, dominant, pos, align.

function buildTemplates(t){
  const mk=(name,swatch,over)=>Object.assign(
    {name,swatch,frameBg:t.INK,logoColor:'light',bg:'iso',dominant:'headline',pos:'low',align:'left'},over);
  return [
    // 1. The reference look: iso-dark (or slide photo), thin-caps headline, lower-left.
    mk('Framed authority',t.ACCENT,{
      meta:{bg:'iso-dark',dominant:'headline',inverts:'no',photo:'auto'}}),
    // 2. INVERTED: solid accent background, accentInk text + furniture, on-light logo.
    mk('Inverted accent','#FFFFFF',{bg:'accent',pos:'centre',align:'centre',logoColor:'dark',frameBg:t.ACCENT,
      meta:{bg:'solid-accent',dominant:'headline',inverts:'yes',photo:'no'}}),
    // 3. Quote: solid ink (or slide photo), oversized accent quote mark, italic quote.
    mk('Giant quote',t.INK,{bg:'ink',dominant:'quote',pos:'centre',
      meta:{bg:'solid-ink',dominant:'quote-mark',inverts:'no',photo:'auto'}}),
    // 4. Number: iso-dark (or slide photo), giant OUTLINED accent numeral, headline beneath.
    mk('Outlined number',t.ACCENT,{dominant:'number',pos:'top',
      meta:{bg:'iso-dark',dominant:'outlined-number',inverts:'no',photo:'auto'}}),
    // 5. Stat: panel-tone (or slide photo), one huge accent lead + small caption.
    mk('Stat lead','#FFFFFF',{bg:'panel',dominant:'stat',pos:'top',
      meta:{bg:'panel-gradient',dominant:'huge-stat',inverts:'no',photo:'auto'}}),
    // 6. Split band: dark/photo top 2/3 + solid accent band bottom 1/3 with the sub-line.
    mk('Split band',t.ACCENT,{bg:'split',dominant:'band',
      meta:{bg:'split-dark-accent',dominant:'accent-band',inverts:'partial',photo:'auto'}})
  ];
}

module.exports={ buildTemplates };
