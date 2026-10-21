(function (root) {
  'use strict';
  const LEVELS = [
    { name: 'Bauerngarten', subtitle: 'Zwischen Sonnenhut und alten Apfelbäumen', unlock: 5, ground: '#6e994e', soil: '#866043' },
    { name: 'Waldgarten', subtitle: 'Wo Pilze leuchten und die Hecken flüstern', unlock: 10, ground: '#527849', soil: '#69543e' },
    { name: 'Schlossgarten', subtitle: 'Seltene Blüten hinter verwitterten Mauern', unlock: null, ground: '#627966', soil: '#76644f' }
  ];
  const DIFFICULTIES = {
    easy: { label: 'Leicht', price: .8, enemies: .8, speed: .85, cooldown: .9, money: 90 },
    medium: { label: 'Mittel', price: 1, enemies: 1, speed: 1, cooldown: 1.1, money: 70 },
    hard: { label: 'Schwer', price: 1.15, enemies: 1.2, speed: 1.1, cooldown: 1.25, money: 65 }
  };
  const PLANTS = {
    daisy: { name: 'Sonnenstern', price: 5, yield: 2, hp: 3, color: '#ffe48e', rarity: 'Häufig', level: 0 },
    tulip: { name: 'Feentulpe', price: 14, yield: 5, hp: 4, color: '#f294bc', rarity: 'Ungewöhnlich', level: 0 },
    moon: { name: 'Mondlilie', price: 30, yield: 10, hp: 5, color: '#b9adf4', rarity: 'Selten', level: 1 },
    crystal: { name: 'Kristallrose', price: 55, yield: 17, hp: 6, color: '#92e5ea', rarity: 'Sehr selten', level: 2 }
  };
  const WEAPONS={
    hoe:{name:'Hacke',price:0,range:78,factor:1,bonus:0,targets:1,description:'Deine bewährte Hacke. Ein Ziel pro Schlag.'},
    rake:{name:'Gartenrechen',price:48,range:92,factor:1.4,bonus:0,targets:2,description:'Trifft bis zu zwei Schnecken vor dir. Größere Reichweite, längerer Cooldown.'},
    mallet:{name:'Eichenkeule',price:72,range:66,factor:1.6,bonus:2,targets:1,description:'Zwei Zusatzschaden. Kurze Reichweite und langsamer Schlag.'},
    sickle:{name:'Dornen-Sichel',price:90,range:72,factor:.75,bonus:0,targets:1,description:'Schnelle Einzelschläge. Etwas weniger Reichweite als die Hacke.'}
  };
  const ITEMS = {
    pit: { name: 'Fanggrube', price: 12, description: 'Fängt 3 Schnecken. Hält 3 Nächte.', charges: 3, hp: 1, life: 3 },
    beer: { name: 'Bierfalle', price: 18, description: 'Lockt nahe Schnecken an. 4 Fänge, 3 Nächte.', charges: 4, hp: 1, life: 3 },
    fence: { name: 'Holzzaun', price: 14, description: 'Blockiert den Weg. Reparierbar; verfällt nach 5 Nächten.', charges: 0, hp: 55, life: 5 },
    electric: { name: 'Elektrozaun', price: 35, description: 'Tötet 5 Schnecken. Hält 4 Nächte.', charges: 5, hp: 1, life: 4 },
    copper: { name: 'Kupferband', price: 16, description: 'Verlangsamt Schnecken in seiner Nähe. 4 Nächte.', charges: 0, hp: 1, life: 4 },
    duck: { name: 'Laufente', price: 48, description: 'Verfolgt Schnecken im Garten und pickt aus der Nähe. Braucht pro Nacht eine Portion Futter.', charges: 0, hp: 1, life: 999 },
    thorn:{name:'Dornenfalle',price:24,description:'Verletzt Schnecken bei Kontakt. 6 Treffer, 4 Nächte.',charges:6,hp:1,life:4},
    resin:{name:'Harztopf',price:26,description:'Verlangsamt Schnecken im Umkreis stark. 3 Nächte.',charges:0,hp:1,life:3},
    lantern:{name:'Köderlaterne',price:32,description:'Lockt weit entfernte Schnecken an. Fängt 3 Schnecken, 3 Nächte.',charges:3,hp:1,life:3},
    food: { name: 'Entenfutter', price: 4, description: 'Eine Portion für eine Ente und eine Nacht.' }
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const price = (s, amount) => Math.ceil(amount * DIFFICULTIES[s.difficulty].price);
  const living = s => s.plots.filter(p => p.type);
  const lossLimit = s => 6 + Math.floor(s.nights / 2);
  const cooldown = s => Math.max(.35, (DIFFICULTIES[s.difficulty].cooldown - s.haste * .18)*(WEAPONS[s.weapon||'hoe']?.factor||1));
  const phaseName = s => s.over ? 'Runde beendet' : s.phase === 'night' ? 'Nacht' : s.dayTime < 60 ? 'Morgens' : s.dayTime < 120 ? 'Mittags' : 'Abends';

  const PLOT_COUNT=24;
  const plotPosition=i=>({x:310+(i%6)*52,y:245+Math.floor(i/6)*52});
  const expansionPrice=s=>55+Math.max(0,(s.plots.filter(p=>p.unlocked).length-9)/3)*15;
  function reward(s,amount,point){
    if(amount<=0)return;
    s.money+=amount;
    if(!Array.isArray(s.coinEvents))s.coinEvents=[];
    if(s.coinEvents.length<60)s.coinEvents.push({x:point.x,y:point.y,amount});
  }
  function newRun(level = 0, difficulty = 'medium', character = 'gardener') {
    if (!LEVELS[level] || !DIFFICULTIES[difficulty] || !['gardener', 'gardeneress', 'fox'].includes(character)) throw new Error('Invalid run settings');
    return {
      version: 4, level, difficulty, character, phase: 'day', dayTime: 0, nightTime: 0, nights: 0,
      weapon: 'hoe', money: DIFFICULTIES[difficulty].money, eaten: 0, dryLost: 0, kills: 0, damage: 1, haste: 0, cooldown: 0,
      player: { x: 465, y: 510, dx: 0, dy: -1 },
      plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({ ...plotPosition(i), unlocked: i < 9, type: i < 6 ? 'daisy' : null, hp: i < 6 ? 3 : 0, watered: false, dry: 0 })),
      inventory: { hoe:1,rake:0,mallet:0,sickle:0,thorn:0,resin:0,lantern:0,daisy: 3, tulip: 0, moon: 0, crystal: 0, pit: 0, beer: 0, fence: 0, electric: 0, copper: 0, duck: 0, food: 1 },
      bossAttacks: [], coinEvents: [], structures: [], snails: [], spawned: 0, waveTotal: 0, spawnClock: 0, nextId: 1, over: false, reason: '',
      notice: 'Gieße deine sechs Sonnensterne. Der Stand steht oben rechts.', lastIncome: 0, lastAction: 0, attackFlash: 0
    };
  }
  function checkLoss(s) {
    if (!living(s).length) { s.over = true; s.reason = 'Dein Garten hat keine lebenden Pflanzen mehr.'; }
    else if (s.difficulty === 'hard' && s.eaten > lossLimit(s)) { s.over = true; s.reason = `Die Verlustgrenze von ${lossLimit(s)} gefressenen Pflanzen wurde überschritten.`; }
    return s.over;
  }
  const BOSS_DESIGNS=['Lavaglut-Nacktschnecke','Sturmritter-Nacktschnecke','Waldhüter-Nacktschnecke','Sternennebel-Nacktschnecke','Sumpfgift-Nacktschnecke','Kristall-Nacktschnecke','Moospanzer','Kristallpanzer','Inferno-König','Galaxienpanzer','Vulkanpanzer','Gewitterpanzer','Pestfürst','Sumpfpanzer'];
  const BOSS_THEMES=['lava','storm','forest','cosmic','poison','crystal','forest','crystal','infernal','cosmic','lava','storm','poison','poison'];
  const BOSS_ATTACKS={lava:'Lavakugel',storm:'Blitzschlag',forest:'Dornenranken',cosmic:'Sternenfall',poison:'Gifttümpel',crystal:'Kristallsplitter',infernal:'Flammenrune'};
  const isBossNight=s=>(s.nights+1)%5===0;
  function bossStats(s){
    const rank=Math.floor((s.nights+1)/5),factor=s.difficulty==='easy'?.8:s.difficulty==='hard'?1.2:1;
    return {rank,hp:Math.ceil((12+Math.max(0,rank-1)*9+s.level*4)*factor),speed:(13+Math.min(rank,8)*.5)*DIFFICULTIES[s.difficulty].speed,reward:10+rank*3,bite:2+Math.floor(rank/2)};
  }
  function beginNight(s) {
    if (s.over || s.phase !== 'day') return false;
    s.bossAttacks=[];s.phase = 'night'; s.nightTime = 0; s.spawned = 0; s.spawnClock = 2; s.snails = [];
    s.waveTotal = Math.ceil((5 + s.nights * 2 + s.level * 3) * DIFFICULTIES[s.difficulty].enemies)+(isBossNight(s)?1:0);
    for (const item of s.structures) if (item.type === 'duck') {
      item.fed = item.preFed === true || s.inventory.food > 0;
      if (item.fed && !item.preFed) s.inventory.food--;
      item.preFed = false;
    }
    s.notice = isBossNight(s)?`Bossnacht ${s.nights+1}! Der Schneckenkönig Stufe ${bossStats(s).rank} kommt am Ende der Welle.`:'Die Schnecken kommen. Hacke bereit halten!';
    return true;
  }
  function finishNight(s) {
    if (s.over || s.phase !== 'night' || s.spawned < s.waveTotal || s.snails.length) return false;
    let income = 0;
    for (const p of living(s)) {
      if (p.watered) { const amount=PLANTS[p.type].yield; income += amount; reward(s,amount,p); p.dry = 0; }
      else { p.dry++; if (p.dry >= 2) { p.type = null; p.hp = 0; s.dryLost++; } }
      p.watered = false;
    }
    s.bossAttacks=[];s.nights++; s.lastIncome = income; s.phase = 'day'; s.dayTime = 0;
    s.structures = s.structures.filter(item => ++item.age < ITEMS[item.type].life && item.hp > 0);
    for (const item of s.structures) if (item.type === 'duck') item.fed = false;
    s.notice = `Nacht ${s.nights} überlebt! Pflanzen bringen ${income} Münzen. Jetzt gießen und reparieren.`;
    checkLoss(s);
    return true;
  }
  function buy(s, id, unlockedLevel = s.level) {
    if (s.phase !== 'day' || s.over) return false;
    if(WEAPONS[id]&&s.inventory[id]){s.weapon=id;s.notice=WEAPONS[id].name+' ausgerüstet.';return true;}
    let cost;
    if (id === 'damage') { if (s.damage >= 4) return false; cost = price(s, 35 * s.damage); }
    else if (id === 'haste') { if (s.haste >= 4) return false; cost = price(s, 30 * (s.haste + 1)); }
    else if (id === 'expand') { if (s.plots.every(p => p.unlocked)) return false; cost = price(s, expansionPrice(s)); }
    else { const entry = PLANTS[id] || ITEMS[id] || WEAPONS[id]; if (!entry || (PLANTS[id] && entry.level > unlockedLevel)) return false; cost = price(s, entry.price); }
    if (s.money < cost) { s.notice = 'Dafür fehlen dir noch Münzen.'; return false; }
    s.money -= cost;
    if (id === 'damage') s.damage++;
    else if (id === 'haste') s.haste++;
    else if (id === 'expand') { let count = 0; for (const p of s.plots) if (!p.unlocked && count++ < 3) p.unlocked = true; }
    else {s.inventory[id]++;if(WEAPONS[id])s.weapon=id;}
    s.notice = id === 'expand' ? 'Drei neue Pflanzplätze sind bereit. Kaufe Samen und pflanze sie ein.' : 'Einkauf verstaut. Samen und Fallen kannst du jetzt auswählen.';
    return true;
  }
  function tend(s, point, seed = 'daisy') {
    if (s.over || s.phase !== 'day') return false;
    const p = s.plots.filter(p => p.unlocked).sort((a, b) => dist(a, point) - dist(b, point))[0];
    if (!p || dist(p, point) > 48 || dist(p, s.player) > 100) { s.notice = 'Gehe näher an einen Pflanzplatz heran.'; return false; }
    if (p.type) {
      p.watered = true; p.hp = PLANTS[p.type].hp; s.notice = `${PLANTS[p.type].name} gegossen. Erholt und bereit für die Nacht.`;
    } else {
      if (!PLANTS[seed] || !s.inventory[seed]) { s.notice = 'Du brauchst passende Samen vom Stand.'; return false; }
      s.inventory[seed]--; p.type = seed; p.hp = PLANTS[seed].hp; p.watered = true; p.dry = 0; s.notice = `${PLANTS[seed].name} gepflanzt und gegossen.`;
    }
    s.lastAction = .35; return true;
  }
  function plant(s,point,seed='daisy'){
    if(s.over||s.phase!=='day')return false;
    const p=s.plots.slice().sort((a,b)=>dist(a,point)-dist(b,point))[0];
    if(!p||dist(p,point)>40||dist(p,s.player)>100){s.notice=s.plots.some(p=>p.unlocked&&!p.type)?'Gehe näher an ein leeres Erdbeet heran.':'Alle offenen Beete sind belegt. Erweitere den Garten am Stand.';return false;}
    if(!p.unlocked){s.notice='Dieser Platz ist gesperrt. Kaufe am Stand eine Gartenerweiterung.';return false;}
    if(p.type){s.notice='Dieser Platz ist bereits bepflanzt. Wähle ein leeres Erdbeet.';return false;}
    return tend(s,p,seed);
  }
  function duckFed(s,item) { return s.phase === 'night' ? item.fed === true : item.preFed === true; }
  function feedDuck(s,id) {
    if (s.over) return false;
    const item=s.structures.find(t=>t.id===id&&t.type==='duck'&&t.hp>0);
    if (!item || dist(item,s.player)>100) { s.notice='Gehe näher an die Laufente heran.'; return false; }
    if (duckFed(s,item)) { s.notice='Diese Laufente ist für diese Nacht schon gefüttert.'; return false; }
    if (!(s.inventory.food>0)) { s.notice='Futter fehlt. Kaufe eine Portion am Stand.'; return false; }
    s.inventory.food--; item.fed=true; item.preFed=s.phase==='day';
    s.notice=s.phase==='night'?'Laufente gefüttert – sie jagt jetzt Schnecken!':'Laufente gefüttert und für die kommende Nacht bereit.';
    return true;
  }
  function feedAllDucks(s) {
    if(s.over)return false;
    const hungry=s.structures.filter(t=>t.type==='duck'&&t.hp>0&&!duckFed(s,t));
    if(!hungry.length){s.notice='Alle Laufenten sind bereits gefüttert.';return false;}
    if(s.inventory.food<hungry.length){s.notice=`Du brauchst ${hungry.length} Portionen Futter. Vorrat: ${s.inventory.food}. Kaufe Futter am Stand.`;return false;}
    s.inventory.food-=hungry.length;
    for(const duck of hungry){duck.fed=true;duck.preFed=s.phase==='day';}
    s.notice=`${hungry.length} Laufenten gefüttert – ${s.phase==='night'?'sie jagen jetzt Schnecken!':'für die kommende Nacht bereit.'}`;
    return true;
  }
  function placement(s,point,ignore=null) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    const snapped={x:Math.round(point.x/32)*32,y:Math.round(point.y/32)*32};
    if (dist(snapped,s.player)>105 || snapped.x<115 || snapped.x>845 || snapped.y<190 || snapped.y>530 ||
      s.plots.some(p=>p.unlocked&&dist(p,snapped)<34) || s.structures.some(t=>t!==ignore&&dist(t,snapped)<36)) {
      s.notice='Wähle einen freien Platz nahe deiner Figur, mit Abstand zu Beeten und anderen Fallen.'; return null;
    }
    return snapped;
  }
  function relocate(s,id,point) {
    if (s.over || s.phase!=='day') return false;
    const item=s.structures.find(t=>t.id===id&&t.type!=='duck'&&t.hp>0);
    if (!item || dist(item,s.player)>105) { s.notice='Gehe näher an die Falle heran, um sie umzustellen.'; return false; }
    const destination=placement(s,point,item); if (!destination) return false;
    Object.assign(item,destination); s.notice=ITEMS[item.type].name+' umgestellt.'; return true;
  }
  function place(s, type, point) {
    if (s.phase !== 'day' || s.over || !ITEMS[type] || type === 'food' || !s.inventory[type]) return false;
    const snapped = placement(s,point);
    if (!snapped) return false;
    s.inventory[type]--; const item = ITEMS[type];
    s.structures.push({ id: s.nextId++, type, ...snapped, hp: item.hp, charges: item.charges, age: 0, fed: false, timer: 0 });
    s.notice = `${item.name} aufgestellt.`; return true;
  }
  function repair(s, point) {
    if (s.phase !== 'day' || s.over) return false;
    const item = s.structures.find(t => t.type === 'fence' && dist(t, point) < 45 && dist(t, s.player) < 100);
    if (!item) { s.notice = 'Gehe zu einem beschädigten Holzzaun.'; return false; }
    if (item.hp >= ITEMS.fence.hp) { s.notice = 'Dieser Zaun ist noch intakt.'; return false; }
    const cost = price(s, 5); if (s.money < cost) { s.notice = 'Die Reparatur kostet fünf Münzen, je nach Modus angepasst.'; return false; }
    s.money -= cost; item.hp = ITEMS.fence.hp; item.age = 0; s.notice = 'Holzzaun repariert.'; return true;
  }
  function kill(s, snail) {
    if (snail.hp <= 0) return;
    snail.hp = 0;if(snail.type==='boss')s.bossAttacks=(s.bossAttacks||[]).filter(a=>a.source!==snail.id); s.kills++; reward(s,snail.reward,snail);
  }
  function attack(s) {
    if (s.phase !== 'night' || s.over || s.cooldown > 0) return false;
    s.cooldown = cooldown(s); s.attackFlash = .22;
    const weapon=WEAPONS[s.weapon||'hoe']||WEAPONS.hoe;
    const targets=s.snails.filter(n=>n.hp>0&&dist(n,s.player)<weapon.range&&((n.x-s.player.x)*s.player.dx+(n.y-s.player.y)*s.player.dy>=-8)).sort((a,b)=>dist(a,s.player)-dist(b,s.player)).slice(0,weapon.targets);
    for(const target of targets){const damage=s.damage+weapon.bonus;if(target.hp<=damage)kill(s,target);else target.hp-=damage;}
    return true;
  }
  function spawn(s, random = Math.random) {
    const tier = s.nights + s.level * 3;
    const roll = random();
    const boss=isBossNight(s)&&s.spawned===s.waveTotal-1,bossData=boss?bossStats(s):null;
    const type = boss?'boss':tier >= 6 && roll > .75 ? 'giant' : tier >= 3 && roll > .55 ? 'armored' : tier >= 2 && roll < .24 ? 'fast' : 'normal';
    const stats = { normal: [1, 24, 2, 1], fast: [1, 40, 3, 1], armored: [3, 19, 4, 1], giant: [5, 16, 6, 2],boss:bossData?[bossData.hp,bossData.speed,bossData.reward,bossData.bite]:null }[type];
    const side = Math.floor(random() * 4), along = random();
    s.snails.push({ id: s.nextId++, type, x: side === 0 ? 55 : side === 1 ? 900 : 150 + along * 650,
      y: side === 2 ? 170 : side === 3 ? 580 : 215 + along * 290,
      hp: stats[0] + (boss?0:Math.floor(tier / 8)), maxHp: stats[0] + (boss?0:Math.floor(tier / 8)),
      speed: stats[1] * (boss?1:DIFFICULTIES[s.difficulty].speed), reward: stats[2], bite: stats[3], timer: 0, dx: 0, dy: 1 });
    if(boss){s.snails[s.snails.length-1].skillClock=8;s.snails[s.snails.length-1].bossDesign=Math.max(0,Math.min(BOSS_DESIGNS.length-1,Math.floor(random()*BOSS_DESIGNS.length)));}
    s.spawned++;if(boss)s.notice=`Der Schneckenkönig ist da! Stufe ${bossData.rank} · ${bossData.hp} Lebenspunkte.`;
  }
  function bossAttackPattern(s,boss,target){
    const theme=BOSS_THEMES[boss.bossDesign||0],rank=bossStats(s).rank,damage=1+Math.floor(rank/3);
    const make=(dx,dy,radius,warning=1.8,extra={})=>({x:Math.max(115,Math.min(845,target.x+dx)),y:Math.max(190,Math.min(530,target.y+dy)),fromX:boss.x,fromY:boss.y,source:boss.id,theme,timer:warning,warning,age:0,hit:false,damage,radius,hold:1.2,pulses:1,nextTick:0,...extra});
    if(theme==='storm')return [-48,0,48].map(dx=>make(dx,0,19,1.8));
    if(theme==='forest')return [make(0,0,55,2,{hold:3.5})];
    if(theme==='poison')return [make(0,0,42,2,{hold:3,pulses:3,damage:damage/3})];
    if(theme==='crystal')return [-1,0,1].map((side,i)=>make(side*42,Math.abs(side)*24,21,1.8+i*.2));
    if(theme==='cosmic')return [make(0,0,65,2.8)];
    if(theme==='infernal')return [[0,0],[-52,0],[52,0],[0,-52],[0,52]].map(([dx,dy])=>make(dx,dy,19,2.3));
    return [make(0,0,55,1.8)];
  }
  function updateBossAttacks(s,dt,random){
    if(!Array.isArray(s.bossAttacks))s.bossAttacks=[];
    for(const a of s.bossAttacks){
      a.age+=dt;a.timer-=dt;
      const pulses=a.pulses===undefined?(a.hit?0:1):a.pulses;
      if(pulses>0&&a.timer<=(a.nextTick||0)){
        a.hit=true;a.pulses=pulses-1;a.nextTick=(a.nextTick||0)-1;
        for(const p of living(s))if(dist(p,a)<=a.radius){p.hp=Math.max(0,p.hp-a.damage);if(p.hp<=0){p.type=null;s.eaten++;}}
        for(const t of s.structures)if(t.type!=='duck'&&dist(t,a)<=a.radius)t.hp=Math.max(0,t.hp-a.damage*5);
      }
    }
    s.bossAttacks=s.bossAttacks.filter(a=>a.timer> -(a.hold||1.2)&&s.snails.some(n=>n.id===a.source&&n.hp>0));
    for(const boss of s.snails){
      if(boss.type!=='boss'||boss.hp<=0)continue;
      boss.skillClock=(Number.isFinite(boss.skillClock)?boss.skillClock:8)-dt;
      if(boss.skillClock>0)continue;
      const plants=living(s);if(!plants.length)continue;
      const target=plants[Math.min(plants.length-1,Math.max(0,Math.floor(random()*plants.length)))],theme=BOSS_THEMES[boss.bossDesign||0];
      const rank=bossStats(s).rank;
      s.bossAttacks.push(...bossAttackPattern(s,boss,target));
      boss.skillClock=Math.max(7,13-rank*.35);s.notice=`${BOSS_ATTACKS[theme]}! Achte auf die markierten Stellen im Garten.`;
    }
  }
  function updateDucks(s,dt){
    for(const item of s.structures){
      if(item.type!=='duck')continue;
      if(!Number.isFinite(item.homeX))item.homeX=item.x;if(!Number.isFinite(item.homeY))item.homeY=item.y;
      item.homeX=Math.max(115,Math.min(845,item.homeX));item.homeY=Math.max(190,Math.min(530,item.homeY));
      item.timer=Math.max(0,(item.timer||0)-dt);
      const prey=s.phase==='night'&&item.fed?s.snails.filter(n=>n.hp>0).sort((a,b)=>dist(a,item)-dist(b,item))[0]:null;
      const destination=prey||{x:item.homeX+(s.phase==='day'?Math.sin(s.dayTime*.55+item.id)*15:0),y:item.homeY+(s.phase==='day'?Math.cos(s.dayTime*.4+item.id)*10:0)};
      const distance=dist(item,destination),stop=prey?22:1,speed=prey?90:24;
      item.dx=0;item.dy=0;
      if(distance>stop){item.dx=(destination.x-item.x)/distance;item.dy=(destination.y-item.y)/distance;const travel=Math.min(distance-stop,speed*dt);item.x=Math.max(90,Math.min(870,item.x+item.dx*travel));item.y=Math.max(175,Math.min(575,item.y+item.dy*travel));}
      if(prey&&dist(item,prey)<=24&&item.timer<=0){if(prey.hp<=1)kill(s,prey);else prey.hp--;item.timer=1.2;}
    }
  }
  function step(s, dt, input = {}, random = Math.random) {
    if (s.over) return;
    dt = Math.max(0, Math.min(dt, .05));
    s.cooldown = Math.max(0, s.cooldown - dt); s.attackFlash = Math.max(0, s.attackFlash - dt); s.lastAction = Math.max(0, s.lastAction - dt);
    let mx = input.x || 0, my = input.y || 0, length = Math.hypot(mx, my);
    if (length > 1) { mx /= length; my /= length; }
    if (length > .08) { s.player.dx = mx / Math.hypot(mx, my); s.player.dy = my / Math.hypot(mx, my); }
    const hazardSlow=(s.bossAttacks||[]).some(a=>a.theme==='forest'&&a.hit&&dist(a,s.player)<=a.radius)?.55:1;
    s.player.x = Math.max(90, Math.min(870, s.player.x + mx * 165 * hazardSlow * dt));
    s.player.y = Math.max(185, Math.min(555, s.player.y + my * 165 * hazardSlow * dt));
    if (s.phase === 'day') { s.dayTime += dt;updateDucks(s,dt); if (s.dayTime >= 180) beginNight(s); return; }
    s.nightTime += dt; s.spawnClock = Math.max(0, s.spawnClock - dt);
    if (s.spawned < s.waveTotal && s.spawnClock <= 0) { spawn(s, random); s.spawnClock = Math.max(1.25, 4 - s.nights * .14 - s.level * .25); }
    for(const item of s.structures)if(['thorn','pit','beer','electric','lantern'].includes(item.type))item.timer=Math.max(0,(item.timer||0)-dt);
    updateDucks(s,dt);updateBossAttacks(s,dt,random);
    for (const snail of s.snails) {
      if (snail.hp <= 0) continue;
      let plants = living(s); if (!plants.length) break;
      let target = plants.sort((a, b) => dist(a, snail) - dist(b, snail))[0];
      const lure = s.structures.find(t => ['beer','lantern'].includes(t.type) && t.charges > 0 && dist(t, snail) < (t.type==='lantern'?170:120));
      if (lure) target = lure;
      let blocked = false, multiplier = 1;
      for (const item of s.structures) {
        if (item.hp <= 0) continue;
        const distance = dist(item, snail);
        if (item.type === 'copper' && distance < 65) multiplier = Math.min(multiplier,.35);
        if(item.type==='resin'&&distance<75)multiplier=Math.min(multiplier,.2);
        if (distance > 30) continue;
        if (['pit', 'beer', 'electric','lantern'].includes(item.type) && item.charges > 0) {
          if(snail.type==='boss'){
            if(item.timer>0)continue;item.charges--;item.timer=.9;const damage=item.type==='electric'?4:item.type==='pit'?3:2;
            if(snail.hp<=damage)kill(s,snail);else snail.hp-=damage;if(!item.charges)item.hp=0;
          }else{item.charges--;kill(s,snail);if(!item.charges)item.hp=0;}
          break;
        }
        if(item.type==='thorn'&&item.charges>0&&item.timer<=0){item.charges--;item.timer=1.1;if(snail.hp<=1)kill(s,snail);else snail.hp--;if(!item.charges)item.hp=0;}
        if (item.type === 'fence') { blocked = true; item.hp = Math.max(0, item.hp - dt * (5 + snail.bite * 3)); }
      }
      if (snail.hp <= 0 || blocked) continue;
      const distance = dist(snail, target);
      if (distance > 24) {
        snail.dx = (target.x - snail.x) / distance; snail.dy = (target.y - snail.y) / distance;
        snail.x += snail.dx * snail.speed * multiplier * dt; snail.y += snail.dy * snail.speed * multiplier * dt;
      } else if (!lure) {
        snail.timer -= dt;
        if (snail.timer <= 0) {
          const victims = ['giant','boss'].includes(snail.type) ? plants.filter(p => dist(p, target) <= 85) : [target];
          for (const p of victims) { p.hp = Math.max(0, p.hp - snail.bite); if (p.hp <= 0) { p.type = null; s.eaten++; } }
          snail.timer = 2.6;
        }
      }
    }
    s.snails = s.snails.filter(n => n.hp > 0); s.structures = s.structures.filter(t => t.hp > 0);
    if (!checkLoss(s)) finishNight(s);
  }
  function campaign() { return { version: 1, unlocked: 0, best: [0, 0, 0], runs: {} }; }
  function record(c, s) {
    c.best[s.level] = Math.max(c.best[s.level], s.nights);
    if (s.level < 2 && s.nights >= LEVELS[s.level].unlock) c.unlocked = Math.max(c.unlocked, s.level + 1);
    c.runs[`${s.level}:${s.difficulty}`] = s;
    return c;
  }
  function parseSave(raw) {
    try {
      const c = JSON.parse(raw);
      if (c.version !== 1 || !Number.isInteger(c.unlocked) || c.unlocked < 0 || c.unlocked > 2 || !Array.isArray(c.best) || c.best.length !== 3 || !c.best.every(n => Number.isInteger(n) && n >= 0 && n < 100000) || !c.runs || typeof c.runs !== 'object') return null;
      const result = campaign(); result.unlocked = c.unlocked; result.best = c.best;
      for (let level = 0; level <= c.unlocked; level++) for (const difficulty of Object.keys(DIFFICULTIES)) {
        const s = c.runs[`${level}:${difficulty}`]; if (!s) continue;
        if (![1,2,3,4].includes(s.version) || s.level !== level || s.difficulty !== difficulty || !['gardener','gardeneress','fox'].includes(s.character) || !['day','night'].includes(s.phase)) continue;
        const finite = (obj, names) => names.every(k => typeof obj[k] === 'number' && Number.isFinite(obj[k]) && obj[k] >= 0 && obj[k] < 1e7);
        if (!finite(s, ['money','nights','eaten','dryLost','kills','damage','haste','cooldown','dayTime','nightTime','spawned','waveTotal','spawnClock','nextId','attackFlash','lastAction','lastIncome']) || s.damage < 1 || s.damage > 4 || s.haste > 4 || !Number.isInteger(s.nights) || s.waveTotal > 1000 || !s.player || !finite(s.player,['x','y']) || !Number.isFinite(s.player.dx) || !Number.isFinite(s.player.dy)) continue;
        if (!Array.isArray(s.plots) || s.plots.length !== (s.version===1?12:PLOT_COUNT) || !s.plots.every(p=>finite(p,['x','y','hp','dry']) && (p.type===null || PLANTS[p.type]) && typeof p.unlocked==='boolean' && typeof p.watered==='boolean')) continue;
        if(s.version<4&&s.inventory){for(const id of ['hoe','rake','mallet','sickle','thorn','resin','lantern'])if(s.inventory[id]===undefined)s.inventory[id]=id==='hoe'?1:0;}
        s.weapon=s.weapon||'hoe';if(!WEAPONS[s.weapon]||!s.inventory?.[s.weapon])continue;
        if (!s.inventory || !Object.keys({...PLANTS,...ITEMS,...WEAPONS}).every(k=>Number.isInteger(s.inventory[k]) && s.inventory[k]>=0 && s.inventory[k]<100000)) continue;
        if (!Array.isArray(s.structures) || s.structures.length>200 || !s.structures.every(t=>ITEMS[t.type] && t.type!=='food' && finite(t,['x','y','hp','charges','age','id']) && Number.isFinite(t.timer))) continue;
        if (!Array.isArray(s.snails) || s.snails.length>1000 || !s.snails.every(n=>['normal','fast','armored','giant','boss'].includes(n.type) && (n.type!=='boss'||n.bossDesign===undefined||(Number.isInteger(n.bossDesign)&&n.bossDesign>=0&&n.bossDesign<BOSS_DESIGNS.length)) && finite(n,['x','y','hp','maxHp','speed','reward','bite','id']) && Number.isFinite(n.timer) && Number.isFinite(n.dx) && Number.isFinite(n.dy))) continue;
        if(s.version===1){
          // Retain existing plants, water, HP and unlocks; add empty expansion plots.
          const old=s.plots;
          s.plots=Array.from({length:PLOT_COUNT},(_,i)=>({...plotPosition(i),unlocked:false,type:null,hp:0,watered:false,dry:0,...(old[i]||{}),...plotPosition(i)}));
          s.version=2;
        }
        if(s.version<3){let open=s.plots.filter(p=>p.unlocked).length;for(const p of s.plots)if(open<9&&!p.unlocked&&!s.structures.some(t=>dist(t,p)<34)){p.unlocked=true;open++;}s.version=3;}
        if(s.bossAttacks===undefined)s.bossAttacks=[];
        if(!Array.isArray(s.bossAttacks)||s.bossAttacks.length>12||!s.bossAttacks.every(a=>finite(a,['x','y','fromX','fromY','source','age','damage','radius'])&&a.radius<=100&&a.damage<=100000&&BOSS_ATTACKS[a.theme]&&Number.isFinite(a.timer)&&a.timer>=-5&&a.timer<=4&&typeof a.hit==='boolean'&&['hold','warning','pulses'].every(k=>a[k]===undefined||(Number.isFinite(a[k])&&a[k]>=0&&a[k]<=5))&&(a.nextTick===undefined||(Number.isFinite(a.nextTick)&&a.nextTick>=-3&&a.nextTick<=0))))continue;
        if(s.snails.some(n=>n.type==='boss'&&n.skillClock!==undefined&&(!Number.isFinite(n.skillClock)||n.skillClock<0||n.skillClock>30)))continue;
        s.version=4;for(const n of s.snails)if(n.type==='boss'&&n.bossDesign===undefined)n.bossDesign=0;
        s.coinEvents=[]; // Effects are transient and never replay after restoring.
        s.over = Boolean(s.over); s.reason = typeof s.reason === 'string' ? s.reason.slice(0,250) : ''; s.notice = typeof s.notice === 'string' ? s.notice.slice(0,250) : '';
        result.runs[`${level}:${difficulty}`] = s;
      }
      return result;
    } catch { return null; }
  }
  const model = { PLOT_COUNT, expansionPrice, WEAPONS, LEVELS, DIFFICULTIES, PLANTS, ITEMS, dist, price, living, lossLimit, cooldown, phaseName, BOSS_THEMES, BOSS_ATTACKS, BOSS_DESIGNS, isBossNight, bossStats, bossAttackPattern, newRun, beginNight, finishNight, buy, tend, plant, place, duckFed, feedDuck, feedAllDucks, relocate, repair, attack, spawn, step, campaign, record, parseSave };
  root.SnailModel = model;
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
})(globalThis);

