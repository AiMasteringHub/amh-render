// Loads and normalises a client's DESIGN PACK: brand tokens + layout set (+ optional
// bespoke slide markup). The engine renders whatever pack it is handed; it owns no
// client's layouts. AMH is just packs/amh — "client zero".
//
// Split of responsibilities (see the build spec §14):
//   - Layout CODE (buildTemplates, optional slideInner) is authored during onboarding,
//     reviewed, and DEPLOYED WITH THE ENGINE under packs/<clientId>/. It is trusted code,
//     never accepted raw from a client at render time.
//   - Brand TOKENS come from the dashboard (getDesignPack) — the client's own colours,
//     font, logos, footer. Or, for local testing, from packs/<clientId>/brand.json.

const fs = require('fs');
const path = require('path');
const { normaliseBrand } = require('./brand');
const defaultPack = require('./default-pack');

const PACKS_DIR = process.env.AMH_PACKS_DIR || path.join(__dirname, '..', 'packs');

// Which layout a given post uses. Rotation over the pack's OWN layout count, so it
// works whatever number of layouts a client's pack defines.
function templateForPost(postIndex, count){
  count = count || 1;
  return (((postIndex||0) % count) + count) % count;
}

function tryRequire(p){ try{ return require(p); }catch(e){ return null; } }
function tryReadJson(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; } }

// Read a pack directory: templates.js (required for a real pack), optional slideInner.js,
// optional brand.json. Returns the raw pieces (not yet normalised).
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
//   raw = { brand|brandRaw, buildTemplates?, slideInner? }
// Missing layout code falls back to the neutral default starter pack.
function loadPack(raw){
  raw = raw || {};
  const brand = normaliseBrand(raw.brand || raw.brandRaw || raw);
  const buildTemplates = raw.buildTemplates || defaultPack.buildTemplates;
  const slideInner = raw.slideInner || null;   // null => renderer uses shared vocabulary
  const usingDefault = !raw.buildTemplates;
  return { brand, buildTemplates, slideInner, usingDefault };
}

// Production resolver: combine the client's deployed layout code (packs/<clientId>/)
// with brand tokens from the dashboard. If no pack folder exists for the client, the
// default starter pack is used with their brand — a render still succeeds, on-brand.
//   opts = { clientId, brand?, packsDir? }
function resolvePack(opts){
  opts = opts || {};
  const dir = path.join(opts.packsDir || PACKS_DIR, String(opts.clientId||''));
  const fromDir = fs.existsSync(dir) ? loadPackFromDir(dir) : { buildTemplates:null, slideInner:null, brandRaw:null };
  return loadPack({
    brand: opts.brand || fromDir.brandRaw,     // dashboard tokens win; brand.json is the local fallback
    buildTemplates: fromDir.buildTemplates,
    slideInner: fromDir.slideInner
  });
}

module.exports = { loadPack, loadPackFromDir, resolvePack, templateForPost, PACKS_DIR };
