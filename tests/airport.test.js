const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/games/airport-config.js');
const M=require('../src/games/airport-model.js');

test('48 stages across four progressively harder worlds',()=>{
  assert.equal(C.TOTAL,48);
  assert.deepEqual(C.LEVELS.map(x=>x.name),['Provinz','Insel','Stadt','Wüstenstadt']);
  for(let i=0;i<C.TOTAL;i++){
    const cfg=C.stageConfig(i);
    assert.equal(cfg.stage,i%12+1);
    assert.equal(cfg.level,Math.floor(i/12));
    assert.equal(cfg.airfieldCount,Math.ceil(cfg.stage/3));
    assert.ok(cfg.requiredLandings>0);
    assert.ok(cfg.initialSpawnInterval>cfg.minimumSpawnInterval);
    assert.deepEqual(cfg.world.types,C.LEVELS[cfg.level].types);
  }
  assert.deepEqual(C.LEVELS.map(x=>x.types.length),[2,3,4,5]);
  assert.ok(C.stageConfig(11).initialSpawnInterval<C.stageConfig(0).initialSpawnInterval);
  for(let level=0;level<4;level++)for(let stage=1;stage<12;stage++){
    const previous=C.stageConfig(level*12+stage-1);
    const next=C.stageConfig(level*12+stage);
    assert.ok(next.initialSpawnInterval<=previous.minimumSpawnInterval,
      'Spawn interval must not become longer after advancing one stage');
  }
  assert.throws(()=>C.stageConfig(48),RangeError);
});

test('five aircraft classes have distinct speeds, sizes and landing types',()=>{
  const names=['PrivatePlane','Airliner','LargeAirliner','Helicopter','MilitaryJet'];
  const types=['private','airliner','large','helicopter','jet'];
  const planes=names.map((name,i)=>new M[name](i,50,50,0));
  assert.deepEqual(planes.map(p=>p.type),types);
  assert.equal(new Set(planes.map(p=>p.speed)).size,5);
  assert.ok(planes.every(p=>p.radius>0&&p.turnRate>0));
  assert.deepEqual(planes.map(p=>p.zoneType),['civil','civil','civil','helipad','military']);
});

test('strict runway compatibility with no required runway length',()=>{
  const zones=[new M.CivilRunway(0,0,0),new M.MilitaryRunway(0,0,0),new M.Helipad(0,0)];
  for(const key of Object.keys(C.AIRCRAFT)){
    const p=new M.Aircraft(key,1,100,100,0);
    assert.deepEqual(zones.map(z=>z.accepts(p)),[p.zoneType==='civil',p.zoneType==='military',p.zoneType==='helipad']);
  }
});

test('stage generator is deterministic and has safe airfield layouts',()=>{
  for(let i=0;i<48;i++){
    const cfg=C.stageConfig(i),generator=new M.StageGenerator();
    const a=generator.generate(cfg,123456),b=generator.generate(cfg,123456);
    assert.deepEqual(a.airfields,b.airfields);
    assert.equal(a.airfields.length,cfg.airfieldCount);
    for(const field of a.airfields){
      assert.ok(field.x>100&&field.x<C.WIDTH-100);
      assert.ok(field.y>90&&field.y<C.HEIGHT-90);
    }
    for(const p of a.airfields)for(const q of a.airfields)if(p!==q)assert.ok(M.distance(p,q)>150);
    for(const type of cfg.world.types){
      assert.ok(a.zones.some(z=>z.type===C.AIRCRAFT[type].zone));
    }
  }
  const a=new M.StageGenerator().generate(C.stageConfig(11),5);
  const b=new M.StageGenerator().generate(C.stageConfig(11),6);
  assert.notDeepEqual(a.airfields,b.airfields);
});

test('all spawn directions appear, north cannot repeat, spawn positions vary',()=>{
  const a=new M.TrafficSpawner(new M.StageGenerator().generate(C.stageConfig(47),221));
  const seen=new Set(),north=[],xs=[],ys=[];
  let last=null;
  for(let i=0;i<250;i++){
    const p=a.spawn([]);
    const d=a.lastSpawnDirection;seen.add(d);
    assert.ok(!(d==='N'&&last==='N'));last=d;
    if(d==='N'){assert.equal(p.y,-2);xs.push(p.x);}
    if(d==='S')assert.equal(p.y,C.HEIGHT+2);
    if(d==='W'){assert.equal(p.x,-2);ys.push(p.y);}
    if(d==='E')assert.equal(p.x,C.WIDTH+2);
  }
  assert.equal(seen.size,4);
  assert.ok(new Set(xs.map(Math.floor)).size>20);
  assert.ok(new Set(ys.map(Math.floor)).size>20);
  assert.ok(a.history.every(item=>C.LEVELS[3].types.includes(item.type)));
});

test('temporarily blocked entry keeps the same predetermined spawn candidate',()=>{
  const instance=new M.StageGenerator().generate(C.stageConfig(0),555);
  const a=new M.TrafficSpawner(instance);
  const reference=new M.TrafficSpawner(instance);
  const expected=reference.spawn([]);
  const blocker=new M.PrivatePlane(123,expected.x,expected.y,0);
  assert.equal(a.spawn([blocker]),null);
  assert.equal(a.history.length,0);
  const actual=a.spawn([]);
  assert.deepEqual({x:actual.x,y:actual.y,type:actual.type},
    {x:expected.x,y:expected.y,type:expected.type});
});

test('seed preserves spawn sequence and dynamic intervals have a lower bound',()=>{
  const instance=new M.StageGenerator().generate(C.stageConfig(7),42);
  const a=new M.TrafficSpawner(instance),b=new M.TrafficSpawner(instance);
  for(let i=0;i<20;i++)assert.deepEqual(a.spawn([]),b.spawn([]));
  const initial=a.interval();a.elapsed=1000;
  assert.ok(a.interval()<initial);
  assert.equal(a.interval(),instance.config.minimumSpawnInterval);
});

test('missed aircraft immediately fails the stage; retry costs one star',()=>{
  const cfg=C.stageConfig(0),s=new M.GameSession(cfg,7);
  s.spawner.nextSpawnAt=999;
  const a=new M.PrivatePlane(10,C.WIDTH+50,100,0);
  a.entered=true;s.aircraft.push(a);
  s.step(.05);
  assert.equal(s.status,'failed');assert.equal(s.failureReason,'AIRCRAFT_ESCAPED');
  assert.equal(s.attempts.possibleStars,2);
  const firstSeed=s.instance.seed;
  s.retry();assert.equal(s.instance.seed,firstSeed);
  assert.equal(s.attempts.possibleStars,2);
  assert.equal(s.landings,0);assert.equal(s.status,'playing');
  s.fail('AIRCRAFT_ESCAPED');assert.equal(s.attempts.possibleStars,1);
  s.fail('AIRCRAFT_ESCAPED');assert.equal(s.attempts.possibleStars,1);
  s.retry();s.fail('AIRCRAFT_ESCAPED');assert.equal(s.attempts.possibleStars,0);
  s.regenerate(987);assert.equal(s.instance.seed,987);assert.equal(s.attempts.possibleStars,3);
});

test('a collision immediately ends the stage with its own reason',()=>{
  const s=new M.GameSession(C.stageConfig(0),1);
  s.spawner.nextSpawnAt=999;
  const a=new M.PrivatePlane(1,400,300,0),b=new M.Airliner(2,409,300,0);
  a.entered=true;b.entered=true;s.aircraft=[a,b];
  s.step(.03);assert.equal(s.status,'failed');
  assert.equal(s.failureReason,'AIRCRAFT_COLLISION');
});

test('valid routed landing succeeds; wrong zone does not score',()=>{
  const s=new M.GameSession(C.stageConfig(47),456);
  s.spawner.nextSpawnAt=999;
  const civil=s.instance.zones.find(z=>z.type==='civil');
  const helipad=s.instance.zones.find(z=>z.type==='helipad');
  const a=new M.PrivatePlane(1,civil.x,civil.y,0);
  a.entered=true;a.setPath([{x:civil.x+8,y:civil.y}]);s.aircraft=[a];
  s.step(.025);assert.equal(s.landings,1);assert.equal(s.aircraft.length,0);
  const wrong=new M.PrivatePlane(2,helipad.x,helipad.y,0);
  wrong.entered=true;wrong.setPath([{x:helipad.x+8,y:helipad.y}]);
  s.aircraft=[wrong];s.step(.025);assert.equal(s.landings,1);
  assert.equal(s.aircraft.length,1);
});

test('successful goal ends the stage, prevents further movement or spawns',()=>{
  const s=new M.GameSession(C.stageConfig(0),31);
  s.spawner.nextSpawnAt=999;
  const zone=s.instance.zones[0];
  for(let i=0;i<s.config.requiredLandings;i++){
    const plane=new M.PrivatePlane(i,zone.x,zone.y,0);
    plane.entered=true;plane.setPath([{x:zone.x+8,y:zone.y}]);
    s.aircraft=[plane];s.step(.025);
  }
  assert.equal(s.landings,s.config.requiredLandings);
  assert.equal(s.status,'won');
  const elapsed=s.elapsed;s.step(5);assert.equal(s.elapsed,elapsed);
});

test('0-star completions still unlock, previous earned stars remain immutable',()=>{
  const p=new M.ProgressManager();
  assert.equal(p.unlocked,0);assert.equal(p.canPlay(1),false);
  assert.equal(p.record(0,0),true);assert.equal(p.unlocked,1);
  assert.equal(p.record(0,3),false);assert.equal(p.completed[0],0);
  assert.equal(p.record(1,2),true);assert.equal(p.unlocked,2);
  const loaded=new M.ProgressManager(JSON.parse(JSON.stringify(p.serialize())));
  assert.deepEqual(loaded.completed.slice(0,3),[0,2,null]);
  assert.equal(loaded.totalStars,2);
  const tampered=p.serialize();tampered.completed[2]=99;
  assert.equal(new M.ProgressManager(tampered).unlocked,2);
});

test('flight paths turn at bounded rate and can be replaced mid-flight',()=>{
  const p=new M.PrivatePlane(1,150,200,0);
  p.setPath([{x:150,y:50}]);p.move(.05);
  assert.ok(Math.abs(p.heading)<=p.turnRate*.05+1e-9);
  p.setPath([{x:300,y:200}]);assert.equal(p.path.points.length,1);
  assert.equal(p.hasRoute,true);
});
