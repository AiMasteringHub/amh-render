// Shared render vocabulary (was slideInner/logoMarkup/slideDocument in templates.js).
// The generic capabilities a layout can use — photo, overlay, glow, panel, spine,
// index number, quote mark, eyebrow, footer, chevron, logo slot — with every brand
// literal parameterised through `theme`/`brand`. This is the DEFAULT markup a
// configured pack uses. A bespoke pack ships its own slideInner and ignores this.

function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function sizeFor(s,isCover,isPunch,isCta){
  if(isPunch)return '62px';
  if(isCta)return '54px';
  if(isCover)return (s.main||'').length>70?'58px':'70px';
  const len=(s.main||'').length;
  if(len>150)return '42px';
  if(len>110)return '46px';
  return '52px';
}

// No-logo fallback: a neutral wordmark from brand.name (not AMH's "omh").
// Text colour is brand-driven: on a light/accent background (color==='dark') use the
// brand's ink; on a dark background use the brand's white. No AMH literal.
function logoMarkup(color, logoUrl, brand){
  if(logoUrl){
    // A real, correctly-coloured logo variant is chosen upstream (renderer picks
    // logoOnDark / logoOnLight). No colour filter applied to a real logo.
    return '<img src="'+logoUrl+'" alt="logo" style="height:130px;width:auto;display:block;margin:0 auto;">';
  }
  const cols = (brand && brand.colours) || {};
  const c = color==='dark'
    ? ((cols.ink && cols.ink.hex) || '#0C1316')
    : ((cols.white && cols.white.hex) || '#FFFFFF');
  const name = (brand && brand.name) || 'Brand';
  return '<div style="text-align:center;line-height:1;">'
    +'<div style="font-size:56px;font-weight:800;letter-spacing:-2px;color:'+c+';">'+esc(name)+'</div></div>';
}

function photoBackground(imageUrl, theme){
  return imageUrl ? ("center/cover no-repeat url('"+imageUrl+"')") : theme.PHOTO;
}

// Build the inner markup of one slide (assumes a 1080x1920 frame).
// opts = { imageUrl, logoUrl, brand }, theme = makeTheme(brand)
function defaultSlideInner(s,i,post,tpl,n,opts,theme){
  const imageUrl=opts.imageUrl, logoUrl=opts.logoUrl, brand=opts.brand;
  const isCover=i===0, isPunch=!s.main&&!!s.accent, isCta=!!s.cta, isLast=i===n-1;
  const A=theme.ACCENT;
  let layers='';
  if(tpl.showPhoto){
    const bg=photoBackground(imageUrl, theme);
    if(tpl.photoMode==='framed'){
      layers+='<div style="position:absolute;left:88px;top:200px;width:904px;height:780px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(0,0,0,.5);background:'+bg+';"></div>';
    } else {
      layers+='<div style="position:absolute;inset:0;background:'+bg+';"></div>';
    }
  }
  if(tpl.showOverlay) layers+='<div style="position:absolute;inset:0;background:'+tpl.overlay+';"></div>';
  if(tpl.showGlow) layers+='<div style="position:absolute;left:-200px;bottom:-220px;width:820px;height:820px;border-radius:50%;background:radial-gradient(circle, '+theme.glowStrong+' 0%, '+theme.glowFade+' 70%);"></div>';
  if(tpl.showSheet){
    layers+='<div style="position:absolute;left:0;right:0;bottom:0;height:1080px;background:'+theme.DARK+';border-top:1px solid rgba(255,255,255,.10);border-radius:60px 60px 0 0;box-shadow:0 -34px 70px rgba(0,0,0,.45);"></div>';
    layers+='<div style="position:absolute;left:50%;bottom:1044px;transform:translateX(-50%);width:120px;height:7px;border-radius:999px;background:'+theme.sheetHandle+';"></div>';
  }
  if(tpl.showSpine){
    layers+='<div style="position:absolute;left:70px;top:300px;bottom:230px;width:4px;border-radius:2px;background:'+A+';"></div>';
    layers+='<div style="position:absolute;left:40px;top:300px;writing-mode:vertical-rl;color:'+A+';font-size:24px;letter-spacing:.3em;text-transform:uppercase;font-weight:600;">'+esc(post.tag)+'</div>';
  }
  let inner='';
  if(tpl.showIndex&&!isPunch) inner+='<div style="font-size:200px;line-height:.8;font-weight:700;color:transparent;-webkit-text-stroke:2px '+A+';margin-bottom:6px;">'+String(i+1).padStart(2,'0')+'</div>';
  if(tpl.showEyebrow&&!isPunch) inner+='<div style="font-size:26px;letter-spacing:.2em;text-transform:uppercase;font-weight:600;color:'+A+';margin-bottom:28px;">'+esc(post.tag)+'  &middot;  '+String(i+1).padStart(2,'0')+'</div>';
  if(tpl.showQuote) inner+='<div style="font-size:160px;line-height:.7;font-weight:700;color:'+A+';height:90px;overflow:visible;">&ldquo;</div>';
  if(s.main) inner+='<p style="margin:0;font-weight:700;line-height:1.12;letter-spacing:-.01em;color:'+tpl.mainColor+';font-size:'+sizeFor(s,isCover,isPunch,isCta)+';">'+esc(s.main)+'</p>';
  if(s.accent) inner+='<p style="margin:24px 0 0;font-weight:700;line-height:1.12;letter-spacing:-.01em;color:'+tpl.accentColor+';font-size:'+(isPunch?'62px':(isCover?'46px':'40px'))+';">'+esc(s.accent)+'</p>';
  if(isCta) inner+='<div style="margin-top:40px;display:inline-flex;align-items:center;gap:12px;background:'+tpl.ctaBg+';color:'+tpl.ctaColor+';padding:22px 40px;border-radius:999px;font-size:34px;font-weight:700;">&#8595;  '+esc(s.cta)+'</div>';
  const panelStyle=tpl.panelStyle?tpl.panelStyle:(tpl.panel?'background:'+theme.panelGlass+';backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.10);border-radius:28px;padding:56px 52px;':'');
  const footerTxt = (brand && brand.footer) ? brand.footer : '';
  const footer = footerTxt
    ? '<span style="color:'+tpl.footerColor+';font-size:30px;letter-spacing:.04em;">'+esc(footerTxt)+'</span>'
    : '';
  const content='<div style="position:absolute;inset:0;padding:96px 88px 92px;display:flex;flex-direction:column;">'
    +'<div style="margin:0 auto;">'+logoMarkup(tpl.logoColor,logoUrl,brand)+'</div>'
    +'<div style="flex:1;display:flex;flex-direction:column;justify-content:'+tpl.justify+';padding:40px 0;text-align:'+tpl.align+';">'
    +'<div style="width:100%;'+panelStyle+'">'+inner+'</div></div>'
    +'<div style="position:relative;display:flex;align-items:center;justify-content:center;">'+footer
    +(!isLast?'<span style="position:absolute;right:0;color:'+tpl.chevronColor+';font-size:56px;font-weight:700;line-height:1;">&rsaquo;</span>':'')
    +'</div></div>';
  return layers+content;
}

// Full single-slide HTML document, exactly 1080x1920, ready to screenshot.
// opts = { imageUrl, logoUrl, brand, theme, slideInner? }
function slideDocument(s,i,post,tpl,n,opts){
  opts=opts||{};
  const brand=opts.brand, theme=opts.theme;
  const slideInner = opts.slideInner || defaultSlideInner;   // pack's markup or shared default
  const family = (brand && brand.font && brand.font.family) || 'Manrope';
  const fontUrl = (brand && brand.font && brand.font.url) ||
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap';
  return '<!doctype html><html><head><meta charset="utf-8">'
    +'<link href="'+fontUrl+'" rel="stylesheet">'
    +'<style>*{box-sizing:border-box;}html,body{margin:0;padding:0;}'
    +"body{width:1080px;height:1920px;font-family:'"+family+"','Manrope','Helvetica Neue',Arial,sans-serif;}"
    +'.slide{position:relative;width:1080px;height:1920px;overflow:hidden;background:'+tpl.frameBg+';}</style></head>'
    +'<body><div class="slide">'+slideInner(s,i,post,tpl,n,opts,theme)+'</div></body></html>';
}

module.exports={ defaultSlideInner, slideDocument, logoMarkup, photoBackground, sizeFor, esc };
