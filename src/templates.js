// DEPRECATED shim. The engine no longer owns a layout set — layouts are per-client
// design-pack data (see pack.js and packs/<clientId>/). AMH's own 15 layouts now live
// in packs/amh/templates.js. This file remains only so older imports don't break.
//
//   - templateForPost      -> pack.js
//   - buildTemplates (AMH)  -> packs/amh/templates.js
//   - slideDocument         -> vocabulary.js
const { templateForPost } = require('./pack');
const { buildTemplates } = require('../packs/amh/templates');   // AMH pack, for back-compat
const { slideDocument } = require('./vocabulary');

module.exports = { templateForPost, buildTemplates, slideDocument };
