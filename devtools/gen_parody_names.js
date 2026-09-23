/* Regenerate world/parody-names.json from src/sf/30a_sf_names.js.
   Run from repo root:  node devtools/gen_parody_names.js           */
global.fs = require('fs');
(0, eval)(fs.readFileSync('src/sf/30a_sf_names.js', 'utf8') + `;
const out = {
  _comment: "Machine-readable mirror of src/sf/30a_sf_names.js — GENERATED, do not hand-edit. Regenerate: node devtools/gen_parody_names.js. Naming authority: world/businesses.md. Rule: business names are parody only (design §11); civic/landmark kinds keep real names.",
  parody_names: SF_PARODY_NAMES,
  real_name_kinds: [...SF_REAL_NAME_KINDS],
  hidden_name_kinds: [...SF_HIDDEN_NAME_KINDS],
  kind_signage: SF_KIND_SIGNAGE,
  name_hints: SF_NAME_HINTS.map(([re, sign]) => [re.source, sign])
};
fs.writeFileSync('world/parody-names.json', JSON.stringify(out, null, 2) + '\\n');
console.log('wrote world/parody-names.json:',
  Object.keys(out.parody_names).length, 'parody names,',
  Object.keys(out.kind_signage).length, 'kind signages,',
  out.name_hints.length, 'name hints');
`);
