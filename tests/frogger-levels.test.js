const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../src/games/frogger-levels.js');
const M=require('../src/games/frogger-model.js');
function solve(level){
  let states=[M.create(level)];
  for(let tick=0;tick<350&&states.length;tick++){
    const next=new Map();
    for(const s of states)for(const [dx,dy]of [[0,1],[1,0],[-1,0],[0,-1],[0,0]]){
      const n={...s,player:{...s.player},collected:[...s.collected]};
      if(dx||dy)M.move(n,dx,dy);
      if(n.status==='won')return n;
      M.step(n,.2);
      if(n.status==='won')return n;
      if(n.status!=='playing')continue;
      const key=`${Math.round(n.player.x*10)},${n.player.y},${n.rescued},${n.portalLock}`;
      if(!next.has(key))next.set(key,n);
    }
    states=[...next.values()];
  }
  return null;
}
test('level identifiers, boundaries, pickups and rescue positions are valid',()=>{
  assert.equal(new Set(D.levels.map(l=>l.id)).size,D.levels.length);
  for(const l of D.levels){
    assert.equal(l.rows[0].kind,'safe');assert.equal(l.rows.at(-1).kind,'safe');assert.equal(l.flies.length,3);
    assert.ok(l.goal>=0&&l.goal<D.WIDTH);
    for(const f of [...l.flies,...(l.friend?[l.friend]:[])]){
      assert.ok(Number.isInteger(f.x)&&f.x>=0&&f.x<D.WIDTH);assert.ok(f.y>=0&&f.y<l.rows.length);
      assert.equal(l.rows[f.y].kind,'safe','Pickups and rescue have a safe waiting surface');
    }
  }
});
for(const l of D.levels)test(`${l.id} ${l.name}: timed route including required rescue exists`,()=>{
  const won=solve(l);assert.ok(won,`No route found for ${l.id}`);assert.equal(won.status,'won');assert.ok(!l.friend||won.rescued);
});
