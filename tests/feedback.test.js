const {test}=require('node:test');
const assert=require('node:assert/strict');
const {context}=require('../src/feedback');
test('feedback captures the game and build without query strings or saved data',()=>{
  const win={location:{pathname:'/',hash:'#spiel/test',search:'?token=private'},navigator:{userAgent:'Test browser',language:'de'},innerWidth:320,innerHeight:640,devicePixelRatio:2};
  const result=context(win,[{id:'test',title:'Testspiel'}],'abc123');
  assert.equal(result.game,'Testspiel (test)');
  assert.equal(result.page,'/#spiel/test');
  assert.equal(result.viewport,'320 × 640');
  assert.equal(result.build,'abc123');
  assert.ok(!JSON.stringify(result).includes('private'));
  win.location.hash='#secret=private';
  assert.equal(context(win,[],'abc').page,'/');
  win.location.hash='#alle';
  assert.equal(context(win,[],'abc').game,'Spieleübersicht');
});
