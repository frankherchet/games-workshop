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
