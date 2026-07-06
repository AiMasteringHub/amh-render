// Talks to the AMH dashboard's ORDS /render endpoints. Auth via X-Render-Key header.
class DashboardError extends Error{
  constructor(status,message){super(message);this.status=status;this.name='DashboardError';}
}
class Dashboard{
  constructor(baseUrl,renderKey){
    this.baseUrl=(baseUrl||'').replace(/\/$/,'');   // e.g. https://<host>/apex/aimasteringhub42
    this.key=renderKey;
  }
  async req(p,init={}){
    const res=await fetch(this.baseUrl+p,{...init,headers:{'X-Render-Key':this.key,...(init.headers||{})}});
    if(!res.ok){const b=await res.text().catch(()=>'');throw new DashboardError(res.status,'Dashboard '+res.status+' '+p+(b?(' — '+b):''));}
    if(res.status===204) return null;
    const ct=res.headers.get('content-type')||'';
    return ct.includes('json')?res.json():res.text();
  }

  // GET /render/cards/:id  -> our card payload, mapped to the engine's post shape.
  async getPost(cardId){
    const c=await this.req('/render/cards/'+encodeURIComponent(cardId));
    return {
      id:String(c.cccId),
      clientId:String(c.strategyId),
      tag:c.topic||'',
      imageUrl:c.imageUrl||null,
      templateIndex:(c.templateIndex!=null?c.templateIndex:null),
      slides:(c.slides||[]).map(s=>({ main:s.text, accent:null, cta:/cta/i.test(s.label||'')?s.text:null }))
    };
  }

  // GET /render/clients/:sid/brand-kit -> brand tokens (null if the client has none yet).
  async getBrandKit(strategyId){
    try{ return await this.req('/render/clients/'+encodeURIComponent(strategyId)+'/brand-kit'); }
    catch(e){ if(e.status===404) return null; throw e; }
  }

  // POST /render/cards/:id/slides/:no  (image/png body)
  saveSlide(cardId,slideNo,buffer){
    return this.req('/render/cards/'+encodeURIComponent(cardId)+'/slides/'+slideNo,
      {method:'POST',headers:{'Content-Type':'image/png'},body:buffer});
  }

  // POST /render/cards/:id/complete  -> flips the card to slides_ready
  complete(cardId){
    return this.req('/render/cards/'+encodeURIComponent(cardId)+'/complete',{method:'POST'});
  }

  // POST /render/cards/:id/failed  {reason}
  fail(cardId,reason){
    return this.req('/render/cards/'+encodeURIComponent(cardId)+'/failed',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:String(reason).slice(0,1900)})});
  }
}
module.exports={Dashboard,DashboardError};
