// Pull a card from the dashboard, load the client's brand/pack, render the slides,
// upload each PNG (by slide number), then mark the card complete. On any error,
// mark the card failed so the dashboard shows it.
const { renderSlides } = require('./renderer');
const { resolvePackAsync, templateForPost } = require('./pack');
const { makeTheme } = require('./brand'); 

// --- Optimisation 5: parallel data fetching where possible ---
// --- Optimisation 6: parallel slide uploads ---
async function renderCardAndSave(dashboard, cardId, opts={}){
  try{
    const post = await dashboard.getPost(cardId);

    // brand must resolve first — resolvePackAsync may use it internally
    const brandRaw = await dashboard.getBrandKit(post.clientId);
    console.log('[DEBUG] brandRaw keys:', Object.keys(brandRaw||{}));
    console.log('[DEBUG] brandRaw.footer:', JSON.stringify(brandRaw&&brandRaw.footer));
    console.log('[DEBUG] brandRaw.website:', JSON.stringify(brandRaw&&brandRaw.website));
    console.log('[DEBUG] brandRaw.url:', JSON.stringify(brandRaw&&brandRaw.url));
    console.log('[DEBUG] brandRaw.domain:', JSON.stringify(brandRaw&&brandRaw.domain));
    console.log('[DEBUG] brandRaw.name:', JSON.stringify(brandRaw&&brandRaw.name));
    console.log('[DEBUG] post.showLogo:', JSON.stringify(post.showLogo));
    console.log('[DEBUG] post slides imageUrls:', JSON.stringify((post.slides||[]).map(s=>s.imageUrl)));
    const pack = opts.pack || await resolvePackAsync({ cccId: cardId, clientId: post.clientId, brand: brandRaw });
    if(!pack.brand) pack.brand = brandRaw;
    console.log('[DEBUG] pack.brand.footer:', JSON.stringify(pack.brand&&pack.brand.footer));
    console.log('[DEBUG] pack has custom slideInner:', !!pack.slideInner);

    const count = pack.buildTemplates(makeTheme(pack.brand)).length;
    const templateIndex = (opts.templateIndex!=null) ? opts.templateIndex
      : (post.templateIndex!=null ? post.templateIndex : templateForPost(opts.postIndex||0, count));

    const slides = await renderSlides(post, {
      pack, templateIndex, imageUrl: opts.imageUrl || post.imageUrl,
      postIndex: opts.postIndex, browser: opts.browser
    });

    // upload all slide images in parallel instead of one at a time
    await Promise.all(slides.map(s => dashboard.saveSlide(cardId, s.index, s.buffer)));

    await dashboard.complete(cardId);
    return { cardId, templateIndex, slides: slides.length };
  }catch(e){
    try{ await dashboard.fail(cardId, e.message||e); }catch(_){}
    throw e;
  }
}
module.exports={ renderCardAndSave };
