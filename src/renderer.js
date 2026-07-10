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
  const templateIndex = (opts.templateIndex!=null) ? opts.templateIndex
                        : templateForPost(opts.postIndex||0, TEMPLATES.length);
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

async function renderOne(page, post, i, opts, fam){
  const { html, template } = buildSlideHtml(post, i, opts);
  await page.setContent(html, { waitUntil:'networkidle0' });
  try{
    await page.evaluateHandle('document.fonts.ready');
    await page.evaluate(f=>document.fonts.load('700 100px "'+f+'"'), fam);
  }catch(e){}
  const buffer = await page.screenshot({ type:'png', clip:{x:0,y:0,width:1080,height:1920} });
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
  async function worker(){
    const page = await browser.newPage();
    await page.setViewport({ width:1080, height:1920, deviceScaleFactor:1 });
    try{
      while(true){
        const i = next++;
        if(i >= n) break;
        out[i] = await renderOne(page, post, i, opts, fam);
      }
    } finally {
      await page.close();
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
