// HTTP render service. Renders are queued with configurable concurrency.
const express=require('express');
const puppeteer=require('puppeteer');
const {Dashboard}=require('./dashboard');
const {renderCardAndSave}=require('./pipeline');
const PORT=process.env.PORT||8080;
// --- Optimisation 7: allow concurrent card rendering (default 2) ---
const CARD_CONCURRENCY=Math.max(1, Number(process.env.CARD_CONCURRENCY||2));
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
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    browserPromise.then(b=>{
      b.on('disconnected', ()=>{
        console.error('browser disconnected');
        if(browserPromise && browserPromise.then) browserPromise=null;
      });
    }).catch(()=>{ browserPromise=null; });
  }
  return browserPromise;
}
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

// --- Concurrency-limited queue: up to CARD_CONCURRENCY cards at once ---
let running = 0;
const waiting = [];

function enqueue(cardId){
  if(running < CARD_CONCURRENCY){
    running++;
    runCard(cardId);
  } else {
    waiting.push(cardId);
  }
}

async function runCard(cardId){
  try{
    const browser=await getBrowser();
    await renderCardAndSave(dashboard, cardId, {browser});
    console.log('rendered', cardId);
  }catch(e){
    console.error('render failed', cardId, e.message||e);
    // pipeline.renderCardAndSave already called dashboard.fail() — don't double-report
    const stale = browserPromise;
    browserPromise = null;
    try{ const b = stale && await stale; await closeBrowser(b); }catch(_){}
  } finally {
    running--;
    if(waiting.length){
      running++;
      runCard(waiting.shift());
    }
  }
}

const app=express();
app.use(express.json());
app.get('/',(_q,r)=>r.send('amh-render-service up'));
app.get('/health',(_q,r)=>r.json({ok:true, running, queued:waiting.length}));
app.post('/render',(req,res)=>{
  const cardId=(req.body&&(req.body.ccc_id??req.body.cardId??req.body.postId));
  if(cardId==null) return res.status(400).json({error:'ccc_id is required'});
  res.json({ok:true, queued:true, ccc_id:cardId});
  enqueue(cardId);
});
app.listen(PORT,()=>console.log('AMH render service on :'+PORT+' (concurrency: '+CARD_CONCURRENCY+')'));
