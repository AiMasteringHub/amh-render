#!/usr/bin/env node
// Local test: render a post JSON to finished PNGs in ./out — no dashboard needed.
// Usage:
//   node src/index.js [path/to/post.json] [templateIndex] [packId|packDir]
// Examples:
//   node src/index.js sample-post.json 0 amh            # AMH's pack
//   node src/index.js sample-post.json 0 test-bluewave  # a different pack (different layouts)
//   node src/index.js sample-post.json                  # default starter pack
const fs=require('fs');
const path=require('path');
const {renderSlides}=require('./renderer');
const {loadPackFromDir,loadPack,templateForPost,PACKS_DIR}=require('./pack');
const {makeTheme}=require('./brand');

function resolvePackArg(arg){
  if(!arg) return loadPack({});                       // default starter pack
  const dir = fs.existsSync(arg) ? arg : path.join(PACKS_DIR, arg);
  return loadPack(loadPackFromDir(dir));
}

async function main(){
  const file = process.argv[2] || path.join(__dirname,'..','sample-post.json');
  const post = JSON.parse(fs.readFileSync(file,'utf8'));
  const pack = resolvePackArg(process.argv[4]);
  const templates = pack.buildTemplates(makeTheme(pack.brand));
  const templateIndex = process.argv[3]!=null && process.argv[3]!==''
    ? Number(process.argv[3])
    : (post.templateIndex!=null ? post.templateIndex : templateForPost(post.postIndex||0, templates.length));

  console.log('Pack: '+pack.brand.name+(pack.usingDefault?' (default starter layouts)':'')
    +' — '+templates.length+' layouts. Rendering '+post.slides.length+' slides using layout '
    +templateIndex+' ('+templates[templateIndex].name+')…');

  const slides = await renderSlides(post, { pack, templateIndex, imageUrl: post.imageUrl || null });

  const outDir = path.join(process.cwd(),'out',post.id);
  fs.mkdirSync(outDir,{recursive:true});
  for(const s of slides){
    fs.writeFileSync(path.join(outDir,'slide-'+String(s.index).padStart(2,'0')+'.png'), s.buffer);
  }
  console.log('Done. Wrote '+slides.length+' PNGs to '+outDir);
}

main().catch(e=>{console.error(e);process.exit(1);});
