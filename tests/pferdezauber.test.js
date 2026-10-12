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
