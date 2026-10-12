const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(fail=false){let loads=0;const draws=[];class Image{constructor(){this.width=1536;this.height=2048;}set src(value){loads++;if(fail)this.onerror();else this.onload();}}
 const root={Image,SnailAssets:{sprites:'atlas.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-sprites.js','utf8'),root);
 let depth=0;const c={imageSmoothingEnabled:false,drawImage(...args){draws.push(args.slice(1));},save(){depth++;},restore(){depth--;},translate(){},scale(){}};
 return {root,c,draws,loads:()=>loads,depth:()=>depth};
}
test('Sprite atlas loads lazily once and all character directions use the correct cells',async()=>{
 const {root,c,draws,loads}=setup();assert.equal(loads(),0);assert.equal(await root.SnailSprites.ready,true);assert.equal(await root.SnailSprites.ready,true);assert.equal(loads(),1);
 const directions=[{dx:0,dy:1},{dx:1,dy:0},{dx:0,dy:-1},{dx:-1,dy:0}];
 for(const [who,type]of ['gardener','gardeneress','fox'].entries())for(const [facing,direction]of directions.entries())for(let frame=0;frame<3;frame++){
  assert.equal(root.SnailSprites.character(c,type,100,200,frame===2?.125:0,frame>0,direction),true);
  const args=draws.at(-1),index=who*12+facing*3+frame;assert.deepEqual(args.slice(0,4),Array.from(root.SnailSprites.layout[index]));assert.equal(c.imageSmoothingEnabled,false);
 }
});
test('All snail variants select their crawl frames and balance canvas transforms',async()=>{
 const {root,c,draws,depth}=setup();await root.SnailSprites.ready;
 for(const [i,type]of ['normal','fast','armored','giant'].entries())for(let frame=0;frame<3;frame++){
  root.SnailSprites.snail(c,{type,id:0,x:20,y:20,dx:-1},frame/6+.001);const args=draws.at(-1),index=36+i*3+frame;assert.deepEqual(args.slice(0,4),Array.from(root.SnailSprites.layout[index]));assert.equal(depth(),0);
 }
});
test('Unavailable sprites retain the procedural fallback without repeated requests',async()=>{
 const {root,c,loads}=setup(true);assert.equal(await root.SnailSprites.ready,false);assert.equal(root.SnailSprites.character(c,'fox',10,10,0,false,{dx:0,dy:1}),false);assert.equal(loads(),1);
});

test('Every source rectangle stays inside the supplied transparent atlas',()=>{
 const {root}=setup();assert.equal(root.SnailSprites.layout.length,48);for(const [x,y,w,h]of root.SnailSprites.layout){assert.ok(x>=0&&y>=0&&w>20&&h>20);assert.ok(x+w<=1086&&y+h<=1448);}
});
