// HTTP render service. Renders are queued and run ONE AT A TIME.
const express=require('express');
const puppeteer=require('puppeteer');
const {Dashboard}=require('./dashboard');
const {renderCardAndSave}=require('./pipeline');
const PORT=process.env.PORT||8080;
const dashboard=new Dashboard(process.env.DASHBOARD_API_BASE_URL, process.env.RENDER_KEY);
let browserPromise=null;
function getBrowser(){
  if(!browserPromise){
    browserPromise = puppeteer.launch({
      headless: 'new',
      protocolTimeout: 300000,
          args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    // if Chrome dies/disconnects on its own, don't wait for the next screenshot
    // to discover that — drop the stale promise immediately so the next job relaunches.
    browserPromise.then(b=>{
      b.on('disconnected', ()=>{
        console.error('browser disconnected');
        if(browserPromise && browserPromise.then) browserPromise=null;
      });
    }).catch(()=>{ browserPromise=null; });
  }
  return browserPromise;
}
// close with a hard deadline — if Chrome is wedged, close() itself can hang forever,
// which would jam the queue behind it. Force-kill the process instead.
async function closeBrowser(b){
  if(!b) return;
  try{
    await Promise.race([
      b.close(),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('close timed out')), 5000))
    ]);
  }catch(_){
    try{ const proc=b.process&&b.process(); if(proc) proc.kill('SIGKILL'); }catch(__){}
  }
}
// simple in-process queue: one render at a time
let queue = Promise.resolve();
function enqueue(cardId){
  queue = queue.then(async ()=>{
    try{
      const browser=await getBrowser();
      await renderCardAndSave(dashboard, cardId, {browser});
      console.log('rendered', cardId);
        }catch(e){
      console.error('render failed', cardId, e.message||e);
      try{ await dashboard.fail(cardId, e.message||e); }
      catch(e2){ console.error('could not report failure', cardId, e2.message||e2); }
      // close the old browser so its Chrome processes are reclaimed (prevents EAGAIN leak)
      const stale = browserPromise;
      browserPromise = null;
      try{ const b = stale && await stale; await closeBrowser(b); }catch(_){}
    }
  });
}
const app=express();
app.use(express.json());
app.get('/',(_q,r)=>r.send('amh-render-service up'));
app.get('/health',(_q,r)=>r.json({ok:true}));
app.post('/render',(req,res)=>{
  const cardId=(req.body&&(req.body.ccc_id??req.body.cardId??req.body.postId));
  if(cardId==null) return res.status(400).json({error:'ccc_id is required'});
  res.json({ok:true, queued:true, ccc_id:cardId});
  enqueue(cardId);
});
app.listen(PORT,()=>console.log('AMH render service on :'+PORT));
