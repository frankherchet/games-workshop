const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/games/snail-game.js','utf8');
// Exercise the actual animation loop at a throttled frame rate without needing a browser renderer.
function runtime(){
 const sandbox={disposed:false,last:0,clock:0,catState:{age:0},A:{updateCat(cat,s,dt){cat.age+=dt;}},state:{phase:'day',player:{x:465,y:510},over:false,coinEvents:[]},menu:false,paused:false,joystick:{x:0,y:0},keys:new Set(),hold:false,lastOver:false,lastPhase:'day',saveClock:0,hudClock:0,coinEffects:[],frame:0,steps:[],M:{step(s,dt){sandbox.steps.push(dt);}},save(){},sync(){},renderWorld(){},requestAnimationFrame(){return 1;}};
 const code=source.slice(source.indexOf('    function loop(time){'),source.indexOf('    menuView();last=performance.now();'));
 vm.createContext(sandbox);vm.runInContext(code+'\nthis.tick=loop;',sandbox);return sandbox;
}
test('Cat advances ten real active seconds even at one animation frame per second',()=>{
 const r=runtime();for(let second=1;second<=10;second++)r.tick(second*1000);assert.equal(r.catState.age,10);assert.ok(Math.abs(r.clock-.5)<1e-9);assert.ok(r.steps.every(dt=>dt===.05));
 r.paused=true;r.tick(15000);assert.equal(r.catState.age,10);r.paused=false;r.tick(16000);assert.equal(r.catState.age,11);
});
