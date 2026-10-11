const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
for (const file of [...walk('src'), ...walk('scripts'), ...walk('tests')].filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', file]);
const html = fs.readFileSync('dist/index.html', 'utf8');
if (/https?:\/\//.test(html.replaceAll('http://www.w3.org/2000/svg', ''))) throw new Error('Unexpected external dependency');
if (!html.includes('lang="de"') || !html.includes('prefers-reduced-motion')) throw new Error('Missing accessibility defaults');
if (html.includes('<!-- SCRIPTS -->') || html.includes('<!-- STYLES -->')) throw new Error('Unresolved build marker');
console.log('JavaScript syntax, standalone build and accessibility defaults checked.');
