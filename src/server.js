// HTTP render service. The dashboard's "Create slides" (or the MCP generate_slides)
// POSTs { ccc_id }; the engine renders in the background and writes the result back
// via /complete or /failed. Keeps one browser warm.
const express=require('express');
const puppeteer=require('puppeteer');
const {Dashboard}=require('./dashboard');
const {renderCardAndSave}=require('./pipeline');

const PORT=process.env.PORT||8080;
const dashboard=new Dashboard(process.env.DASHBOARD_API_BASE_URL, process.env.RENDER_KEY);

let browserPromise=null;
function getBrowser(){
  if(!browserPromise) browserPromise = puppeteer.launch({
    headless: 'new',
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  return browserPromise;
}

const app=express();
app.use(express.json());
app.get('/',(_q,r)=>r.send('amh-render-service up'));
app.get('/health',(_q,r)=>r.json({ok:true}));

app.post('/render', async (req,res)=>{
  const cardId=(req.body&&(req.body.ccc_id??req.body.cardId??req.body.postId));
  if(cardId==null) return res.status(400).json({error:'ccc_id is required'});
  res.json({ok:true, started:true, ccc_id:cardId});   // async; result flows back via complete/failed
  try{
    const browser=await getBrowser();
    await renderCardAndSave(dashboard, cardId, {browser});
    console.log('rendered', cardId);
  }catch(e){ console.error('render failed', cardId, e.message||e); }
});

app.listen(PORT,()=>console.log('AMH render service on :'+PORT));
