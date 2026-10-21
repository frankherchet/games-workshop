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
test('Cat moves continuously, plays, grooms and rests for at least 22 seconds without changing gameplay',()=>{
 const A=global.SnailArt,s=M.newRun(),cat=A.createCat(s),before=JSON.stringify(s),modes=new Set(),draws=new Set();assert.ok(cat);
 for(let i=0;i<6000;i++){
  const x=cat.x,y=cat.y;A.updateCat(cat,s,.05);assert.ok(Math.hypot(cat.x-x,cat.y-y)<=1.20001);modes.add(cat.mode);
  if(cat.mode==='sleep')assert.ok(cat.remaining+cat.age>=22-1e-7);
  if(!draws.has(cat.mode)){const c=canvas();A.blackCat(c.ctx,cat);c.result();draws.add(cat.mode);}
 }
 assert.deepEqual([...modes].sort(),['groom','play','sit','sleep','walk']);assert.equal(JSON.stringify(s),before);
});
test('Continuous cat routes avoid all flower beds and defenses across all gardens',()=>{
 const A=global.SnailArt;
 for(let level=0;level<3;level++){
  const s=M.newRun(level);s.plots.forEach(p=>p.unlocked=true);s.structures=[{x:650,y:400}];const cat=A.createCat(s);assert.ok(cat);
  for(let i=0;i<3000;i++){A.updateCat(cat,s,.1);assert.ok(cat.x>=140&&cat.x<=820&&cat.y>=205&&cat.y<=520);for(const o of [...s.plots,...s.structures])assert.ok(Math.hypot(cat.x-o.x,cat.y-o.y)>=42-1e-7);}
 }
});
test('Cat stops instead of jumping when a new defense blocks its route',()=>{
 const A=global.SnailArt,s=M.newRun(),cat=A.createCat(s);A.updateCat(cat,s,4.1);assert.equal(cat.mode,'walk');const before={x:cat.x,y:cat.y};s.structures.push({x:cat.x,y:cat.y});A.updateCat(cat,s,.1);assert.equal(cat.mode,'sit');assert.equal(cat.x,before.x);assert.equal(cat.y,before.y);
});
test('Player movement does not move a resting cat, reduced motion freezes it, and full gardens skip spawning',()=>{
 const A=global.SnailArt,s=M.newRun(),cat=A.createCat(s),start={x:cat.x,y:cat.y};s.player.x=800;A.updateCat(cat,s,1);assert.equal(cat.x,start.x);assert.equal(cat.y,start.y);
 const sandbox={SnailModel:M,matchMedia:()=>({matches:true})};vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);const quiet=sandbox.SnailArt.createCat(s),before=JSON.stringify(quiet);sandbox.SnailArt.updateCat(quiet,s,30);assert.equal(JSON.stringify(quiet),before);
 for(let x=120;x<=850;x+=30)for(let y=180;y<=550;y+=30)s.structures.push({x,y});assert.equal(A.createCat(s),null);
});
test('Refined cat poses render in warm daylight and cool moonlight without changing state',()=>{
 const A=global.SnailArt,s=M.newRun();
 for(const mode of ['sit','walk','play','groom','sleep']){
  const cat={...A.createCat(s),mode,previousMode:'sit',age:1.3,walking:mode==='walk'},before=JSON.stringify(cat),day=canvas(),night=canvas();
  A.blackCat(day.ctx,cat,false);A.blackCat(night.ctx,cat,true);assert.notEqual(day.result().hash,night.result().hash);assert.equal(JSON.stringify(cat),before);
  for(const age of [0,.1,.325,.65]){const transition={...cat,age},c=canvas();A.blackCat(c.ctx,transition,true);c.result();}
 }
});
test('Reduced motion renders a fixed cat pose even when its animation age differs',()=>{
 const sandbox={SnailModel:M,matchMedia:()=>({matches:true})};vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
 for(const mode of ['walk','play','groom','sleep']){const cat={...sandbox.SnailArt.createCat(M.newRun()),mode,age:1},a=canvas(),b=canvas();sandbox.SnailArt.blackCat(a.ctx,cat,true);sandbox.SnailArt.blackCat(b.ctx,{...cat,age:3},true);assert.equal(a.result().hash,b.result().hash);}
});
test('Every elemental boss attack renders its warning and impact with valid colors',()=>{
 for(const theme of Object.keys(M.BOSS_ATTACKS))for(const hit of [false,true]){const c=canvas();global.SnailArt.bossAttack(c.ctx,{theme,hit,x:400,y:300,fromX:700,fromY:450,age:hit?2:1,timer:hit?-.2:.8,radius:42});c.result();}
});
test('Each garden renders its own scenery when switching between levels',async()=>{
 const loaded=[],drawn=[];
 class Image{constructor(){this.width=1536;this.height=1024;this.naturalWidth=1536;}set src(value){this.source=value;loaded.push(value);this.onload();}}
 const sandbox={SnailModel:M,Image,SnailAssets:{garden:'farm.png',gardenForest:'forest.png',gardenCastle:'castle.png'}};
 vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
 assert.equal(await sandbox.SnailArt.ready,true);assert.deepEqual(loaded,['farm.png','forest.png','castle.png']);
 for(const level of [0,1,2,1,0]){
  const c=canvas();Object.assign(c.ctx,{rect(){},clip(){},drawImage(image){drawn.push(image.source);}});
  const before=drawn.length;sandbox.SnailArt.garden(c.ctx,scene(level,'fox',false),0);c.result();
  assert.ok(drawn.length>before);assert.ok(drawn.slice(before).every(source=>source===['farm.png','forest.png','castle.png'][level]));
 }
 assert.equal(loaded.length,3);
});
test('A failed themed garden uses procedural scenery instead of another garden image',async()=>{
 class Image{constructor(){this.width=1536;this.naturalWidth=1536;}set src(value){if(value==='forest.png')this.onerror();else this.onload();}}
 const sandbox={SnailModel:M,Image,SnailAssets:{garden:'farm.png',gardenForest:'forest.png',gardenCastle:'castle.png'}};
 vm.runInNewContext(fs.readFileSync('src/games/snail-art.js','utf8'),sandbox);
 assert.equal(await sandbox.SnailArt.ready,false);
 const c=canvas();c.ctx.drawImage=()=>assert.fail('Forest must not show farm scenery after a failed load');
 sandbox.SnailArt.garden(c.ctx,scene(1,'fox',false),0);assert.ok(c.result().count>4000);
});
