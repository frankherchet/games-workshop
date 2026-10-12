'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/games/pferdezauber.js', 'utf8');
const sandbox = { globalThis: { Arcade: { games: {} } } };
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
