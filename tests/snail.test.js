const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/games/snail-model.js');
function endNight(s){assert.equal(M.beginNight(s),true);s.spawned=s.waveTotal;s.snails=[];assert.equal(M.finishNight(s),true);}
function enemy(s,changes={}){M.spawn(s,()=>.4);Object.assign(s.snails.at(-1),changes);return s.snails.at(-1);}

test('A new garden has six living flowers, six locked plots and starting seeds',()=>{
  const s=M.newRun();assert.equal(M.living(s).length,6);assert.equal(s.plots.filter(p=>p.unlocked).length,6);assert.equal(s.inventory.daisy,3);
  assert.equal(s.phase,'day');assert.equal(s.money,70);
});
test('Watered flowers yield income and dry flowers do not',()=>{
  const s=M.newRun();s.plots[0].watered=true;s.plots[1].watered=true;endNight(s);
  assert.equal(s.lastIncome,4);assert.equal(s.money,74);assert.equal(s.plots[0].dry,0);assert.equal(s.plots[2].dry,1);
  assert.equal(s.plots[0].watered,false);
});
test('Two unwatered days cause withering and defeat, not an eaten-plant penalty',()=>{
  const s=M.newRun();endNight(s);assert.equal(s.over,false);endNight(s);
  assert.equal(s.over,true);assert.equal(s.dryLost,6);assert.equal(s.eaten,0);assert.equal(s.nights,2);
});
test('Watering heals and resets the consecutive dry-day count after the night',()=>{
  const s=M.newRun();endNight(s);s.player={x:320,y:300,dx:0,dy:-1};s.plots[0].hp=1;
  assert.equal(M.tend(s,s.plots[0]),true);assert.equal(s.plots[0].hp,3);endNight(s);
  assert.equal(M.living(s).length,1);assert.equal(s.plots[0].dry,0);
});
test('Seeds are consumed when planting, and remote interaction is rejected',()=>{
  const s=M.newRun();s.plots[0].type=null;const count=s.inventory.daisy;
  assert.equal(M.tend(s,s.plots[0]),false);assert.equal(s.inventory.daisy,count);
  s.player.x=320;s.player.y=300;assert.equal(M.tend(s,s.plots[0]),true);assert.equal(s.inventory.daisy,count-1);assert.equal(s.plots[0].watered,true);
});
test('Shop prices are discounted on easy; insufficient money never creates an item',()=>{
  const easy=M.newRun(0,'easy'),normal=M.newRun();assert.ok(M.price(easy,35)<M.price(normal,35));
  normal.money=0;assert.equal(M.buy(normal,'electric'),false);assert.equal(normal.inventory.electric,0);
});
test('Expansion unlocks exactly three plots and does not create free plants',()=>{
  const s=M.newRun();s.money=500;assert.equal(M.buy(s,'expand'),true);assert.equal(s.plots.filter(p=>p.unlocked).length,9);
  assert.equal(M.living(s).length,6);M.buy(s,'expand');assert.equal(s.plots.filter(p=>p.unlocked).length,12);assert.equal(M.buy(s,'expand'),false);
});
test('Rare seeds require a garden unlock and upgrades have explicit caps',()=>{
  const s=M.newRun();s.money=5000;assert.equal(M.buy(s,'moon',0),false);assert.equal(M.buy(s,'moon',1),true);
  for(let i=0;i<3;i++)assert.equal(M.buy(s,'damage'),true);assert.equal(M.buy(s,'damage'),false);assert.equal(s.damage,4);
});
test('Day switches to night automatically or can be started earlier',()=>{
  const s=M.newRun();s.dayTime=179.99;M.step(s,.05);assert.equal(s.phase,'night');assert.ok(s.waveTotal>0);
  assert.equal(M.beginNight(s),false);const early=M.newRun();assert.equal(M.beginNight(early),true);
});
test('The hard-mode lifetime loss limit increases slowly with survived nights',()=>{
  const s=M.newRun(0,'hard');assert.equal(M.lossLimit(s),6);s.nights=4;assert.equal(M.lossLimit(s),8);
  s.eaten=8;assert.equal(M.step(s,0),undefined);assert.equal(s.over,false);s.eaten=9;M.step(s,0);assert.equal(s.over,false);
  M.beginNight(s);M.step(s,0);assert.equal(s.over,true);
});
test('Hack strikes only ahead, uses cooldown, and rewards a kill exactly once',()=>{
  const s=M.newRun();M.beginNight(s);s.player={x:450,y:450,dx:1,dy:0};
  const behind=enemy(s,{x:425,y:450}),ahead=enemy(s,{x:480,y:450});const money=s.money;
  assert.equal(M.attack(s),true);assert.equal(ahead.hp,0);assert.equal(behind.hp,1);assert.equal(s.money,money+2);
  assert.equal(M.attack(s),false);assert.equal(s.money,money+2);
});
test('Later gardens and nights spawn armored and giant snails',()=>{
  const s=M.newRun(2);M.beginNight(s);M.spawn(s,()=>.9);assert.equal(s.snails.at(-1).type,'giant');assert.equal(s.snails.at(-1).hp,5);
  const t=M.newRun(1);M.beginNight(t);M.spawn(t,()=>.7);assert.equal(t.snails.at(-1).type,'armored');assert.equal(t.snails.at(-1).hp,3);
});
test('A giant can damage several adjacent plants in one feeding action',()=>{
  const s=M.newRun(2);M.beginNight(s);s.snails=[];const n=enemy(s,{type:'giant',x:320,y:255,bite:2,speed:0});
  M.step(s,.01);assert.equal(s.plots[0].hp,1);assert.equal(s.plots[1].hp,1);assert.ok(n.timer>0);
});
test('Placement consumes stock and rejects plant overlap or distant construction',()=>{
  const s=M.newRun();s.inventory.pit=2;s.player.x=320;s.player.y=300;
  assert.equal(M.place(s,'pit',s.plots[0]),false);assert.equal(M.place(s,'pit',{x:850,y:500}),false);
  assert.equal(M.place(s,'pit',{x:256,y:320}),true);assert.equal(s.inventory.pit,1);assert.equal(s.structures.length,1);
});
test('An electric fence stops exactly its remaining charge count',()=>{
  const s=M.newRun();s.inventory.electric=1;s.player.x=256;s.player.y=320;assert.equal(M.place(s,'electric',{x:256,y:320}),true);
  M.beginNight(s);s.spawned=s.waveTotal;s.structures[0].charges=1;enemy(s,{x:256,y:320,hp:7,maxHp:7});
  M.step(s,.01);assert.equal(s.kills,1);assert.equal(s.structures.length,0);
});
test('Wooden fences block, lose health and can be repaired during the day',()=>{
  const s=M.newRun();s.inventory.fence=1;s.player.x=256;s.player.y=320;M.place(s,'fence',{x:256,y:320});M.beginNight(s);const n=enemy(s,{x:256,y:320});const hp=s.structures[0].hp;
  M.step(s,.05);assert.ok(s.structures[0].hp<hp);assert.equal(n.x,256);s.phase='day';assert.equal(M.repair(s,{x:256,y:320}),true);assert.equal(s.structures[0].hp,M.ITEMS.fence.hp);
});
test('Copper bands reduce enemy travel distance',()=>{
  const a=M.newRun(),b=M.newRun();M.beginNight(a);M.beginNight(b);
  a.structures.push({id:100,type:'copper',x:256,y:320,hp:1,charges:0,age:0,timer:0});
  const slow=enemy(a,{x:256,y:320}),fast=enemy(b,{x:256,y:320});const origin={x:256,y:320};M.step(a,.05);M.step(b,.05);
  assert.ok(M.dist(slow,origin)<M.dist(fast,origin));
});
test('Ducks consume food at dusk and hunt only while fed',()=>{
  const s=M.newRun();s.inventory.duck=1;s.player.x=256;s.player.y=320;M.place(s,'duck',{x:256,y:320});M.beginNight(s);
  assert.equal(s.inventory.food,0);assert.equal(s.structures[0].fed,true);enemy(s,{x:270,y:320});M.step(s,.05);assert.equal(s.kills,1);
  s.phase='day';M.beginNight(s);assert.equal(s.structures[0].fed,false);enemy(s,{x:270,y:320});M.step(s,.05);assert.equal(s.kills,1);
});
test('Garden unlocks use 5 and 10 nights in their own garden and survive a new run',()=>{
  const c=M.campaign(),s=M.newRun();s.nights=4;M.record(c,s);assert.equal(c.unlocked,0);s.nights=5;M.record(c,s);assert.equal(c.unlocked,1);
  const forest=M.newRun(1);forest.nights=9;M.record(c,forest);assert.equal(c.unlocked,1);forest.nights=10;M.record(c,forest);assert.equal(c.unlocked,2);
  M.record(c,M.newRun());assert.equal(c.unlocked,2);assert.equal(c.best[0],5);
});
test('Autosave roundtrip preserves a live night, inventory and enemy HP',()=>{
  const c=M.campaign(),s=M.newRun();M.beginNight(s);M.step(s,.05);s.snails=[];enemy(s,{hp:2,maxHp:3});s.spawned=s.waveTotal;
  for(let i=0;i<40;i++)M.step(s,.05);M.record(c,s);const restored=M.parseSave(JSON.stringify(c));assert.ok(restored.runs['0:medium']);
  assert.deepEqual(restored.runs['0:medium'],s);
});
test('Defeated games with eaten plants can still be restored',()=>{
  const c=M.campaign(),s=M.newRun();M.beginNight(s);for(const p of s.plots){p.type=null;p.hp=0;}M.step(s,.01);M.record(c,s);
  assert.equal(M.parseSave(JSON.stringify(c)).runs['0:medium'].over,true);
});
test('Corrupt storage and invalid run settings are rejected safely',()=>{
  assert.equal(M.parseSave('bad json'),null);assert.equal(M.parseSave('{"version":99}'),null);assert.throws(()=>M.newRun(9));
  const c=M.campaign(),s=M.newRun();s.money=-1;M.record(c,s);assert.equal(Object.keys(M.parseSave(JSON.stringify(c)).runs).length,0);
});
