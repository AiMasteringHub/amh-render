const fs=require('fs');
const path=require('path');
const { makeTheme } = require('./brand');
const { slideDocument, defaultSlideInner } = require('./vocabulary');
const { templateForPost } = require('./pack');

function toEmbeddable(p){
  if(!p) return null;
  if(/^(https?:|data:)/i.test(p)) return p;
  const buf=fs.readFileSync(p);
  const ext=(path.extname(p).slice(1)||'png').toLowerCase();
  const mime=ext==='svg'?'image/svg+xml':('image/'+(ext==='jpg'?'jpeg':ext));
  return 'data:'+mime+';base64,'+buf.toString('base64');
}

function buildSlideHtml(post, i, opts){
  const pack = opts.pack;
  const brand = pack.brand;
  const theme = makeTheme(brand);
  const TEMPLATES = pack.buildTemplates(theme);
  const slideInner = pack.slideInner || defaultSlideInner;
  
  let templateIndex = (opts.templateIndex!=null) ? opts.templateIndex
                        : templateForPost(opts.postIndex||0, TEMPLATES.length);
  // bound any stored index into this pack's layout count
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
    { imageUrl, logoUrl, brand, theme, slideInner });
  return { html, template: tpl.name };
}

// Wrap an op with its own deadline — a stuck compositor/GPU handoff otherwise
// hangs until protocolTimeout (5 min) with the browser sitting at 0% CPU, doing
// nothing but waiting. Fail fast instead so the caller can retry on a fresh page.
function withDeadline(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' timed out after '+ms+'ms')), ms))
  ]);
}

async function renderOne(page, post, i, opts, fam){
  const { html, template } = buildSlideHtml(post, i, opts);
  await withDeadline(page.setContent(html, { waitUntil:'networkidle0' }), 20000, 'setContent');
  try{
    await withDeadline(page.evaluateHandle('document.fonts.ready'), 10000, 'fonts.ready');
    await withDeadline(page.evaluate(f=>document.fonts.load('700 100px "'+f+'"'), fam), 10000, 'fonts.load');
  }catch(e){}
  const buffer = await withDeadline(
    page.screenshot({ type:'png', clip:{x:0,y:0,width:1080,height:1920} }),
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
  const out = new Array(n);
  const poolSize = Math.min(
    Math.max(1, Number(opts.concurrency || process.env.RENDER_CONCURRENCY || 4)),
    n
  );
  let next = 0;
  async function openPage(){
    const page = await browser.newPage();
    await page.setViewport({ width:1080, height:1920, deviceScaleFactor:1 });
    return page;
  }
  // a page that just hung on setContent/screenshot may not close cleanly either —
  // don't let a slow close() block getting a replacement page.
  function discardPage(page){
    Promise.race([
      page.close().catch(()=>{}),
      new Promise(res=>setTimeout(res, 3000))
    ]).catch(()=>{});
  }
  async function worker(){
    let page = await openPage();
    try{
      while(true){
        const i = next++;
        if(i >= n) break;
        try{
          out[i] = await renderOne(page, post, i, opts, fam);
        }catch(e){
          // one retry on a fresh page — covers a stuck compositor on this specific page/tab
          console.error('slide', i, 'failed, retrying on a fresh page:', e.message||e);
          discardPage(page);
          page = await openPage();
          out[i] = await renderOne(page, post, i, opts, fam);
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
    if(!opts.browser) await browser.close();
  }
}

module.exports={ renderSlides, buildSlideHtml, toEmbeddable };
