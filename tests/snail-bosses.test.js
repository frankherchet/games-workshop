const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(fail=false){let loads=0,depth=0;const calls=[];class Image{constructor(){this.width=this.height=1254;}set src(v){loads++;if(fail)this.onerror();else this.onload();}}const root={Image,SnailAssets:{bosses:'bosses.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-bosses.js','utf8'),root);const c={imageSmoothingEnabled:false,save(){depth++;},restore(){depth--;},translate(){},scale(){},beginPath(){},ellipse(){},fill(){},drawImage(...args){calls.push(args.slice(1));}};return {root,c,calls,loads:()=>loads,depth:()=>depth};}
test('All fourteen bosses use their own safe source crop and preserve saved creature state',async()=>{
 const {root,c,calls,loads,depth}=setup();await root.SnailBosses.ready;await root.SnailBosses.ready;assert.equal(loads(),1);const png=fs.readFileSync('src/assets/garden-bosses-v12.png'),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 for(let design=0;design<14;design++){
  const n={type:'boss',bossDesign:design,x:100,y:200,id:42,dx:-1,hp:12},before=JSON.stringify(n);assert.equal(root.SnailBosses.draw(c,n,1),true);const box=Array.from(root.SnailBosses.layout[design]);assert.deepEqual(calls.at(-1).slice(0,4),box);assert.ok(box[0]>=0&&box[1]>=0&&box[2]>0&&box[3]>0&&box[0]+box[2]<=w&&box[1]+box[3]<=h);assert.equal(JSON.stringify(n),before);assert.equal(depth(),0);assert.equal(c.imageSmoothingEnabled,false);
 }
});
test('Boss atlas failure keeps the existing fallback and never downloads repeatedly',async()=>{
 const {root,c,loads}=setup(true);assert.equal(await root.SnailBosses.ready,false);assert.equal(root.SnailBosses.draw(c,{type:'boss'}),false);assert.equal(root.SnailBosses.draw(c,{type:'boss'}),false);assert.equal(loads(),1);
});
