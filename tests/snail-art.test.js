const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../src/games/snail-model.js');
require('../src/games/snail-art.js');

function canvas(){
  let count=0,depth=0;const digest=crypto.createHash('sha256'),colors=new Set();
  const color=value=>{assert.ok(typeof value==='string'&&(/^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(value)||/^rgba?\([\d.,\s]+\)$/.test(value)),`Invalid paint color: ${value}`);colors.add(value);};
  const gradient=()=>({gradient:true,addColorStop(offset,value){assert.ok(offset>=0&&offset<=1);color(value);}});
  const ctx={createLinearGradient:gradient,createRadialGradient:gradient,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},
    fillRect(...args){assert.equal(args.length,4);assert.ok(args.every(Number.isFinite));assert.ok(args[2]>=0&&args[3]>=0);digest.update(JSON.stringify(args));count++;},
    translate(...args){assert.ok(args.every(Number.isFinite));},scale(...args){assert.ok(args.every(Number.isFinite));},
    beginPath(){},arc(...args){assert.ok(args.every(Number.isFinite));},stroke(){},moveTo(){},lineTo(){},fillText(text,x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));}};
  Object.defineProperty(ctx,'fillStyle',{set(value){if(value?.gradient)return;color(value);digest.update(value);}});
  Object.defineProperty(ctx,'strokeStyle',{set:color});
  return {ctx,result(){assert.equal(depth,0);return {count,colors:colors.size,hash:digest.digest('hex')};}};
}
function scene(level,character,night){
  const s=M.newRun(level,'medium',character);s.dayTime=150;s.lastAction=.2;s.attackFlash=.1;
  Object.keys(M.PLANTS).forEach((type,i)=>{s.plots[i].type=type;s.plots[i].hp=M.PLANTS[type].hp;s.plots[i].watered=i%2===0;s.plots[i].dry=i===2?1:0;});
  s.structures=Object.entries(M.ITEMS).filter(([id])=>id!=='food').map(([type,item],i)=>({id:i,type,x:240+i*70,y:470,hp:item.hp*.4,charges:item.charges,age:0,fed:true,timer:0}));
  if(night){s.phase='night';for(const [i,type]of ['normal','fast','armored','giant'].entries())s.snails.push({id:i,type,x:200+i*140,y:200,hp:3,maxHp:4,dx:i%2?-1:1,dy:0});}
  return s;
}
test('All gardens, characters, plant species and defenses render valid colors without changing the saved game',()=>{
  for(let level=0;level<3;level++)for(const character of ['gardener','gardeneress','fox'])for(const night of [false,true]){
    const s=scene(level,character,night),before=JSON.stringify(s),c=canvas();global.SnailArt.garden(c.ctx,s,2,{x:1});const result=c.result();
    assert.ok(result.count>4000);assert.ok(result.colors>60);assert.equal(JSON.stringify(s),before);
  }
});
test('Walking, wind and nighttime effects produce changing animation frames',()=>{
  const s=scene(0,'fox',true),a=canvas(),b=canvas();global.SnailArt.garden(a.ctx,s,0,{x:1});global.SnailArt.garden(b.ctx,s,.6,{x:1});assert.notEqual(a.result().hash,b.result().hash);
});
test('Reduced-motion preference freezes the decorative animation',()=>{
  const sandbox={SnailModel:M,matchMedia:()=>({matches:true})};vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
  const s=scene(0,'fox',true),a=canvas(),b=canvas();sandbox.SnailArt.garden(a.ctx,s,0,{x:1});sandbox.SnailArt.garden(b.ctx,s,5,{x:1});assert.equal(a.result().hash,b.result().hash);
});
test('Detailed scenery loads once, draws behind gameplay and preserves game state',async()=>{
  let loads=0,draws=0;
  class Image{constructor(){this.width=1536;this.height=1024;this.naturalWidth=1536;this.complete=false;}set src(value){assert.equal(value,'local.png');loads++;this.complete=true;this.onload();}}
  const sandbox={SnailModel:M,Image,SnailAssets:{garden:'local.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
  assert.equal(loads,0);assert.equal(await sandbox.SnailArt.ready,true);assert.equal(await sandbox.SnailArt.ready,true);assert.equal(loads,1);
  const s=scene(1,'fox',true),before=JSON.stringify(s),c=canvas();Object.assign(c.ctx,{rect(){},clip(){},drawImage(){draws++;}});
  sandbox.SnailArt.garden(c.ctx,s,2,{x:1});c.result();assert.ok(draws>=4);assert.equal(JSON.stringify(s),before);
});
test('A failed scenery request falls back to procedural art',async()=>{
  class Image{set src(value){this.complete=false;this.onerror();}}
  const sandbox={SnailModel:M,Image,SnailAssets:{garden:'missing.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
  assert.equal(await sandbox.SnailArt.ready,false);const c=canvas();sandbox.SnailArt.garden(c.ctx,scene(0,'gardener',false),0);assert.ok(c.result().count>4000);
});
