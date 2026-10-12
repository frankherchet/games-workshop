const test=require('node:test');
const assert=require('node:assert/strict');
const {fit,create}=require('../src/fullscreen.js');

class Target{
  constructor(){this.listeners=new Map();}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  emit(name,event={}){for(const fn of this.listeners.get(name)||[])fn(event);}
}
function element(){
  const el=new Target();const classes=new Set(),properties=new Map();
  el.style={overflow:'',setProperty:(k,v)=>properties.set(k,v)};
  el.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)};
  el.properties=properties;el.attrs={};el.setAttribute=(k,v)=>{el.attrs[k]=v;};el.isConnected=true;
  el.focus=()=>{el.focused=true;};el.querySelectorAll=()=>[];el.contains=()=>false;
  return el;
}
function environment(){
  const doc=new Target(),win=new Target(),panel=element(),button=element(),stage=element();let rect={width:1280,height:620},queue=new Map(),id=0;
  doc.body=element();doc.body.style.overflow='scroll';doc.documentElement=element();doc.documentElement.style.overflow='auto';doc.activeElement=button;
  win.innerWidth=1280;win.innerHeight=800;win.scrollX=0;win.scrollY=245;win.visualViewport=new Target();win.visualViewport.width=1280;win.visualViewport.height=800;
  win.requestAnimationFrame=fn=>{queue.set(++id,fn);return id;};win.cancelAnimationFrame=id=>queue.delete(id);win.scrollTo=(x,y)=>{win.scrollX=x;win.scrollY=y;};
  stage.getBoundingClientRect=()=>rect;
  const controller=create({element:panel,button,stage,aspect:16/9,document:doc,window:win});
  return {doc,win,panel,button,stage,controller,setRect:value=>{rect=value;},flush(){const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn());}};
}

test('Canvas and Memory dimensions fit portrait, landscape and tablet viewports without cropping',()=>{
  for(const [width,height] of [[390,570],[844,190],[1024,580],[1366,720],[1920,950]])for(const aspect of [16/9,3/2,1]){
    const size=fit(width,height,aspect);assert.ok(size.width<=width&&size.height<=height);assert.ok(size.width>0&&size.height>0);
    assert.ok(Math.abs(size.width-size.height*aspect)<=aspect+1);
    assert.ok(width-size.width<aspect+1||height-size.height<2);
  }
  assert.deepEqual(fit(0,100,1),{width:0,height:0});assert.deepEqual(fit(100,100,NaN),{width:0,height:0});
});
test('Browsers without native fullscreen still enter and exit an accessible fitted view',()=>{
  const e=environment();e.button.emit('click');e.flush();assert.equal(e.controller.active,true);assert.equal(e.panel.classList.contains('game-fullscreen'),true);
  assert.equal(e.button.textContent,'Vollbild verlassen');assert.equal(e.button.attrs['aria-pressed'],'true');assert.equal(e.doc.body.style.overflow,'hidden');
  assert.equal(e.stage.properties.get('--fs-content-height'),'620px');
  e.button.emit('click');assert.equal(e.controller.active,false);assert.equal(e.doc.body.style.overflow,'scroll');assert.equal(e.doc.documentElement.style.overflow,'auto');assert.equal(e.win.scrollY,245);assert.equal(e.button.textContent,'Vollbild');e.controller.dispose();
});
test('A rejected native request preserves the usable fullscreen fallback',async()=>{
  const e=environment();e.panel.requestFullscreen=()=>Promise.reject(new Error('Not supported'));e.controller.enter();await Promise.resolve();await Promise.resolve();e.flush();
  assert.equal(e.controller.active,true);assert.equal(e.panel.classList.contains('game-fullscreen'),true);assert.equal(e.stage.properties.get('--fs-content-width'),'1102px');e.controller.dispose();
});
test('Native Escape/fullscreen exit restores the page and the button',async()=>{
  const e=environment();e.panel.requestFullscreen=()=>{e.doc.fullscreenElement=e.panel;e.doc.emit('fullscreenchange');return Promise.resolve();};e.controller.enter();await Promise.resolve();
  e.doc.fullscreenElement=null;e.doc.emit('fullscreenchange');assert.equal(e.controller.active,false);assert.equal(e.doc.body.style.overflow,'scroll');assert.equal(e.button.attrs['aria-pressed'],'false');e.controller.dispose();
});
test('Rotating or resizing refits to the newly available field size',()=>{
  const e=environment();e.controller.enter();e.flush();e.setRect({width:390,height:540});e.win.visualViewport.width=390;e.win.visualViewport.height=740;e.win.visualViewport.emit('resize');e.flush();
  assert.equal(e.stage.properties.get('--fs-content-width'),'390px');assert.equal(e.stage.properties.get('--fs-content-height'),'219px');assert.equal(e.panel.properties.get('--fs-viewport-height'),'740px');e.controller.dispose();
});
test('Fallback Escape exits without also triggering a game action',()=>{
  const e=environment();e.controller.enter();let prevented=false,stopped=false;e.doc.emit('keydown',{key:'Escape',preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
  assert.equal(e.controller.active,false);assert.equal(prevented,true);assert.equal(stopped,true);e.controller.dispose();
});
test('Leaving a game during a pending native request cannot reopen fullscreen later',async()=>{
  const e=environment();let resolve;e.panel.requestFullscreen=()=>new Promise(r=>{resolve=r;});e.doc.exitFullscreen=()=>{e.doc.fullscreenElement=null;return Promise.resolve();};
  e.controller.enter();e.controller.dispose();e.doc.fullscreenElement=e.panel;resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(e.controller.active,false);assert.equal(e.doc.fullscreenElement,null);assert.equal(e.doc.body.style.overflow,'scroll');assert.equal(e.panel.classList.contains('game-fullscreen'),false);
});
