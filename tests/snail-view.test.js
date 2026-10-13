const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/games/snail-model.js'),V=require('../src/games/snail-view.js');
test('Immersive camera fills every screen shape and keeps the player visible at garden edges',()=>{
 for(const [w,h]of [[1536,1024],[1363,936],[390,844],[844,390],[1920,1080]])for(const p of [{x:90,y:185},{x:870,y:555},{x:465,y:510}]){
  const v=V.camera(w,h,p,true),a=V.project(v,{x:0,y:0}),b=V.project(v,{x:960,y:640}),player=V.project(v,p);
  assert.ok(a.x<=.0001&&a.y<=.0001);assert.ok(b.x>=w-.0001&&b.y>=h-.0001);assert.ok(player.x>0&&player.x<w&&player.y>0&&player.y<h);
  assert.equal(v.scale,Math.max(w/960,h/640));
 }
});
test('Touch positions still select the same world plant after camera movement, fullscreen and rotation',()=>{
 const p={x:362,y:245};for(const immersive of [false,true])for(const [w,h]of [[1536,1024],[390,844],[844,390]]){
  const v=V.camera(w,h,{x:395,y:280},immersive),point=V.unproject(v,V.project(v,p));assert.ok(Math.abs(point.x-p.x)<1e-8&&Math.abs(point.y-p.y)<1e-8);
 }
});
test('A nearby unwatered flower is offered first and the icon moves on after watering',()=>{
 const s=M.newRun();s.player={x:336,y:270,dx:0,dy:-1};let near=V.nearby(s);assert.ok(near.flower);assert.equal(near.shop,false);const first=near.flower.index;
 assert.equal(M.tend(s,s.plots[first]),true);near=V.nearby(s);assert.notEqual(near.flower.index,first);assert.equal(near.flower.watered,false);
 s.player.x=90;s.player.y=555;assert.equal(V.nearby(s).flower,null);
});
test('Shop popup uses the same reachable radius as shopping and disappears at night or after defeat',()=>{
 const s=M.newRun();s.player={x:835,y:200,dx:0,dy:-1};assert.equal(V.nearby(s).shop,true);assert.equal(V.nearby(s).flower,null);
 s.player.x=600;assert.equal(V.nearby(s).shop,false);s.player.x=835;s.phase='night';assert.deepEqual(V.nearby(s),{flower:null,shop:false});s.phase='day';s.over=true;assert.equal(V.nearby(s).shop,false);
});

test('Planting mode offers a reachable empty bed instead of a planted flower',()=>{
 const s=M.newRun();s.player={x:336,y:270,dx:0,dy:1};const p=V.nearby(s,'seed').flower;assert.ok(p);assert.equal(p.type,null);assert.equal(p.unlocked,true);assert.equal(M.plant(s,s.plots[p.index]),true);assert.notEqual(V.nearby(s,'seed').flower?.index,p.index);
});
test('iPad shop prompt is moved below the measured fullscreen button',()=>{
 const full={left:1286,top:136,right:1517,bottom:211},p=V.promptPosition({x:1330,y:190},{width:160,height:56},{width:1536,height:1067},[full]);assert.ok(p.top>=full.bottom+10);assert.ok(p.left+p.width<=1536-10);
 for(const [w,h]of [[390,844],[844,390],[1536,1067]]){const blocker={left:w-170,top:72,right:w-14,bottom:130},r=V.promptPosition({x:w-50,y:160},{width:150,height:48},{width:w,height:h},[blocker]);assert.ok(r.left>=0&&r.top>=0&&r.left+r.width<=w&&r.top+r.height<=h);assert.ok(r.left+r.width<=blocker.left||r.left>=blocker.right||r.top+r.height<=blocker.top||r.top>=blocker.bottom);}
});
