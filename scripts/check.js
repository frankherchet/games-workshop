const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
for (const file of [...walk('src'), ...walk('scripts'), ...walk('tests')].filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', file]);
const html = fs.readFileSync('dist/index.html', 'utf8');
if (/https?:\/\//.test(html.replaceAll('http://www.w3.org/2000/svg', ''))) throw new Error('Unexpected external dependency');
if (!html.includes('lang="de"') || !html.includes('prefers-reduced-motion')) throw new Error('Missing accessibility defaults');
if (html.includes('<!-- SCRIPTS -->') || html.includes('<!-- STYLES -->')) throw new Error('Unresolved build marker');
const assets=JSON.parse(fs.readFileSync('dist/assets-manifest.json','utf8'));
for(const asset of assets){
 if(!/^assets\/(?:garden-fine|garden-sprites|garden-defenses|garden-extras|garden-cat|garden-bosses)-[a-f0-9]{12}\.png$/.test(asset)||!fs.existsSync(path.join('dist',asset))||!html.includes(asset))throw new Error('Missing or unsafe game asset');
}
console.log('JavaScript syntax, standalone build and accessibility defaults checked.');

