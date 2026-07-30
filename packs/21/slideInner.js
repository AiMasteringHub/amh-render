// AMH "Framed Dark" — bespoke slide markup. v2, reworked to the Layout-variety brief
// (Layout-variety-brief-GENERIC.md): every layout differs on BACKGROUND TYPE +
// DOMINANT ELEMENT, not text position. The family signature stays constant across
// layouts (thin inset frame, ••• page mark, circle-arrow ↗ cue, caps type voice,
// accent discipline) — that is the brand; the design changes underneath it.
//
// Sources: AMH-Design-Extraction.md (Family C) + Layout-variety-brief-GENERIC.md.
//
// tpl flags this pack understands (set in templates.js):
//   bg:'iso'|'accent'|'ink'|'panel'|'split'   background type (Rule 1 axis 1)
//   dominant:'headline'|'quote'|'number'|'stat'|'band'   dominant element (axis 3)
//   pos:'low'|'top'|'centre'  align:'left'|'centre'      secondary variation only
// Every tpl also declares meta:{bg,dominant,inverts,photo} for the Rule 2 self-check.

function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function rgba(rgb,a){return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+a+')';}

function headlineSize(text,isCover,isPunch){
  const len=String(text||'').length;
  if(isPunch) return '78px';
  if(isCover) return len>70?'74px':'86px';
  if(len>150) return '54px';
  if(len>110) return '60px';
  return '68px';
}

// Faint isometric/tech raster over greenish-black — the reference background.
function isoBackground(theme,aRgb){
  return 'background:'
    +'repeating-linear-gradient(60deg, rgba(255,255,255,.022) 0 1px, transparent 1px 84px),'
    +'repeating-linear-gradient(-60deg, rgba(255,255,255,.022) 0 1px, transparent 1px 84px),'
    +'repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0 1px, transparent 1px 96px),'
    +'radial-gradient(120% 70% at 50% 115%, '+rgba(aRgb,.10)+' 0%, '+rgba(aRgb,0)+' 60%),'
    +'linear-gradient(180deg, '+theme.INK+' 0%, '+theme.DARK+' 55%, #0B1512 100%);';
}

function circleArrow(col,ink,filled){
  return '<div style="display:inline-flex;align-items:center;justify-content:center;width:96px;height:96px;'
    +'border-radius:50%;'+(filled?('background:'+col+';'):('border:2px solid '+col+';'))+'">'
    +'<span style="color:'+(filled?ink:col)+';font-size:44px;line-height:1;transform:translateY(-1px);">&#8599;</span></div>';
}

// First short chunk of a sentence for the stat/lead treatments.
function leadSplit(text){
  const words=String(text||'').trim().split(/\s+/);
  const cut=Math.min(5,Math.max(3,words.findIndex(w=>/[.,—]/.test(w))+1||5));
  return { lead:words.slice(0,cut).join(' '), rest:words.slice(cut).join(' ') };
}

function slideInner(s,i,post,tpl,n,opts,theme){
  const A=theme.ACCENT, AI=theme.ACCENT_INK, aRgb=theme.ACCENT_RGB;
  const isCover=i===0, isPunch=!s.main&&!!s.accent, isCta=!!s.cta, isLast=i===n-1;
  const isContent=!isCover&&!isPunch&&!isCta;
  const inverted=tpl.bg==='accent';

  // role colours flip on the inverted layout (Rule 1 axis 1: inverted block)
  const TXT=inverted?AI:'#FFFFFF';
  const ACC=inverted?AI:A;                        // furniture: frame/dots/arrow/subhead
  const SUB=inverted?rgba([0,0,0],.62):A;         // subhead
  const frameCol=inverted?rgba([0,0,0],.45):'rgba(255,255,255,.75)';

  // ----- background -----
  let bgCss='';
  if(tpl.bg==='iso') bgCss=isoBackground(theme,aRgb);
  else if(tpl.bg==='accent') bgCss='background:'+A+';';
  else if(tpl.bg==='ink') bgCss='background:'+theme.INK+';';
  else if(tpl.bg==='panel') bgCss='background:linear-gradient(180deg,'+theme.PANEL+' 0%,'+theme.DARK+' 100%);';
  let layers='';
  if(tpl.bg==='split'){
    layers+='<div style="position:absolute;left:0;right:0;top:0;height:66%;'+isoBackground(theme,aRgb)+'"></div>'
      +'<div style="position:absolute;left:0;right:0;top:66%;bottom:0;background:'+A+';"></div>';
  } else {
    layers+='<div style="position:absolute;inset:0;'+bgCss+'"></div>';
  }
  // the family frame — constant across every layout (the brand signature)
  layers+='<div style="position:absolute;inset:76px;border:2px solid '+frameCol+';border-radius:30px;"></div>';
  // ••• page mark (all non-cover slides)
  if(!isCover)
    layers+='<div style="position:absolute;top:118px;right:130px;color:'+ACC+';font-size:44px;letter-spacing:14px;line-height:1;">&bull;&bull;&bull;</div>';

  // logo — cover only, top-centre; variant picked by tpl.logoColor upstream
  const logoRow=(isCover&&opts.logoUrl)
    ? '<div style="text-align:center;margin-top:26px;"><img src="'+opts.logoUrl+'" alt="logo" style="height:120px;width:auto;"></div>'
    : '';

  // ----- the dominant element (Rule 1 axis 3) -----
  const caps='text-transform:uppercase;letter-spacing:.015em;';
  const italic=isContent?'font-style:italic;':'';
  const main=isPunch?s.accent:s.main;
  let block='';

  if(tpl.dominant==='quote'&&!isCover&&!isCta){
    // oversized accent quote mark + ITALIC SENTENCE-CASE quote (axis 5: case mix)
    block+='<div style="font-size:240px;line-height:.55;font-weight:700;color:'+ACC+';height:120px;">&ldquo;</div>'
      +'<p style="margin:0;font-weight:400;font-style:italic;line-height:1.35;color:'+TXT+';font-size:'+(String(main||'').length>150?'48px':'56px')+';">'+esc(main)+'</p>';
  } else if(tpl.dominant==='number'&&isContent){
    // giant OUTLINED number (stroke in accent), headline small beneath
    block+='<div style="font-size:330px;line-height:.8;font-weight:700;color:transparent;-webkit-text-stroke:3px '+ACC+';margin-bottom:44px;">'+String(i).padStart(2,'0')+'</div>'
      +'<p style="margin:0;font-weight:400;line-height:1.25;color:'+TXT+';'+caps+'font-size:46px;">'+esc(main)+'</p>';
  } else if(tpl.dominant==='stat'&&isContent){
    // one huge accent lead + small sentence-case caption (axis 3: statistic / axis 4: scale)
    const sp=leadSplit(main);
    block+='<p style="margin:0;font-weight:700;line-height:1.05;color:'+ACC+';'+caps+'font-size:110px;">'+esc(sp.lead)+'</p>'
      +(sp.rest?'<p style="margin:40px 0 0;font-weight:400;line-height:1.45;color:'+TXT+';font-size:38px;">'+esc(sp.rest)+'</p>':'');
  } else if(tpl.dominant==='band'&&tpl.bg==='split'){
    // split: caps headline in the dark 2/3; the accent band carries the sub-line
    block+='<p style="margin:0;font-weight:400;'+italic+'line-height:1.18;color:#FFFFFF;'+caps+'font-size:'+headlineSize(main,isCover,isPunch)+';">'+esc(main)+'</p>';
  } else {
    // headline-dominant (the reference look; covers/CTAs of every layout land here too)
    block+='<p style="margin:0;font-weight:400;'+italic+'line-height:1.18;color:'+TXT+';'+caps+'font-size:'+headlineSize(main,isCover,isPunch)+';">'+esc(main)+'</p>';
    if(!isPunch&&s.accent&&tpl.bg!=='split')
      block+='<p style="margin:36px 0 0;font-weight:400;line-height:1.35;color:'+SUB+';font-size:40px;">'+esc(s.accent)+'</p>';
    if(isContent)
      block+='<div style="width:150px;height:4px;background:'+ACC+';margin:46px '+(tpl.align==='centre'?'auto':'0')+' 0;"></div>';
  }
  if(isCta&&s.cta)
    block+='<p style="margin:36px 0 0;font-weight:700;color:'+(inverted?AI:A)+';'+caps+'font-size:44px;">'+esc(s.cta)+'</p>';

  // ----- placement (secondary variation only) -----
  const justify=isPunch?'center':(tpl.pos==='top'?'flex-start':(tpl.pos==='centre'?'center':'flex-end'));
  const alignTxt=(isPunch||tpl.align==='centre')?'center':'left';
  const padTop=tpl.pos==='top'?(isCover?'60px':'150px'):'0';
  const padBot=(tpl.pos==='low'&&tpl.bg!=='split')?'120px':'0';

  // split band content: the sub-line lives ON the band, in accentInk
  let bandRow='';
  if(tpl.bg==='split'){
    // the band always carries something: the sub-line, the CTA, or the post tag as a label
    const bandTxt=s.accent||s.cta||post.tag||'';
    const isLabel=!s.accent&&!s.cta;
    bandRow='<div style="position:absolute;left:0;right:0;top:66%;bottom:0;display:flex;align-items:center;justify-content:center;padding:0 170px;">'
      +'<p style="margin:0;font-weight:700;line-height:1.3;color:'+AI+';text-align:center;'
      +(isLabel?'font-size:32px;text-transform:uppercase;letter-spacing:.22em;':'font-size:40px;')
      +'">'+esc(bandTxt)+'</p></div>';
  }

  // circle-arrow ↗ — constant cue; filled on the last slide; ink-coloured on the band/inverted
  const arrowOnAccent=inverted||tpl.bg==='split';
  const arrow='<div style="position:absolute;right:130px;bottom:120px;">'
    +circleArrow(arrowOnAccent?AI:A, arrowOnAccent?A:theme.INK, isLast)+'</div>';

  const contentBottom=tpl.bg==='split'?'calc(34% + 40px)':'76px';
  return layers
    +'<div style="position:absolute;left:76px;right:76px;top:76px;bottom:'+contentBottom+';padding:78px 96px;display:flex;flex-direction:column;">'
    +logoRow
    +'<div style="flex:1;display:flex;flex-direction:column;justify-content:'+justify+';text-align:'+alignTxt+';padding-top:'+padTop+';padding-bottom:'+padBot+';">'
    +'<div style="max-width:'+(alignTxt==='center'?'100%':'800px')+';'+(alignTxt==='center'?'margin:0 auto;':'')+'">'+block+'</div>'
    +'</div></div>'
    +bandRow
    +arrow;
}

module.exports={ slideInner };
