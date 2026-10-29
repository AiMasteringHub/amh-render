const fs=require('fs');
const path=require('path');
const { makeTheme } = require('./brand');
const { slideDocument, defaultSlideInner } = require('./vocabulary');
const { templateForPost } = require('./pack');


// --- Optimisation 1: cache base64-encoded images per render run ---
const _imgCache = new Map();
function toEmbeddable(p){
  if(!p) return null;
  if(/^(https?:|data:)/i.test(p)) return p;
  if(_imgCache.has(p)) return _imgCache.get(p);
  const buf=fs.readFileSync(p);
  const ext=(path.extname(p).slice(1)||'png').toLowerCase();
  const mime=ext==='svg'?'image/svg+xml':('image/'+(ext==='jpg'?'jpeg':ext));
  const uri='data:'+mime+';base64,'+buf.toString('base64');
  _imgCache.set(p, uri);
  return uri;
}
function clearImageCache(){ _imgCache.clear(); }

function canvasOf(pack, post, opts = {}){
  const c = (pack && pack.canvas) || {};
  const width =
    Number(opts.width) ||
    Number(post && post.width);
  const height =
    Number(opts.height) ||
    Number(post && post.height);
  if (width > 0 && height > 0) {
    return { w: width, h: height };
  }
  if (
    post &&
    String(post.platform || '').toLowerCase() === 'facebook'
  ) {
    return { w: 1080, h: 1080 };
  }
  return {
    w: Number(c.w) || 1080,
    h: Number(c.h) || 1350
  };
}

function pick(){ for(const v of arguments){ if(v!=null && v!=='') return v; } return null; }
function hexOf(v){ if(!v) return null; if(typeof v==='object') v=v.hex; return (typeof v==='string' && /^#?[0-9a-f]{3,6}$/i.test(v)) ? (v[0]==='#'?v:'#'+v) : null; }
function extendTheme(theme, brand){
  brand = brand || {};
  const name = pick(brand.name, brand.businessName, brand.company, '');
  const web  = String(pick(brand.footer, brand.website, brand.url, brand.domain, '')).replace(/^https?:\/\//i,'').replace(/\/$/,'');
  const fam  = brand.font && brand.font.family;
  return Object.assign({}, theme, {
    SECONDARY: pick(theme.SECONDARY, hexOf(brand.secondary), theme.ACCENT),
    NAME:      pick(theme.NAME, name),
    FOOTER:    pick(theme.FOOTER, web, name),
    FONT:      pick(theme.FONT, fam ? ("'"+String(fam).replace(/'/g,'')+"','Manrope','Helvetica Neue',Arial,sans-serif") : null)
  });
}

function buildSlideHtml(post, i, opts){
  const pack = opts.pack;
  const brand = pack.brand;
  const theme = extendTheme(makeTheme(brand), brand);
  const TEMPLATES = pack.buildTemplates(theme);
  const slideInner = pack.slideInner || defaultSlideInner;
  const canvas = canvasOf(pack, post, opts);

  let templateIndex = (opts.templateIndex!=null) ? opts.templateIndex
                        : templateForPost(opts.postIndex||0, TEMPLATES.length);
  templateIndex = ((Number(templateIndex) % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  const tpl = TEMPLATES[templateIndex];

  if(!tpl) throw new Error('templateIndex '+templateIndex+' out of range for this pack ('+TEMPLATES.length+' layouts)');
  const slide = post.slides[i] || {};
  const imageUrl = toEmbeddable(slide.imageUrl || opts.imageUrl || post.imageUrl || null);
  const wantLight = tpl.logoColor==='dark';
  const logoRaw = wantLight ? (brand.logoOnLight || brand.logoOnDark)
                            : (brand.logoOnDark  || brand.logoOnLight);
  const logoUrl = toEmbeddable(logoRaw);
  const html = slideDocument(slide, i, post, tpl, post.slides.length,
    { imageUrl, logoUrl, brand, theme, slideInner, canvas });
  return { html, template: tpl.name, canvas };
}

function withDeadline(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' timed out after '+ms+'ms')), ms))
  ]);
}

// --- Optimisation 2: fontReady flag skips font loading after the first slide per page ---
// --- Optimisation 3: domcontentloaded instead of networkidle0 ---
// --- Optimisation 4: JPEG at quality 92 instead of PNG ---
async function renderOne(page, post, i, opts, fam, fontReady){
  const { html, template, canvas } = buildSlideHtml(post, i, opts);
  await withDeadline(page.setContent(html, { waitUntil:'domcontentloaded' }), 20000, 'setContent');
  if(!fontReady){
    try{
      await withDeadline(page.evaluateHandle('document.fonts.ready'), 10000, 'fonts.ready');
      await withDeadline(page.evaluate(f=>document.fonts.load('700 100px "'+f+'"'), fam), 10000, 'fonts.load');
    }catch(e){}
  }
  const buffer = await withDeadline(
    page.screenshot({ type:'jpeg', quality:92, clip:{x:0,y:0,width:canvas.w,height:canvas.h} }),
    20000, 'screenshot'
  );
  return { index:i+1, buffer, template };
}

async function renderSlides(post, opts={}){
  if(!opts.pack) throw new Error('renderSlides requires opts.pack (loaded design pack)');
  const browser = opts.browser || await require('puppeteer').launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox','--font-render-hinting=none']
  });
  const n   = post.slides.length;
  const fam = (opts.pack.brand.font && opts.pack.brand.font.family) || 'Manrope';
  const canvas = canvasOf(opts.pack, post, opts);
  const out = new Array(n);
  const poolSize = Math.min(
    Math.max(1, Number(opts.concurrency || process.env.RENDER_CONCURRENCY || 4)),
    n
  );
  let next = 0;
  async function openPage(){
    const page = await browser.newPage();
    await page.setViewport({ width:canvas.w, height:canvas.h, deviceScaleFactor:1 });
    return page;
  }
  function discardPage(page){
    Promise.race([
      page.close().catch(()=>{}),
      new Promise(res=>setTimeout(res, 3000))
    ]).catch(()=>{});
  }
  async function worker(){
    let page = await openPage();
    let fontReady = false;
    try{
      while(true){
        const i = next++;
        if(i >= n) break;
        try{
          out[i] = await renderOne(page, post, i, opts, fam, fontReady);
          fontReady = true;
        }catch(e){
          console.error('slide', i, 'failed, retrying on a fresh page:', e.message||e);
          discardPage(page);
          page = await openPage();
          fontReady = false;
          out[i] = await renderOne(page, post, i, opts, fam, fontReady);
          fontReady = true;
        }
      }
    } finally {
      discardPage(page);
    }
  }
  try{
    const workers = [];
    for(let w=0; w<poolSize; w++) workers.push(worker());
    await Promise.all(workers);
    return out;
  } finally {
    clearImageCache();
    if(!opts.browser) await browser.close();
  }
}

module.exports={ renderSlides, buildSlideHtml, toEmbeddable };
