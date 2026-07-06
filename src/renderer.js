// Headless render: turn a post's slides into finished 1080x1920 PNGs, using the
// CLIENT'S design pack (brand + layouts + optional bespoke markup). No brand or
// layout is hard-coded here anymore — everything comes from `opts.pack`.
const fs=require('fs');
const path=require('path');
// puppeteer is loaded lazily inside renderSlides so the HTML-generation path
// (buildSlideHtml) can be used/tested without a browser installed.
const { makeTheme } = require('./brand');
const { slideDocument, defaultSlideInner } = require('./vocabulary');
const { templateForPost } = require('./pack');

// Local file paths (e.g. a brand logo on disk) are inlined as data URLs so the
// headless page can load them without a web server. http(s)/data URLs pass through.
function toEmbeddable(p){
  if(!p) return null;
  if(/^(https?:|data:)/i.test(p)) return p;
  const buf=fs.readFileSync(p);
  const ext=(path.extname(p).slice(1)||'png').toLowerCase();
  const mime=ext==='svg'?'image/svg+xml':('image/'+(ext==='jpg'?'jpeg':ext));
  return 'data:'+mime+';base64,'+buf.toString('base64');
}

// Build the finished HTML for one slide (no browser needed). Exposed so the logic
// can be tested — and the per-client theming proven — without launching Chromium.
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
  const imageUrl = toEmbeddable(opts.imageUrl || post.imageUrl || null);
  // pick the logo the layout needs: light/accent bg (logoColor:'dark') → logoOnLight; else logoOnDark
  const wantLight = tpl.logoColor==='dark';
  const logoRaw = wantLight ? (brand.logoOnLight || brand.logoOnDark)
                            : (brand.logoOnDark  || brand.logoOnLight);
  const logoUrl = toEmbeddable(logoRaw);
  const html = slideDocument(post.slides[i], i, post, tpl, post.slides.length,
    { imageUrl, logoUrl, brand, theme, slideInner });
  return { html, template: tpl.name };
}

// post = { id, tag, slides:[{main, accent, cta}], imageUrl? }
// opts = { pack, templateIndex?, postIndex?, imageUrl?, browser? }
async function renderSlides(post, opts={}){
  if(!opts.pack) throw new Error('renderSlides requires opts.pack (loaded design pack)');

  const browser = opts.browser || await require('puppeteer').launch({
    headless:'new',
    args:['--no-sandbox','--disable-setuid-sandbox','--font-render-hinting=none']
  });
  try{
    const page = await browser.newPage();
    await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
    const out=[];
    for(let i=0;i<post.slides.length;i++){
      const { html, template } = buildSlideHtml(post, i, opts);
      await page.setContent(html, {waitUntil:'networkidle0'});
      try{
        await page.evaluateHandle('document.fonts.ready');
        const fam=(opts.pack.brand.font&&opts.pack.brand.font.family)||'Manrope';
        await page.evaluate(f=>document.fonts.load('700 100px "'+f+'"'), fam);
      }catch(e){}
      const buffer = await page.screenshot({type:'png', clip:{x:0,y:0,width:1080,height:1920}});
      out.push({index:i+1, buffer, template});
    }
    await page.close();
    return out;
  } finally {
    if(!opts.browser) await browser.close();
  }
}

module.exports={ renderSlides, buildSlideHtml, toEmbeddable };
