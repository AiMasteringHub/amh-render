// Loads and normalises a client's DESIGN PACK: brand tokens + layout set (+ optional
// bespoke slide markup). The engine renders whatever pack it is handed; it owns no
// client's layouts.
//
// v2: layout code now comes from the database (SLIDE_PACKS via ORDS
// GET /render/packs/:ccc_id) so the APEX page 165 preview and this renderer run the
// same templates.js / slideInner.js. The packs/<clientId>/ folders stay as a fallback
// when the database call fails or AMH_PACKS_FROM_DB=0.
//
//   - Layout CODE: fetched from SLIDE_PACKS for the card's strategy, loaded with vm
//     (no require, no filesystem). Cached in memory by packId + version.
//   - Brand TOKENS: unchanged — from the dashboard (getDesignPack) or brand.json.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { normaliseBrand } = require('./brand');
const defaultPack = require('./default-pack');

const PACKS_DIR = process.env.AMH_PACKS_DIR || path.join(__dirname, '..', 'packs');
// Same ORDS base the card fetch already uses, e.g. https://aimasteringhub.oracleapexservices.com/ords/aimasteringhub42
const ORDS_BASE = (process.env.AMH_ORDS_BASE || '').replace(/\/$/, '');
const PACKS_FROM_DB = process.env.AMH_PACKS_FROM_DB !== '0';

// Which layout a given post uses. Rotation over the pack's OWN layout count.
function templateForPost(postIndex, count){
  count = count || 1;
  return (((postIndex||0) % count) + count) % count;
}

function tryRequire(p){ try{ return require(p); }catch(e){ return null; } }
function tryReadJson(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; } }

// ---------------------------------------------------------------------------
// Folder packs (fallback / local testing) — unchanged
// ---------------------------------------------------------------------------
function loadPackFromDir(dir){
  const t = tryRequire(path.join(dir,'templates.js'));
  const s = tryRequire(path.join(dir,'slideInner.js'));
  const brandRaw = tryReadJson(path.join(dir,'brand.json'));
  return {
    buildTemplates: (t && t.buildTemplates) || null,
    slideInner: (s && s.slideInner) || null,
    brandRaw
  };
}

// Turn raw pack pieces into a ready-to-render pack.
//   raw = { brand|brandRaw, buildTemplates?, slideInner?, canvas?, packId?, packCode?, version? }
function loadPack(raw){
  raw = raw || {};
  const brand = normaliseBrand(raw.brand || raw.brandRaw || raw);
  const buildTemplates = raw.buildTemplates || defaultPack.buildTemplates;
  const slideInner = raw.slideInner || null;   // null => renderer uses shared vocabulary
  const usingDefault = !raw.buildTemplates;
  const canvas = { w: (raw.canvas && raw.canvas.w) || 1080, h: (raw.canvas && raw.canvas.h) || 1350 };
  return { brand, buildTemplates, slideInner, usingDefault, canvas,
           packId: raw.packId || null, packCode: raw.packCode || null, version: raw.version || null };
}

// Folder resolver (sync). Kept for local runs and as the fallback.
//   opts = { clientId, brand?, packsDir? }
function resolvePack(opts){
  opts = opts || {};
  const base = opts.packsDir || PACKS_DIR;
  let dir = path.join(base, String(opts.clientId||''));
  if(!fs.existsSync(dir)) dir = path.join(base, 'amh');
  const fromDir = fs.existsSync(dir) ? loadPackFromDir(dir) : { buildTemplates:null, slideInner:null, brandRaw:null };
  return loadPack({
    brand: opts.brand || fromDir.brandRaw,
    buildTemplates: fromDir.buildTemplates,
    slideInner: fromDir.slideInner
  });
}

// ---------------------------------------------------------------------------
// Database packs (production)
// ---------------------------------------------------------------------------
const cache = new Map();   // key packId:version -> { buildTemplates, slideInner }

// Run a pack module's source in a sandbox. Packs in the database are self-contained:
// no require, no fs, no network.
function loadModuleFromSource(src, name){
  const module = { exports: {} };
  const sandbox = {
    module, exports: module.exports,
    require: function(){ throw new Error('require is not available inside a database pack (' + name + ')'); },
    console
  };
  vm.runInNewContext(String(src || ''), sandbox, { filename: name, timeout: 2000 });
  return module.exports;
}

async function fetchPackJson(cccId){
  if(!ORDS_BASE) throw new Error('AMH_ORDS_BASE is not set');
  const url = ORDS_BASE + '/render/packs/' + encodeURIComponent(cccId);
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if(!r.ok) throw new Error('pack fetch ' + r.status + ' ' + url);
  const p = await r.json();
  if(p.error) throw new Error('pack endpoint: ' + p.error);
  if(!p.templatesJs || !p.slideInnerJs) throw new Error('pack ' + (p.packCode||p.packId) + ' has no code');
  return p;
}

// Production resolver: layout code from SLIDE_PACKS for the card, brand tokens from
// the dashboard. Falls back to the folder pack if the database is unreachable, so a
// render still succeeds.
//   opts = { cccId, clientId, brand?, packsDir? }
async function resolvePackAsync(opts){
  opts = opts || {};
  if(!PACKS_FROM_DB || !opts.cccId) return resolvePack(opts);
  try{
    const p = await fetchPackJson(opts.cccId);
    const key = p.packId + ':' + p.version;
    let code = cache.get(key);
    if(!code){
      const t = loadModuleFromSource(p.templatesJs, p.packCode + '/templates.js');
      const s = loadModuleFromSource(p.slideInnerJs, p.packCode + '/slideInner.js');
      if(typeof t.buildTemplates !== 'function') throw new Error('pack ' + p.packCode + ': templates.js has no buildTemplates');
      if(typeof s.slideInner !== 'function')     throw new Error('pack ' + p.packCode + ': slideInner.js has no slideInner');
      code = { buildTemplates: t.buildTemplates, slideInner: s.slideInner };
      cache.set(key, code);
    }
    return loadPack({
      brand: opts.brand,
      buildTemplates: code.buildTemplates,
      slideInner: code.slideInner,
      canvas: p.canvas, packId: p.packId, packCode: p.packCode, version: p.version
    });
  }catch(e){
    console.warn('[packs] database pack failed for card ' + opts.cccId + ': ' + e.message + ' — using folder pack');
    return resolvePack(opts);
  }
}

module.exports = { loadPack, loadPackFromDir, resolvePack, resolvePackAsync, templateForPost, PACKS_DIR };
