const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(fail=false){let loads=0;class Image{constructor(){this.width=1122;this.height=1402;}set src(v){loads++;if(fail)this.onerror();else this.onload();}}const root={Image,SnailAssets:{cat:'cat.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-cat.js','utf8'),root);let depth=0;const calls=[];const c={imageSmoothingEnabled:false,globalAlpha:1,save(){depth++;},restore(){depth--;},translate(){},scale(){},beginPath(){},ellipse(){},fill(){},drawImage(...a){calls.push(a.slice(1));}};return {root,c,calls,loads:()=>loads,depth:()=>depth};}
test('Detailed cat atlas loads once and selects all five behaviors and their four frames',async()=>{
 const {root,c,calls,loads,depth}=setup();assert.equal(loads(),0);await root.SnailCat.ready;await root.SnailCat.ready;assert.equal(loads(),1);
 for(const [row,mode]of ['sit','walk','play','groom','sleep'].entries())for(let frame=0;frame<4;frame++){
  const speed={sit:1,walk:7,play:5,groom:3,sleep:1}[mode],cat={x:100,y:200,mode,facing:-1,age:(frame+.01)/speed},before=JSON.stringify(cat);
  assert.equal(root.SnailCat.draw(c,cat),true);assert.deepEqual(calls.at(-1).slice(0,4),Array.from(root.SnailCat.layout[row*4+frame]));assert.equal(depth(),0);assert.equal(c.imageSmoothingEnabled,false);assert.equal(JSON.stringify(cat),before);
 }
});
test('Every cat crop is inside the supplied PNG and transition blends adjacent behaviors',async()=>{
 const {root,c,calls}=setup();const png=fs.readFileSync('src/assets/garden-cat-v12.png');assert.equal(png.readUInt32BE(16),1122);assert.equal(png.readUInt32BE(20),1402);await root.SnailCat.ready;
 for(const [x,y,w,h]of root.SnailCat.layout){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1122&&y+h<=1402);}
 root.SnailCat.draw(c,{x:100,y:200,mode:'sleep',previousMode:'sit',age:.2,facing:1});assert.equal(calls.length,2);root.SnailCat.draw(c,{x:100,y:200,mode:'play',age:10,facing:1},false,true);assert.deepEqual(calls.at(-1).slice(0,4),Array.from(root.SnailCat.layout[8]));
});
test('A failed cat atlas request retains procedural rendering without repeated downloads',async()=>{
 const {root,c,loads}=setup(true);assert.equal(await root.SnailCat.ready,false);assert.equal(root.SnailCat.draw(c,{mode:'sit'}),false);assert.equal(root.SnailCat.draw(c,{mode:'sit'}),false);assert.equal(loads(),1);
});
