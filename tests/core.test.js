const test = require('node:test');
const assert = require('node:assert/strict');
const { clamp, overlaps, shuffle, movePlayer } = require('../src/core.js');
test('Player lands on a platform after falling and can leave its edge', () => {
  const platform={x:0,y:100,w:120,h:20}; const player={x:30,y:45,w:20,h:30,vx:0,vy:100};
  for(let i=0;i<20;i++)movePlayer(player,[platform],.016);
  assert.equal(player.y,70);assert.equal(player.vy,0);assert.equal(player.grounded,true);
  player.vx=300;for(let i=0;i<25;i++)movePlayer(player,[platform],.016);
  assert.equal(player.grounded,false);assert.ok(player.y>70);
});
test('Upward movement stops at the underside of a platform', () => {
  const player={x:30,y:126,w:20,h:30,vx:0,vy:-400};
  movePlayer(player,[{x:0,y:100,w:120,h:20}],.025);
  assert.equal(player.y,120);assert.equal(player.vy,0);
});
test('Movement cannot pass through a wall', () => {
  const player={x:60,y:20,w:20,h:30,vx:400,vy:0};
  movePlayer(player,[{x:85,y:0,w:30,h:150}],.025);
  assert.equal(player.x,65);
});
test('Memory shuffle preserves eight pairs without mutating the original', () => {
  const deck=[...Array(8).keys(),...Array(8).keys()];const result=shuffle(deck,()=>.25);
  assert.notDeepEqual(result,deck);assert.deepEqual([...result].sort(),[...deck].sort());
  for(let i=0;i<8;i++)assert.equal(result.filter(n=>n===i).length,2);
});
test('Collision and screen bounds handle touching edges', () => {
  assert.equal(overlaps({x:0,y:0,w:10,h:10},{x:10,y:0,w:10,h:10}),false);
  assert.equal(overlaps({x:0,y:0,w:10,h:10},{x:9,y:9,w:10,h:10}),true);
  assert.equal(clamp(-1,0,100),0);assert.equal(clamp(101,0,100),100);
});
test('Runner level jumps bridge every gap at normal movement speed',()=>{
  const platforms=[{x:0,y:455,w:480,h:85},{x:575,y:420,w:290,h:120},{x:965,y:380,w:270,h:160},{x:1340,y:435,w:280,h:105},{x:1720,y:385,w:260,h:155},{x:2070,y:440,w:310,h:100},{x:2455,y:390,w:440,h:150}];
  for(let i=0;i<platforms.length-1;i++){
    const current=platforms[i],next=platforms[i+1],player={x:current.x+current.w-40,y:current.y-40,w:30,h:40,vx:280,vy:-560,grounded:false};let landed=false;
    for(let frame=0;frame<150;frame++){movePlayer(player,[current,next],1/120);if(player.grounded&&player.x>=next.x-30){landed=true;break;}}
    assert.ok(landed,`Jump ${i+1} must reach the next platform`);
  }
});
