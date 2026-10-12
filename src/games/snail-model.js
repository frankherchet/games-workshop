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
  const ITEMS = {
    pit: { name: 'Fanggrube', price: 12, description: 'Fängt 3 Schnecken. Hält 3 Nächte.', charges: 3, hp: 1, life: 3 },
    beer: { name: 'Bierfalle', price: 18, description: 'Lockt nahe Schnecken an. 4 Fänge, 3 Nächte.', charges: 4, hp: 1, life: 3 },
    fence: { name: 'Holzzaun', price: 14, description: 'Blockiert den Weg. Reparierbar; verfällt nach 5 Nächten.', charges: 0, hp: 55, life: 5 },
    electric: { name: 'Elektrozaun', price: 35, description: 'Tötet 5 Schnecken. Hält 4 Nächte.', charges: 5, hp: 1, life: 4 },
    copper: { name: 'Kupferband', price: 16, description: 'Verlangsamt Schnecken in seiner Nähe. 4 Nächte.', charges: 0, hp: 1, life: 4 },
    duck: { name: 'Laufente', price: 48, description: 'Jagt im Umkreis. Braucht pro Nacht eine Portion Futter.', charges: 0, hp: 1, life: 999 },
    food: { name: 'Entenfutter', price: 4, description: 'Eine Portion für eine Ente und eine Nacht.' }
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const price = (s, amount) => Math.ceil(amount * DIFFICULTIES[s.difficulty].price);
  const living = s => s.plots.filter(p => p.type);
  const lossLimit = s => 6 + Math.floor(s.nights / 2);
  const cooldown = s => Math.max(.35, DIFFICULTIES[s.difficulty].cooldown - s.haste * .18);
  const phaseName = s => s.over ? 'Runde beendet' : s.phase === 'night' ? 'Nacht' : s.dayTime < 60 ? 'Morgens' : s.dayTime < 120 ? 'Mittags' : 'Abends';

  const PLOT_COUNT=24;
  const plotPosition=i=>({x:310+(i%6)*52,y:245+Math.floor(i/6)*52});
  const expansionPrice=s=>55+Math.max(0,(s.plots.filter(p=>p.unlocked).length-6)/3)*15;
  function reward(s,amount,point){
    if(amount<=0)return;
    s.money+=amount;
    if(!Array.isArray(s.coinEvents))s.coinEvents=[];
    if(s.coinEvents.length<60)s.coinEvents.push({x:point.x,y:point.y,amount});
  }
  function newRun(level = 0, difficulty = 'medium', character = 'gardener') {
    if (!LEVELS[level] || !DIFFICULTIES[difficulty] || !['gardener', 'gardeneress', 'fox'].includes(character)) throw new Error('Invalid run settings');
    return {
      version: 2, level, difficulty, character, phase: 'day', dayTime: 0, nightTime: 0, nights: 0,
      money: DIFFICULTIES[difficulty].money, eaten: 0, dryLost: 0, kills: 0, damage: 1, haste: 0, cooldown: 0,
      player: { x: 465, y: 510, dx: 0, dy: -1 },
      plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({ ...plotPosition(i), unlocked: i < 6, type: i < 6 ? 'daisy' : null, hp: i < 6 ? 3 : 0, watered: false, dry: 0 })),
      inventory: { daisy: 3, tulip: 0, moon: 0, crystal: 0, pit: 0, beer: 0, fence: 0, electric: 0, copper: 0, duck: 0, food: 1 },
      coinEvents: [], structures: [], snails: [], spawned: 0, waveTotal: 0, spawnClock: 0, nextId: 1, over: false, reason: '',
      notice: 'Gieße deine sechs Sonnensterne. Der Stand steht oben rechts.', lastIncome: 0, lastAction: 0, attackFlash: 0
    };
  }
  function checkLoss(s) {
    if (!living(s).length) { s.over = true; s.reason = 'Dein Garten hat keine lebenden Pflanzen mehr.'; }
    else if (s.difficulty === 'hard' && s.eaten > lossLimit(s)) { s.over = true; s.reason = `Die Verlustgrenze von ${lossLimit(s)} gefressenen Pflanzen wurde überschritten.`; }
    return s.over;
  }
  function beginNight(s) {
    if (s.over || s.phase !== 'day') return false;
    s.phase = 'night'; s.nightTime = 0; s.spawned = 0; s.spawnClock = 2; s.snails = [];
    s.waveTotal = Math.ceil((5 + s.nights * 2 + s.level * 3) * DIFFICULTIES[s.difficulty].enemies);
    for (const item of s.structures) if (item.type === 'duck') {
      item.fed = s.inventory.food > 0;
      if (item.fed) s.inventory.food--;
    }
    s.notice = 'Die Schnecken kommen. Hacke bereit halten!';
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
    s.nights++; s.lastIncome = income; s.phase = 'day'; s.dayTime = 0;
    s.structures = s.structures.filter(item => ++item.age < ITEMS[item.type].life && item.hp > 0);
    s.notice = `Nacht ${s.nights} überlebt! Pflanzen bringen ${income} Münzen. Jetzt gießen und reparieren.`;
    checkLoss(s);
    return true;
  }
  function buy(s, id, unlockedLevel = s.level) {
    if (s.phase !== 'day' || s.over) return false;
    let cost;
    if (id === 'damage') { if (s.damage >= 4) return false; cost = price(s, 35 * s.damage); }
    else if (id === 'haste') { if (s.haste >= 4) return false; cost = price(s, 30 * (s.haste + 1)); }
    else if (id === 'expand') { if (s.plots.every(p => p.unlocked)) return false; cost = price(s, expansionPrice(s)); }
    else { const entry = PLANTS[id] || ITEMS[id]; if (!entry || (PLANTS[id] && entry.level > unlockedLevel)) return false; cost = price(s, entry.price); }
    if (s.money < cost) { s.notice = 'Dafür fehlen dir noch Münzen.'; return false; }
    s.money -= cost;
    if (id === 'damage') s.damage++;
    else if (id === 'haste') s.haste++;
    else if (id === 'expand') { let count = 0; for (const p of s.plots) if (!p.unlocked && count++ < 3) p.unlocked = true; }
    else s.inventory[id]++;
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
  function place(s, type, point) {
    if (s.phase !== 'day' || s.over || !ITEMS[type] || type === 'food' || !s.inventory[type]) return false;
    const snapped = { x: Math.round(point.x / 32) * 32, y: Math.round(point.y / 32) * 32 };
    if (dist(snapped, s.player) > 105 || snapped.x < 115 || snapped.x > 845 || snapped.y < 190 || snapped.y > 530 ||
      s.plots.some(p => p.unlocked && dist(p, snapped) < 34) || s.structures.some(t => dist(t, snapped) < 36)) {
      s.notice = 'Baue auf einem freien Weg nahe deiner Figur, nicht direkt auf dem Beet.'; return false;
    }
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
    snail.hp = 0; s.kills++; reward(s,snail.reward,snail);
  }
  function attack(s) {
    if (s.phase !== 'night' || s.over || s.cooldown > 0) return false;
    s.cooldown = cooldown(s); s.attackFlash = .22;
    const target = s.snails.filter(n => n.hp > 0 && dist(n, s.player) < 78 &&
      ((n.x - s.player.x) * s.player.dx + (n.y - s.player.y) * s.player.dy >= -8)).sort((a, b) => dist(a, s.player) - dist(b, s.player))[0];
    if (target) { const damage = s.damage; if (target.hp <= damage) kill(s, target); else target.hp -= damage; }
    return true;
  }
  function spawn(s, random = Math.random) {
    const tier = s.nights + s.level * 3;
    const roll = random();
    const type = tier >= 6 && roll > .75 ? 'giant' : tier >= 3 && roll > .55 ? 'armored' : tier >= 2 && roll < .24 ? 'fast' : 'normal';
    const stats = { normal: [1, 24, 2, 1], fast: [1, 40, 3, 1], armored: [3, 19, 4, 1], giant: [5, 16, 6, 2] }[type];
    const side = Math.floor(random() * 4), along = random();
    s.snails.push({ id: s.nextId++, type, x: side === 0 ? 55 : side === 1 ? 900 : 150 + along * 650,
      y: side === 2 ? 170 : side === 3 ? 580 : 215 + along * 290,
      hp: stats[0] + Math.floor(tier / 8), maxHp: stats[0] + Math.floor(tier / 8),
      speed: stats[1] * DIFFICULTIES[s.difficulty].speed, reward: stats[2], bite: stats[3], timer: 0, dx: 0, dy: 1 });
    s.spawned++;
  }
  function step(s, dt, input = {}, random = Math.random) {
    if (s.over) return;
    dt = Math.max(0, Math.min(dt, .05));
    s.cooldown = Math.max(0, s.cooldown - dt); s.attackFlash = Math.max(0, s.attackFlash - dt); s.lastAction = Math.max(0, s.lastAction - dt);
    let mx = input.x || 0, my = input.y || 0, length = Math.hypot(mx, my);
    if (length > 1) { mx /= length; my /= length; }
    if (length > .08) { s.player.dx = mx / Math.hypot(mx, my); s.player.dy = my / Math.hypot(mx, my); }
    s.player.x = Math.max(90, Math.min(870, s.player.x + mx * 165 * dt));
    s.player.y = Math.max(185, Math.min(555, s.player.y + my * 165 * dt));
    if (s.phase === 'day') { s.dayTime += dt; if (s.dayTime >= 180) beginNight(s); return; }
    s.nightTime += dt; s.spawnClock = Math.max(0, s.spawnClock - dt);
    if (s.spawned < s.waveTotal && s.spawnClock <= 0) { spawn(s, random); s.spawnClock = Math.max(1.25, 4 - s.nights * .14 - s.level * .25); }
    for (const item of s.structures) if (item.type === 'duck' && item.fed) {
      item.timer -= dt;
      const prey = s.snails.find(n => n.hp > 0 && dist(n, item) < 110);
      if (prey && item.timer <= 0) { if (prey.hp <= 1) kill(s, prey); else prey.hp--; item.timer = 1.2; }
    }
    for (const snail of s.snails) {
      if (snail.hp <= 0) continue;
      let plants = living(s); if (!plants.length) break;
      let target = plants.sort((a, b) => dist(a, snail) - dist(b, snail))[0];
      const lure = s.structures.find(t => t.type === 'beer' && t.charges > 0 && dist(t, snail) < 120);
      if (lure) target = lure;
      let blocked = false, multiplier = 1;
      for (const item of s.structures) {
        if (item.hp <= 0) continue;
        const distance = dist(item, snail);
        if (item.type === 'copper' && distance < 65) multiplier = .35;
        if (distance > 30) continue;
        if (['pit', 'beer', 'electric'].includes(item.type) && item.charges > 0) { item.charges--; kill(s, snail); if (!item.charges) item.hp = 0; break; }
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
          const victims = snail.type === 'giant' ? plants.filter(p => dist(p, target) <= 85) : [target];
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
        if (![1,2].includes(s.version) || s.level !== level || s.difficulty !== difficulty || !['gardener','gardeneress','fox'].includes(s.character) || !['day','night'].includes(s.phase)) continue;
        const finite = (obj, names) => names.every(k => typeof obj[k] === 'number' && Number.isFinite(obj[k]) && obj[k] >= 0 && obj[k] < 1e7);
        if (!finite(s, ['money','nights','eaten','dryLost','kills','damage','haste','cooldown','dayTime','nightTime','spawned','waveTotal','spawnClock','nextId','attackFlash','lastAction','lastIncome']) || s.damage < 1 || s.damage > 4 || s.haste > 4 || !Number.isInteger(s.nights) || s.waveTotal > 1000 || !s.player || !finite(s.player,['x','y']) || !Number.isFinite(s.player.dx) || !Number.isFinite(s.player.dy)) continue;
        if (!Array.isArray(s.plots) || s.plots.length !== (s.version===1?12:PLOT_COUNT) || !s.plots.every(p=>finite(p,['x','y','hp','dry']) && (p.type===null || PLANTS[p.type]) && typeof p.unlocked==='boolean' && typeof p.watered==='boolean')) continue;
        if (!s.inventory || !Object.keys({...PLANTS,...ITEMS}).every(k=>Number.isInteger(s.inventory[k]) && s.inventory[k]>=0 && s.inventory[k]<100000)) continue;
        if (!Array.isArray(s.structures) || s.structures.length>200 || !s.structures.every(t=>ITEMS[t.type] && t.type!=='food' && finite(t,['x','y','hp','charges','age','id']) && Number.isFinite(t.timer))) continue;
        if (!Array.isArray(s.snails) || s.snails.length>1000 || !s.snails.every(n=>['normal','fast','armored','giant'].includes(n.type) && finite(n,['x','y','hp','maxHp','speed','reward','bite','id']) && Number.isFinite(n.timer) && Number.isFinite(n.dx) && Number.isFinite(n.dy))) continue;
        if(s.version===1){
          // Retain existing plants, water, HP and unlocks; add empty expansion plots.
          const old=s.plots;
          s.plots=Array.from({length:PLOT_COUNT},(_,i)=>({...plotPosition(i),unlocked:false,type:null,hp:0,watered:false,dry:0,...(old[i]||{}),...plotPosition(i)}));
          s.version=2;
        }
        s.coinEvents=[]; // Effects are transient and never replay after restoring.
        s.over = Boolean(s.over); s.reason = typeof s.reason === 'string' ? s.reason.slice(0,250) : ''; s.notice = typeof s.notice === 'string' ? s.notice.slice(0,250) : '';
        result.runs[`${level}:${difficulty}`] = s;
      }
      return result;
    } catch { return null; }
  }
  const model = { PLOT_COUNT, expansionPrice, LEVELS, DIFFICULTIES, PLANTS, ITEMS, dist, price, living, lossLimit, cooldown, phaseName, newRun, beginNight, finishNight, buy, tend, place, repair, attack, spawn, step, campaign, record, parseSave };
  root.SnailModel = model;
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
})(globalThis);
