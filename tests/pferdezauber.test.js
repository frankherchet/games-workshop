'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/games/pferdezauber.js', 'utf8');
const sandbox = { globalThis: { Arcade: { games: {} } } };
vm.runInNewContext(fs.readFileSync('src/games/pferdezauber-world.js', 'utf8'), sandbox);
vm.runInNewContext(source, sandbox);
const logic = sandbox.globalThis.Arcade.pferdezauberLogic;

test('Pferdezauber starts in the selected game mode', () => {
  const horse = logic.newState('horseOnly');
  assert.equal(horse.mode, 'horseOnly');
  assert.equal(horse.player.form, 'horse');
  assert.equal(horse.active, 'player');
  const duo = logic.newState('duo');
  assert.equal(duo.mode, 'duo');
  assert.equal(duo.player.form, 'human');
  assert.equal(duo.companion.form, 'horse');
});

test('horse-only mode cannot switch to companion or human', () => {
  const state = logic.newState('horseOnly');
  assert.equal(logic.switchTarget(state), false);
  assert.equal(logic.transform(state), false);
  assert.equal(state.active, 'player');
  assert.equal(state.player.form, 'horse');
});

test('companion switching and magical transformation are separate', () => {
  const state = logic.newState('duo');
  assert.equal(logic.switchTarget(state), true);
  assert.equal(state.active, 'companion');
  assert.equal(logic.transform(state), true);
  assert.equal(state.player.form, 'horse');
  assert.equal(state.companion.form, 'horse');
  assert.equal(state.active, 'companion');
  assert.equal(logic.switchTarget(state), true);
  assert.equal(state.active, 'player');
  assert.equal(logic.transform(state), true);
  assert.equal(state.player.form, 'human');
  assert.equal(state.companion.form, 'horse');
});

test('collectible progress is local to each new game', () => {
  const state = logic.newState('duo');
  state.stars[0] = true;
  state.stars[2] = true;
  assert.equal(logic.collected(state), 2);
  assert.equal(logic.collected(logic.newState('duo')), 0);
});

test('the prototype registers an Arcade factory and has no runtime CDN', () => {
  assert.equal(typeof sandbox.globalThis.Arcade.games.pferdezauber, 'function');
  assert.doesNotMatch(source, /(?:src|href)=["']https?:\/\/|import\s*\(|require\s*\(/);
});


test('six unique horse options include foals, ponies and adult horses', () => {
  const catalog = logic.catalog;
  assert.equal(catalog.length, 6);
  assert.equal(new Set(catalog.map(h => h.id)).size, 6);
  assert.equal(catalog.filter(h => h.foal).length, 2);
  assert.equal(catalog.filter(h => h.pony).length, 2);
  assert.equal(catalog.filter(h => !h.foal && !h.pony).length, 2);
  for (const h of catalog) {
    assert.equal(h.coat.length, 3);
    assert.ok(h.size > 0 && h.size < 2);
    assert.ok(h.speed > 0);
    assert.ok(h.coat.every(c => c >= 0 && c <= 1));
  }
});

test('horse choices change the player and companion profile without changing play mode', () => {
  const pony = logic.newState('duo', 'shetland');
  assert.equal(pony.player.horseId, 'shetland');
  assert.equal(pony.companion.horseId, 'shetland');
  assert.equal(pony.player.form, 'human');
  logic.transform(pony);
  assert.equal(pony.player.form, 'horse');
  assert.equal(pony.player.horseId, 'shetland');
  assert.equal(logic.horseById('shetland').size < logic.horseById('haflinger').size, true);
});

test('foals remain playable in horse-only mode and never become an adult horse by switching', () => {
  const foal = logic.newState('horseOnly', 'foal-black');
  assert.equal(foal.player.horseId, 'foal-black');
  assert.equal(foal.player.form, 'horse');
  assert.equal(logic.horseById(foal.player.horseId).foal, true);
  assert.equal(logic.switchTarget(foal), false);
  assert.equal(logic.transform(foal), false);
  assert.equal(logic.horseById(foal.player.horseId).size < logic.horseById('friesian').size, true);
});

test('unknown horse id falls back to the default and does not escape validated catalog', () => {
  assert.equal(logic.newState('duo', 'some-invalid-id').companion.horseId, 'haflinger');
  assert.equal(logic.horseById('__proto__').id, 'haflinger');
});

function goToGoal(state) {
  const goal=logic.objective(state);
  const entity=state.active==='player'?state.player:state.companion;
  entity.x=goal.target.x; entity.z=goal.target.z;
  return logic.interact(state);
}

for (const mode of ['duo','horseOnly']) test(`Complete the adventure in ${mode}, including ability gates and reward`, () => {
  const state=logic.newState(mode,'foal-black');
  goToGoal(state);
  assert.equal(state.quest,'trail');
  for(let i=0;i<3;i++)goToGoal(state);
  assert.equal(state.quest,'foal');
  goToGoal(state);
  assert.equal(state.quest,'escort');
  // Lead the foal in short steps so it can keep up, rather than teleport it.
  const entity=state.player;
  const home={x:-9,z:7};
  for(let i=0;i<800 && Math.hypot(entity.x-home.x,entity.z-home.z)>.1;i++) {
    const dist=Math.hypot(entity.x-home.x,entity.z-home.z);
    entity.x+=(home.x-entity.x)/dist*.08;
    entity.z+=(home.z-entity.z)/dist*.08;
    logic.advanceFoal(state,.04);
  }
  logic.interact(state);
  assert.equal(state.quest,'stones');
  for(let i=0;i<3;i++) {
    const goal=logic.objective(state);
    entity.x=goal.target.x; entity.z=goal.target.z;
    if(goal.stone===1 && mode==='duo') {
      assert.match(logic.interact(state),/Hufe/);
      assert.equal(state.stars[1],false);
      logic.transform(state);
    }
    if(goal.stone===2) {
      assert.match(logic.interact(state),/Sprung/);
      assert.equal(state.stars[2],false);
      entity.jump=.3;
    }
    logic.interact(state);
    entity.jump=0;
  }
  assert.equal(state.quest,'source');
  assert.equal(logic.collected(state),3);
  goToGoal(state);
  assert.equal(state.quest,'complete');
  assert.equal(logic.objective(state).target,null);
  assert.equal(logic.interact(state),'');
});

test('Interactions require proximity and cannot skip the rescue or repeat a clue', () => {
  const state=logic.newState('duo');
  assert.match(logic.interact(state),/näher/);
  assert.equal(state.quest,'meet');
  goToGoal(state);
  goToGoal(state);
  assert.equal(state.trail,1);
  logic.interact(state);
  assert.equal(state.trail,1);
  assert.equal(logic.collected(state),0);
});

test('Lumi waits when left behind, resumes nearby, and must actually reach the stable', () => {
  const state=logic.newState('duo');
  state.quest='escort';
  const before={...state.foal};
  state.player.x=10; state.player.z=10;
  logic.advanceFoal(state,.04);
  assert.equal(state.foal.x,before.x);
  assert.equal(state.foal.z,before.z);
  assert.match(logic.objective(state).text,/wartet/);
  state.player.x=state.foal.x+3; state.player.z=state.foal.z;
  logic.advanceFoal(state,.04);
  assert.ok(state.foal.x>before.x);
  assert.match(logic.interact(state),/Wegweiser|Warte/);
  assert.equal(state.quest,'escort');
  logic.switchTarget(state);
  state.companion.x=state.foal.x+3; state.companion.z=state.foal.z;
  const x=state.foal.x;
  logic.advanceFoal(state,.04);
  assert.ok(state.foal.x>x);
  const fresh=logic.newState('duo');
  assert.equal(fresh.quest,'meet');
  assert.equal(fresh.trail,0);
  assert.equal(fresh.foal.x,-13);
});


test('human pace is user-selectable with walking, running and sprinting', () => {
  const s=logic.newState('duo','haflinger');
  assert.deepEqual(Array.from(logic.humanPaces, p=>p.label), ['Gehen','Rennen','Sprinten']);
  assert.equal(s.humanPace,1); // Running is the default, faster than old walking speed.
  assert.equal(logic.movementSpeed(s),5.2);
  assert.equal(logic.cycleHumanPace(s),true);
  assert.equal(s.humanPace,2);
  assert.equal(logic.movementSpeed(s),7.8);
  assert.equal(logic.cycleHumanPace(s),true);
  assert.equal(s.humanPace,0);
  assert.equal(logic.movementSpeed(s),2.8);
  assert.equal(logic.cycleHumanPace(s),true);
  assert.equal(logic.movementSpeed(s),5.2);
});

test('the separate horse can be controlled directly and the speed stays horse-specific', () => {
  const s=logic.newState('duo','friesian');
  assert.equal(logic.switchLabel(s),'🐎 Pferd spielen');
  const humanSpeed=logic.movementSpeed(s);
  assert.equal(logic.switchTarget(s),true);
  assert.equal(s.active,'companion');
  assert.equal(logic.switchLabel(s),'🧍 Mensch spielen');
  assert.equal(logic.movementSpeed(s),2.7*logic.horseById('friesian').speed);
  assert.equal(logic.cycleHumanPace(s),false);
  assert.equal(s.humanPace,1);
  s.gait=2;
  assert.equal(logic.movementSpeed(s),6.6*logic.horseById('friesian').speed);
  logic.switchTarget(s);
  assert.equal(logic.movementSpeed(s),humanSpeed);
});

test('the horse-only mode begins as a real controllable horse and never offers the human pace', () => {
  const s=logic.newState('horseOnly','foal-brown');
  assert.equal(s.player.form,'horse');
  assert.equal(logic.switchLabel(s),'');
  assert.equal(logic.cycleHumanPace(s),false);
  assert.equal(logic.movementSpeed(s),2.7*logic.horseById('foal-brown').speed);
  assert.equal(logic.switchTarget(s),false);
});

test('magic transformation is independent from controlling the companion horse', () => {
  const s=logic.newState('duo','welsh');
  logic.transform(s);
  assert.equal(logic.switchLabel(s),'🐎 Pferd spielen');
  assert.equal(logic.cycleHumanPace(s),false);
  logic.switchTarget(s);
  assert.equal(logic.switchLabel(s),'✨ Zauberpferd spielen');
  logic.switchTarget(s);
  logic.transform(s);
  assert.equal(logic.cycleHumanPace(s),true);
});

test('living world has three herds plus pony and foal groups', () => {
  const s=logic.newState('duo');
  const stats=logic.world.stats(s.ambient);
  assert.deepEqual({...stats},{horseHerds:3,horseGroups:5,horses:17,people:8,rabbits:6,birds:10});
  assert.equal(logic.world.groups.length,5);
  assert.equal(logic.world.groups[3].horses.includes('shetland'),true);
  assert.equal(logic.world.groups[4].horses.includes('foal-black'),true);
});

test('herd animals remain inside their pastures while moving', () => {
  const state=logic.newState('duo');
  const originalX=state.ambient.horses.map(p=>p.x);
  logic.world.tick(state.ambient,100,.1);
  const changed=state.ambient.horses.filter((p,i)=>Math.abs(p.x-originalX[i])>.05).length;
  assert.ok(changed>3);
  for(const p of state.ambient.horses) {
    const g=logic.world.groups[p.herd];
    assert.ok(Math.hypot(p.x-g.x,p.z-g.z)<=g.r+.00001,'horse stayed near the correct herd');
    assert.equal(p.form,'horse');
    assert.equal(p.kind,'horse');
  }
});

test('wandering people, rabbits and birds change position independently of the player', () => {
  const state=logic.newState('horseOnly','friesian');
  const before=state.ambient.people[0].x;
  const rabbit=state.ambient.rabbits[0].x;
  const bird=state.ambient.birds[0].x;
  logic.world.tick(state.ambient,13,.15);
  assert.notEqual(state.ambient.people[0].x,before);
  assert.notEqual(state.ambient.rabbits[0].x,rabbit);
  assert.notEqual(state.ambient.birds[0].x,bird);
  assert.equal(state.active,'player');
  assert.equal(state.player.form,'horse');
  assert.equal(state.quest,'meet');
});

test('solo quest resets independently of the wildlife and herd population', () => {
  const first=logic.newState('duo');
  const horse=first.ambient.horses[0];
  horse.x=1000;
  first.quest='escort';
  const second=logic.newState('duo');
  assert.equal(second.quest,'meet');
  assert.ok(second.ambient.horses[0].x<100);
  assert.equal(logic.world.stats(second.ambient).horses,17);
  assert.equal(logic.switchTarget(second),true);
  assert.equal(second.active,'companion');
});


test('a nearby human can mount an adult horse and dismount beside it', () => {
  const state=logic.newState('duo','friesian');
  const horse=state.companion;
  horse.x=state.player.x+1;horse.z=state.player.z+.3;
  assert.equal(logic.mountOrDismount(state),'mounted');
  assert.equal(state.mounted,true);
  assert.equal(state.active,'companion');
  assert.equal(state.player.form,'human');
  assert.equal(state.player.x,horse.x);
  assert.equal(state.player.z,horse.z);
  assert.equal(logic.movementSpeed(state),2.7*logic.horseById('friesian').speed);
  horse.x=10;horse.z=7;horse.heading=.7; // horse moved under control
  assert.equal(logic.mountOrDismount(state),'dismounted');
  assert.equal(state.active,'player');
  assert.equal(state.mounted,false);
  assert.equal(state.player.form,'human');
  assert.ok(Math.hypot(state.player.x-horse.x,state.player.z-horse.z)>1);
  assert.ok(Math.hypot(state.player.x-horse.x,state.player.z-horse.z)<2);
});

test('mounting requires the human to be within reach of their horse', () => {
  const state=logic.newState('duo','haflinger');
  state.companion.x=24;state.companion.z=26;
  assert.equal(logic.mountOrDismount(state),'tooFar');
  assert.equal(state.active,'player');
  assert.equal(state.mounted,false);
  state.companion.x=state.player.x+2.5;
  state.companion.z=state.player.z;
  assert.equal(logic.mountOrDismount(state),'mounted');
});

test('foals are not rideable, including when in a human-plus-foal mode', () => {
  for (const foal of ['foal-brown','foal-black']) {
    const state=logic.newState('duo',foal);
    state.companion.x=state.player.x;
    state.companion.z=state.player.z;
    assert.equal(logic.mountOrDismount(state),'foal');
    assert.equal(state.mounted,false);
    assert.equal(state.active,'player');
  }
  assert.equal(logic.mountOrDismount(logic.newState('horseOnly','haflinger')),'horseOnly');
});

test('pony can be ridden and transformation is blocked while seated', () => {
  const state=logic.newState('duo','shetland');
  state.companion.x=state.player.x;
  state.companion.z=state.player.z;
  assert.equal(logic.mountOrDismount(state),'mounted');
  assert.equal(logic.transform(state),false);
  assert.equal(state.player.form,'human');
  // Q while riding also dismounts instead of switching to a ground-level human.
  assert.equal(logic.switchTarget(state),true);
  assert.equal(state.mounted,false);
  assert.equal(state.active,'player');
  assert.equal(logic.transform(state),true);
  assert.equal(logic.mountOrDismount(state),'needHuman');
});

test('mounted rider does not alter the solo NPC world or rescue quest', () => {
  const state=logic.newState('duo','welsh');
  const count=logic.world.stats(state.ambient);
  state.companion.x=state.player.x;
  state.companion.z=state.player.z;
  assert.equal(logic.mountOrDismount(state),'mounted');
  assert.equal(state.quest,'meet');
  assert.deepEqual({...logic.world.stats(state.ambient)},{...count});
  assert.equal(logic.objective(state).title.includes('Fohlen'),true);
  assert.equal(logic.dismount(state),true);
  assert.equal(logic.dismount(state),false);
  assert.equal(state.quest,'meet');
});
