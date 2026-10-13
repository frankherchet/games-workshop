const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../src/games/frogger-levels.js');
const M=require('../src/games/frogger-model.js');
const level=rows=>({rows,start:{x:4,y:0},goal:4,flies:[],world:0});
test('one cardinal step, boundaries and cooldown',()=>{
  const s=M.create(D.levels[0]);
  assert.equal(M.move(s,0,-1),false);assert.equal(M.move(s,1,1),false);
  assert.equal(M.move(s,0,1),true);assert.deepEqual(s.player,{x:4,y:1});
  assert.equal(M.move(s,0,1),false);M.step(s,.18);assert.equal(M.move(s,0,1),true);
});
test('goal stops simulation and grants no post-finish collection',()=>{
  const s=M.create(D.levels[0]);
  while(s.status==='playing'){M.move(s,0,1);M.step(s,.18);}
  assert.equal(s.status,'won');const time=s.time;M.step(s,.2);assert.equal(s.time,time);assert.equal(M.move(s,1,0),false);
});
test('vehicle crossing between frames is caught',()=>{
  const s=M.create(level([{kind:'road',speed:20,width:.2,offsets:[2.5]},{kind:'safe'}]));
  M.step(s,.2);assert.equal(s.status,'lost');
});
test('platform carries player and water kills without a platform',()=>{
  const s=M.create(level([{kind:'water',speed:1,width:2,offsets:[3]},{kind:'safe'}]));
  M.step(s,.2);assert.ok(Math.abs(s.player.x-4.2)<1e-8);assert.equal(s.status,'playing');
  assert.equal(M.move(s,0,1),true);assert.equal(s.status,'won');
  const wet=M.create(level([{kind:'water',speed:0,width:1,offsets:[0]},{kind:'safe'}]));M.step(wet,.01);assert.equal(wet.status,'lost');
});
test('simulation is independent of frame partition',()=>{
  const l=level([{kind:'water',speed:.6,width:3,offsets:[3]},{kind:'safe'}]);
  const a=M.create(l),b=M.create(l);M.step(a,.2);for(let i=0;i<20;i++)M.step(b,.01);
  assert.ok(Math.abs(a.player.x-b.player.x)<1e-8);assert.ok(Math.abs(a.time-b.time)<1e-8);
});
test('rescue is required before exit and survives movement',()=>{
  const l=level([{kind:'safe'},{kind:'safe'},{kind:'safe'}]);l.friend={x:7,y:1};
  const s=M.create(l);s.player={x:4,y:2};M.step(s,.01);assert.equal(s.status,'playing');
  s.player={x:7,y:1};M.step(s,.01);assert.equal(s.rescued,true);
  s.player={x:4,y:2};M.step(s,.01);assert.equal(s.status,'won');
});
test('progress unlocks sequentially, keeps best stars and time, and rejects invalid saves',()=>{
  const progress=M.freshProgress(),s=M.create(D.levels[0]);s.status='won';s.time=12;s.collected=[0,1,2];
  assert.equal(M.record(progress,s),3);assert.equal(progress.unlocked,1);assert.equal(progress.times[0],12);
  s.time=50;s.collected=[];M.record(progress,s);assert.equal(progress.stars[0],3);assert.equal(progress.times[0],12);
  assert.equal(M.record(progress,M.create(D.levels[1])),0);
  const saved=JSON.parse(JSON.stringify(progress));saved.unlocked=49;saved.stars[2]=99;saved.times[2]=-1;
  const loaded=M.loadProgress(saved);assert.equal(loaded.unlocked,1);assert.equal(loaded.stars[2],0);
  assert.equal(M.loadProgress({version:2,stars:[]}).unlocked,0);assert.equal(M.loadProgress(null).unlocked,0);
});
test('restart resets pickups, elapsed time and rescue',()=>{
  const s=M.create(D.levels[0]);s.collected=[0,1,2];s.rescued=true;s.time=5;
  const reset=M.create(s.level);assert.deepEqual(reset.collected,[]);assert.equal(reset.rescued,false);assert.equal(reset.time,0);
});
test('signals, train warning and emergency during green have distinct phases',()=>{
  assert.equal(M.phase({signal:true},2.9).active,true);assert.equal(M.phase({signal:true},3).active,false);
  assert.equal(M.phase({pulse:true},1).warning,true);assert.equal(M.phase({pulse:true},1.5).active,true);
  const row=D.levels.find(l=>l.id==='2-08').rows[1];
  assert.equal(M.phase(row,4.8).active,false);assert.equal(M.phase(row.emergency,4.8).active,true);
  const s=M.create(level([row,{kind:'safe'}]));s.time=4.8;s.player.x=2;M.step(s,.01);assert.equal(s.status,'lost');
});
test('sinking leaves warn before losing support; crocodiles never support',()=>{
  const row={kind:'sink',width:2,offsets:[3]};
  assert.equal(M.phase(row,3.5).warning,true);assert.ok(M.support(row,4,4.1));assert.equal(M.support(row,4,4.2),false);
  const s=M.create(level([row,{kind:'safe'}]));s.time=4.19;M.step(s,.05);assert.equal(s.status,'lost');
  assert.equal(M.support({kind:'water',speed:0,width:2,offsets:[3],dangers:[0]},4,0),undefined);
});
test('ferries stop at the dock and announced currents accelerate continuously',()=>{
  const row={kind:'water',speed:.5,width:3,offsets:[0],dock:true};
  assert.equal(M.objects(row,0)[0].x,M.objects(row,2.9)[0].x);
  assert.ok(Math.abs(M.objects(row,4)[0].x-.5)<1e-8);
  const wind={...row,dock:false,wind:true};
  assert.equal(M.phase(wind,1).warning,true);assert.equal(M.phase(wind,2).label,'SCHNELL');
  assert.ok(Math.abs(M.objects(wind,3)[0].x-M.objects(wind,2)[0].x-1)<1e-8);
});
