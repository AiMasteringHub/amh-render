// The fallback STARTER pack — used only when a client has no design pack of their
// own yet, so a render never fails for lack of a pack. Deliberately plain: four
// neutral layouts over the shared vocabulary, themed by whatever brand is handed
// in. It is NOT AMH's pack and must never be presented as the offering — it is a
// safety net until the client's bespoke layouts are authored in Claude Design.

function buildTemplates(t){
  const baseT={showPhoto:true,photoMode:'fill',showOverlay:true,overlay:t.vGrad,showGlow:false,
    justify:'flex-end',align:'left',mainColor:t.WHITE,accentColor:t.ACCENT,showEyebrow:false,
    showQuote:false,showSheet:false,showSpine:false,showIndex:false,logoColor:'light',
    footerColor:'rgba(255,255,255,.92)',chevronColor:t.ACCENT,ctaBg:t.ACCENT,ctaColor:t.ACCENT_INK,
    frameBg:t.frameBgDefault,panel:false,panelStyle:''};
  const mk=(name,over)=>Object.assign({name},baseT,over);
  return [
    mk('Photo',{}),
    mk('Dark type',{showPhoto:false,showOverlay:false,showGlow:true,frameBg:t.DARK,justify:'center'}),
    mk('Panel',{overlay:t.glassGrad,panel:true}),
    mk('Solid',{showPhoto:false,showOverlay:false,frameBg:t.ACCENT,justify:'center',align:'center',mainColor:t.ACCENT_INK,accentColor:t.ACCENT_INK,logoColor:'dark',footerColor:'rgba(0,0,0,.7)',chevronColor:t.ACCENT_INK,ctaBg:t.ACCENT_INK,ctaColor:t.ACCENT})
  ];
}

module.exports={ buildTemplates };
