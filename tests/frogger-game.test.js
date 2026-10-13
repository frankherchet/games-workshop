const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const D=require('../src/games/frogger-levels.js');
const M=require('../src/games/frogger-model.js');
class Target{
  constructor(){this.listeners=new Map();this.innerHTML='';this.hidden=false;}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  emit(name,event={}){for(const fn of this.listeners.get(name)||[])fn(event);}
  setAttribute(){}
  focus(){}
  querySelector(){return new Target();}
  querySelectorAll(){return [];}
  contains(){return false;}
  count(){return [...this.listeners.values()].reduce((n,s)=>n+s.size,0);}
}
function environment({blocked=false,raw=null}={}){
  const host=new Target(),doc=new Target(),win=new Target(),canvas=new Target(),overlay=new Target(),status=new Target(),nodes=new Map(),queue=new Map(),stored=new Map();
  let id=0,clock=0,drawn=null,fullscreenDisposed=false;
  canvas.getContext=()=>({});canvas.setPointerCapture=()=>{};
  nodes.set('canvas',canvas);nodes.set('.fg-overlay',overlay);nodes.set('.fg-status',status);
  host.querySelector=selector=>{if(!nodes.has(selector))nodes.set(selector,new Target());return nodes.get(selector);};
  if(raw!==null)stored.set('cs-games:frogger:v1',raw);
  const context={FroggerLevels:D,FroggerModel:M,FroggerArt:{draw(c,s){drawn={time:s.time,status:s.status,player:{...s.player}};}},Arcade:{games:{}},ArcadeFullscreen:{create(){return {dispose(){fullscreenDisposed=true;}};}},document:doc,window:win,performance:{now:()=>clock},matchMedia:()=>({matches:false}),localStorage:{getItem(k){if(blocked)throw Error('blocked');return stored.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');stored.set(k,v);}},requestAnimationFrame(fn){queue.set(++id,fn);return id;},cancelAnimationFrame(id){queue.delete(id);}};
  vm.runInNewContext(fs.readFileSync('src/games/frogger-game.js','utf8'),context);
  const game=context.Arcade.games.frogger({host});
  function click(dataset){host.emit('click',{target:{closest:()=>({dataset,disabled:false})}});}
  return {game,host,doc,win,canvas,overlay,status,stored,queue,click,get drawn(){return drawn;},get fullscreenDisposed(){return fullscreenDisposed;},tick(dt){clock+=dt*1000;const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(clock));}};
}
test('visibility and blur pause active time until explicit resume',()=>{
  const e=environment();e.click({level:'0'});e.tick(.5);assert.ok(Math.abs(e.drawn.time-.5)<1e-8);
  e.doc.hidden=true;e.doc.emit('visibilitychange');e.tick(10);assert.ok(Math.abs(e.drawn.time-.5)<1e-8);assert.match(e.overlay.innerHTML,/Kleine Spielpause/);
  e.doc.hidden=false;e.click({action:'resume'});e.tick(.2);assert.ok(Math.abs(e.drawn.time-.7)<1e-8);
  e.win.emit('blur');e.tick(3);assert.ok(Math.abs(e.drawn.time-.7)<1e-8);e.game.dispose();
});
test('disposal removes input listeners, frame and fullscreen controller',()=>{
  const e=environment();assert.ok(e.host.count()+e.doc.count()+e.win.count()+e.canvas.count()>0);assert.equal(e.queue.size,1);
  e.game.dispose();assert.equal(e.queue.size,0);assert.equal(e.host.count()+e.doc.count()+e.win.count()+e.canvas.count(),0);assert.equal(e.fullscreenDisposed,true);
  const before=e.drawn;e.tick(1);e.click({level:'0'});assert.equal(e.drawn,before);
});
test('blocked storage shows a notice while completion remains playable',()=>{
  const e=environment({blocked:true});assert.match(e.overlay.innerHTML,/Speicherung nicht verfügbar/);e.click({level:'0'});
  for(let i=0;i<4;i++){e.click({direction:'up'});e.tick(.2);}
  assert.equal(e.drawn.status,'won');assert.match(e.overlay.innerHTML,/Speicherung nicht verfügbar/);e.game.dispose();
});
test('invalid storage resets safely and reset requires confirmation',()=>{
  const e=environment({raw:'not json'});e.click({level:'0'});
  for(let i=0;i<4;i++){e.click({direction:'up'});e.tick(.2);}
  const saved=e.stored.get('cs-games:frogger:v1');assert.ok(JSON.parse(saved).stars[0]>0);
  e.click({action:'menu'});e.click({action:'reset-confirm'});assert.equal(e.stored.get('cs-games:frogger:v1'),saved);assert.match(e.overlay.innerHTML,/Abbrechen/);
  e.click({action:'menu'});assert.equal(e.stored.get('cs-games:frogger:v1'),saved);
  e.click({action:'reset-confirm'});e.click({action:'reset-progress'});assert.equal(JSON.parse(e.stored.get('cs-games:frogger:v1')).stars[0],0);e.game.dispose();
});
test('restart clears time and menu freezes the current attempt',()=>{
  const e=environment();e.click({level:'0'});e.tick(.5);e.click({action:'restart'});assert.equal(e.drawn.time,0);
  e.click({action:'menu'});e.tick(5);assert.equal(e.drawn.time,0);e.game.dispose();
});
