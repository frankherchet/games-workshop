const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const D=require('../src/games/frogger-levels.js');
const M=require('../src/games/frogger-model.js');
const root={FroggerLevels:D,FroggerModel:M};vm.runInNewContext(fs.readFileSync('src/games/frogger-art.js','utf8'),root);
function context(){
  const trace=[];let saves=0;
  const c=new Proxy({}, {get(target,name){
    if(name==='createLinearGradient')return ()=>({addColorStop(){}});
    return (...args)=>{for(const n of args.filter(a=>typeof a==='number'))assert.ok(Number.isFinite(n),`${name} uses finite coordinates`);if(name==='save')saves++;if(name==='restore')saves--;trace.push([name,...args]);};
  },set(target,name,value){target[name]=value;return true;}});
  return {c,trace,get saves(){return saves;}};
}
test('all 50 maps render five worlds without mutating simulation or leaking transforms',()=>{
  for(const l of D.levels)for(const time of [0,3.5,4.5]){
    const s=M.create(l);s.time=time;const before=JSON.stringify(s),c=context();root.FroggerArt.draw(c.c,s);
    assert.equal(c.saves,0);assert.equal(JSON.stringify(s),before);assert.ok(c.trace.some(t=>t[0]==='fillText'&&t[1]===l.name));
  }
});
test('reduced motion freezes decoration while required hazards continue to move',()=>{
  const s=M.create(D.levels[0]),a=context(),b=context();root.FroggerArt.draw(a.c,s,true);s.time=1;root.FroggerArt.draw(b.c,s,true);assert.deepEqual(a.trace,b.trace);
  const hazard=M.create(D.levels[1]),x=context(),y=context();root.FroggerArt.draw(x.c,hazard,true);hazard.time=1;root.FroggerArt.draw(y.c,hazard,true);assert.notDeepEqual(x.trace,y.trace);
});
