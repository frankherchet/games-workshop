(function (root) {
  'use strict';

  // The prototype intentionally uses native WebGL: no CDN, no game server or
  // Node.js is needed to play it on the ALL-INKL webspace.
  const MODES = ['duo', 'horseOnly'];
  const SPEEDS = [2.7, 4.4, 6.6];
  const OUTFITS = Object.freeze([
    {id:'helmet',label:'Reithelm & Jacke',shirt:[.40,.39,.70],hat:'helmet',pants:[.30,.36,.46]},
    {id:'cowboy',label:'Westernhut & Weste',shirt:[.60,.38,.23],hat:'cowboy',pants:[.36,.47,.60]},
    {id:'cap',label:'Kappe & Sportjacke',shirt:[.20,.63,.57],hat:'cap',pants:[.26,.39,.51]}
  ]);
  const OUTFIT_MAP=Object.fromEntries(OUTFITS.map(o=>[o.id,o]));
  function outfitById(id){return Object.prototype.hasOwnProperty.call(OUTFIT_MAP,id)?OUTFIT_MAP[id]:OUTFITS[0];}
  const HUMAN_PACES = Object.freeze([
    { label:'Gehen', speed:2.8 },
    { label:'Rennen', speed:5.2 },
    { label:'Sprinten', speed:7.8 }
  ]);
  // Procedurally drawn horse variants; no external models or network requests.
  const HORSE_CATALOG = Object.freeze([
    { id:'foal-brown', name:'Braunes Fohlen', group:'Fohlen', detail:'Neugierig und verspielt', size:0.57, speed:0.79, coat:[.62,.35,.22], mane:[.30,.19,.16], muzzle:[.75,.56,.48], foal:true },
    { id:'foal-black', name:'Schwarzes Fohlen', group:'Fohlen', detail:'Kleiner Wirbelwind', size:0.60, speed:0.81, coat:[.20,.22,.26], mane:[.11,.13,.17], muzzle:[.38,.37,.39], foal:true },
    { id:'shetland', name:'Shetlandpony', group:'Ponys', detail:'Klein und kompakt', size:0.70, speed:0.87, coat:[.55,.35,.22], mane:[.22,.17,.14], muzzle:[.70,.54,.42], pony:true },
    { id:'welsh', name:'Welsh-Pony', group:'Ponys', detail:'Flink mit hellem Fell', size:0.83, speed:0.94, coat:[.78,.78,.72], mane:[.57,.55,.51], muzzle:[.83,.79,.75], pony:true },
    { id:'haflinger', name:'Haflinger', group:'Großpferde', detail:'Goldfuchs mit heller Mähne', size:1.00, speed:1.00, coat:[.82,.54,.27], mane:[.96,.84,.58], muzzle:[.91,.75,.60] },
    { id:'friesian', name:'Friese', group:'Großpferde', detail:'Groß und elegant in Schwarz', size:1.16, speed:1.05, coat:[.17,.21,.25], mane:[.09,.12,.15], muzzle:[.30,.32,.35] }
  ]);
  const HORSES = Object.fromEntries(HORSE_CATALOG.map(h => [h.id,h]));
  const DEFAULT_HORSE = 'haflinger';
  function horseById(id) { return Object.prototype.hasOwnProperty.call(HORSES,id) ? HORSES[id] : HORSES[DEFAULT_HORSE]; }
  function newState(mode, horseId=DEFAULT_HORSE, outfitId='helmet') {
    return {
      mode: MODES.includes(mode) ? mode : 'duo',
      player: { x: 0, z: -1, heading: 0, form: mode === 'horseOnly' ? 'horse' : 'human', horseId: horseById(horseId).id, outfitId: outfitById(outfitId).id, jump: 0, walk: 0 },
      companion: { x: 1.7, z: -2.5, heading: 0, form: 'horse', horseId: horseById(horseId).id, jump: 0, walk: 0 },
      active: 'player', gait: 0, humanPace: 1, following: true, leading: false, mounted: false, stars: [false, false, false],
      quest: 'meet', trail: 0, foal: { x: -13, z: -12, heading: 0, form: 'horse', horseId: 'foal-brown', jump: 0, walk: 0 },
      ambient: root.Arcade.pferdezauberWorld.create(),
    };
  }
  function dismount(s) {
    if (!s.mounted) return false;
    const horse=s.companion, side=1.45;
    s.player.x=Math.max(-29,Math.min(29,horse.x+Math.cos(horse.heading)*side));
    s.player.z=Math.max(-29,Math.min(29,horse.z-Math.sin(horse.heading)*side));
    s.player.heading=horse.heading;
    s.player.jump=0;
    s.mounted=false;
    s.active='player';
    return true;
  }
  function mountOrDismount(s) {
    if(s.mode!=='duo')return 'horseOnly';
    if(s.mounted) { dismount(s); return 'dismounted'; }
    if(s.player.form!=='human')return 'needHuman';
    if(horseById(s.companion.horseId).foal)return 'foal';
    if(Math.hypot(s.player.x-s.companion.x,s.player.z-s.companion.z)>2.8)return 'tooFar';
    s.leading=false;
    s.mounted=true;
    s.active='companion';
    s.player.x=s.companion.x; s.player.z=s.companion.z;
    s.player.heading=s.companion.heading;
    return 'mounted';
  }
  function switchTarget(s) {
    if (s.mode !== 'duo') return false;
    if (s.mounted) return dismount(s);
    s.leading=false;
    s.active = s.active === 'player' ? 'companion' : 'player';
    return true;
  }
  function transform(s) {
    if (s.mode !== 'duo' || s.mounted || s.leading) return false;
    s.player.form = s.player.form === 'human' ? 'horse' : 'human';
    return true;
  }
  function collected(s) { return s.stars.filter(Boolean).length; }
  const STABLE = { x: -9, z: 7 };
  const KEEPER = { x: -7, z: 3, heading: 2.5, form: 'human', walk: 0, jump: 0 };
  const TRAIL = [{ x: -4, z: 1 }, { x: -6, z: -4 }, { x: -10, z: -8 }];
  const STONES = [{ x: 5, z: 5 }, { x: -8, z: 8 }, { x: 13, z: -10 }];
  const SOURCE = { x: 10, z: -5 };
  function controlled(s) { return s.active === 'player' ? s.player : s.companion; }
  function cycleHumanPace(s) {
    if (controlled(s).form !== 'human') return false;
    s.humanPace = (s.humanPace + 1) % HUMAN_PACES.length;
    return true;
  }
  function movementSpeed(s) {
    const entity = controlled(s);
    return entity.form === 'human' ? HUMAN_PACES[s.humanPace].speed : SPEEDS[s.gait] * horseById(entity.horseId).speed;
  }
  function toggleLead(s) {
    if(s.mode!=='duo')return 'horseOnly';
    if(s.leading) {
      s.leading=false;
      s.following=false; // Released horse stays nearby until follow is enabled again.
      return 'released';
    }
    if(s.mounted)return 'mounted';
    if(s.active!=='player'||s.player.form!=='human')return 'needHuman';
    if(distance(s.player,s.companion)>2.75)return 'tooFar';
    s.leading=true;s.following=false;
    return 'leading';
  }
  function leadTarget(s) {
    const p=s.player,co=Math.cos(p.heading),si=Math.sin(p.heading);
    return {x:p.x+co*1.10-si*.75,z:p.z-si*1.10-co*.75};
  }
  function advanceLead(s,dt) {
    if(!s.leading)return;
    const h=s.companion,target=leadTarget(s);
    const dx=target.x-h.x,dz=target.z-h.z,dist=Math.hypot(dx,dz);
    if(dist<.04)return;
    const step=Math.min(dist,Math.max(3,HUMAN_PACES[s.humanPace].speed+2)*dt);
    h.x=Math.max(-29,Math.min(29,h.x+dx/dist*step));
    h.z=Math.max(-29,Math.min(29,h.z+dz/dist*step));
    if(step>.005){h.heading=Math.atan2(dx,dz);h.walk+=step/3;}
  }
  function switchLabel(s) {
    if (s.mode !== 'duo') return '';
    if (s.mounted) return '↧ Absteigen';
    return s.active === 'companion' ? (s.player.form === 'human' ? '🧍 Mensch spielen' : '✨ Zauberpferd spielen') : '🐎 Pferd spielen';
  }
  function distance(a,b) { return Math.hypot(a.x-b.x,a.z-b.z); }
  function objective(s) {
    const entity = controlled(s);
    if (s.quest === 'meet') return { title:'1 · Das verschwundene Fohlen', text:'Stallwächterin Mira braucht deine Hilfe.', target:KEEPER, action:'Mit Mira sprechen' };
    if (s.quest === 'trail') return { title:'1 · Hufspuren im Wald', text:`Untersuche die goldenen Hufspuren (${s.trail} / 3).`, target:TRAIL[s.trail], action:'Spuren untersuchen' };
    if (s.quest === 'foal') return { title:'1 · Du hast Lumi gefunden!', text:'Nähere dich dem Fohlen und beruhige es.', target:s.foal, action:'Lumi beruhigen' };
    if (s.quest === 'escort') return { title:'1 · Gemeinsam nach Hause', text:distance(entity,s.foal)>5 ? 'Lumi wartet hinter dir. Kehre zu ihr zurück.' : 'Führe Lumi zum Stall. Schritt oder Trab halten euch zusammen.', target:distance(entity,s.foal)>5?s.foal:STABLE, action:'Lumi am Stall abgeben' };
    if (s.quest === 'stones') {
      let index = -1;
      for (let i=0;i<STONES.length;i++) if (!s.stars[i] && (index<0 || distance(entity,STONES[i])<distance(entity,STONES[index]))) index=i;
      return { title:'2 · Die Quelle des Lichts', text:`Lichtsteine ${collected(s)} / 3 · Wiese: berühren · Stall: Pferdeform · Teich: im Sprung.`, target:STONES[index], action:['Wiesenstein berühren','Hufstein aktivieren','Sprungstein aktivieren'][index], stone:index };
    }
    if (s.quest === 'source') return { title:'2 · Das Tal wartet auf dich', text:'Bringe das gesammelte Licht zur Quelle am Teich.', target:SOURCE, action:'Quelle erwecken' };
    return { title:'Das Tal leuchtet wieder!', text:'Lumi ist zu Hause. Dein Lichtkranz ist freigeschaltet – erkunde das Tal weiter.', target:null, action:'Abenteuer abgeschlossen' };
  }
  function interact(s) {
    const goal=objective(s), entity=controlled(s);
    if (!goal.target) return '';
    if (distance(entity,goal.target)>2.3) return 'Gehe näher an dein Ziel heran. Der Wegweiser zeigt dir die Richtung.';
    if (s.quest==='meet') { s.quest='trail'; return 'Mira: „Lumi ist verschwunden! Folge ihren goldenen Hufspuren in den Wald.“'; }
    if (s.quest==='trail') { s.trail++; if(s.trail===TRAIL.length)s.quest='foal'; return s.quest==='foal'?'Ein leises Wiehern! Lumi ist gleich hinter den Bäumen.':'Frische Hufspuren! Folge dem nächsten Hinweis.'; }
    if (s.quest==='foal') { s.quest='escort'; return 'Lumi vertraut dir und folgt dir jetzt. Gehe langsam mit ihr zum Stall.'; }
    if (s.quest==='escort') {
      if (distance(s.foal,STABLE)>3) return 'Warte auf Lumi und bringe sie mit zum Stall.';
      s.quest='stones'; return 'Mira: „Danke! Lumi ist sicher. Erwecke nun die drei Lichtsteine – jeder hört auf eine andere Fähigkeit.“';
    }
    if (s.quest==='stones') {
      if (goal.stone===1 && entity.form!=='horse') return 'Dieser Stein hört auf Hufe. Verwandle dich (T) oder wechsle zum Begleitpferd (Q).';
      if (goal.stone===2 && entity.jump<=0) return 'Dieser Stein braucht einen Sprung! Springe und aktiviere ihn in der Luft.';
      s.stars[goal.stone]=true;
      if(collected(s)===STONES.length)s.quest='source';
      return s.quest==='source'?'Die drei Steine antworten! Bringe ihr Licht zur Quelle.':'Ein Lichtstein erwacht! Suche den nächsten.';
    }
    s.quest='complete'; return '✨ Die Quelle leuchtet wieder! Lumi wiehert vor Freude. Du erhältst den Lichtkranz des Tals.';
  }
  function advanceFoal(s,dt) {
    if(s.quest!=='escort')return;
    const entity=controlled(s), f=s.foal, dist=distance(entity,f);
    if(dist>1.6 && dist<=5) {
      const step=Math.min(3*dt,dist-1.6), dx=entity.x-f.x, dz=entity.z-f.z;
      f.x+=dx/dist*step; f.z+=dz/dist*step; f.heading=Math.atan2(dx,dz); f.walk+=step/3;
    }
  }
  root.Arcade.pferdezauberLogic = { newState, switchTarget, transform, collected, horseById, catalog: HORSE_CATALOG, objective, interact, advanceFoal, cycleHumanPace, movementSpeed, switchLabel, humanPaces: HUMAN_PACES, world: root.Arcade.pferdezauberWorld, mountOrDismount, dismount, toggleLead, advanceLead, leadTarget, outfitById, outfits:OUTFITS };


  root.Arcade.games.pferdezauber = function ({ host }) {
    const horseCards = HORSE_CATALOG.map(h => {
      const rgb = color => 'rgb(' + color.map(v=>Math.round(v*255)).join(',') + ')';
      return '<button type="button" class="pz-horse" data-horse="' + h.id + '" aria-pressed="' + (h.id === DEFAULT_HORSE) + '">' +
        '<span class="pz-horse-swatch" style="--pz-coat:' + rgb(h.coat) + ';--pz-mane:' + rgb(h.mane) + '" aria-hidden="true"><span class="pz-horse-face"></span></span>' +
        '<span class="pz-horse-name">' + h.name + '</span><small>' + h.group + '</small></button>';
    }).join('');
    const html = [
      '<div class="pz">',
      ' <div class="pz-top"><a href="#alle" class="pz-back">← Zur Spieleübersicht</a><div><span class="pz-spark">✦</span> PFERDEZAUBER <small>Lebendige Pferdewelt · Das verschwundene Fohlen</small></div></div>',
      ' <p class="pz-population" aria-label="Bewohner der Pferdewelt">🐎 3 Pferdeherden · 🐴 Ponys &amp; Fohlen · 🧑 8 Menschen · 🐇 Hasen · 🐦 Vögel</p>',
      ' <section class="pz-quest" aria-label="Dein Abenteuer"><div><h2 data-quest-title role="status" aria-live="polite"></h2><p data-quest-text></p></div><div class="pz-wayfinder" data-wayfinder><span data-arrow aria-hidden="true">↑</span><b data-distance></b></div></section>',
      ' <div class="pz-scene">',
      '  <canvas class="pz-canvas" tabindex="0" aria-label="Dreidimensionale Pferdewiese. Nutze Tastatur oder die Schaltflächen zur Steuerung."></canvas>',
      '  <div class="pz-hud"><div class="pz-hudcard"><span>✨ Lichtsteine</span><b data-stars>0 / 3</b></div><div class="pz-hudcard"><span>Du steuerst</span><b data-active>Mensch</b></div><div class="pz-hudcard pz-hud-breed"><span>Dein Pferd</span><b data-breed>Haflinger</b></div></div>',
      '  <button class="pz-role-switch" type="button" data-act="switch" title="Als Pferd oder Mensch spielen (Q)" hidden>🐎 Pferd spielen</button>',
      '  <button class="pz-mount-switch" type="button" data-act="mount" title="Auf- oder Absteigen (M)" hidden>🐴 Aufsteigen</button>',
      '  <div class="pz-notice" role="status" aria-live="polite" data-notice>Willkommen im Tal der Wandelwinde!</div>',
      '  <div class="pz-pad" aria-label="Bewegen"><button data-move="up" aria-label="Vorwärts">▲</button><div><button data-move="left" aria-label="Nach links">◀</button><button data-move="down" aria-label="Rückwärts">▼</button><button data-move="right" aria-label="Nach rechts">▶</button></div></div>',
      '  <div class="pz-actions"><button data-act="interact" title="Interagieren (E)">✋ <span>Interaktion</span></button><button data-act="pace" title="Tempo für Mensch wechseln (R)">🏃 <span>Rennen</span></button><button data-act="transform" title="Verwandeln (T)">✦ <span>Verwandeln</span></button><button data-act="gait" title="Pferde-Gangart (G)">♞ <span>Schritt</span></button><button data-act="jump" title="Springen (Leertaste)">↥ <span>Springen</span></button></div>',
      '  <div class="pz-entry" data-entry><div class="pz-entry-card"><span class="pz-eyebrow">DEIN ABENTEUER BEGINNT</span><h1>Pferdezauber</h1><p>Ein Fohlen ist verschwunden und die Lichtquelle verstummt. Mira zählt auf dich! Wähle deinen Modus und dein Lieblingspferd.</p>',
      '   <div class="pz-choice" role="group" aria-label="Spielmodus"><button data-mode="duo" aria-pressed="true">🐴 Mensch + Pferd <small>Gehe zum Pferd, steige auf (M) oder spiele direkt als Pferd (Q)!</small></button><button data-mode="horseOnly" aria-pressed="false">🐎 Nur Pferd <small>Du steuerst sofort dein ausgewähltes Pferd</small></button></div>',
      '   <h2 class="pz-section-title">Wähle dein Pferd</h2>',
      '   <div class="pz-horses" role="group" aria-label="Fohlen, Ponys und Pferde">',horseCards,'   </div>',
      '   <p class="pz-selected" data-selection>Haflinger · Goldfuchs mit heller Mähne</p>',
      '   <button type="button" class="pz-start" data-start>✨ Abenteuer starten →</button>',
      '   <p class="pz-note">Kostenlose 3D-Demo · kein Konto · noch keine Spielstand-Speicherung · keine externen Inhalte</p>',
      '  </div></div>',
      '  <div class="pz-error" data-error hidden></div>',
      ' </div>',
      ' <div class="pz-info"><p><strong>Deine neue Pferdewelt:</strong> Drei Pferdeherden, eine Ponygruppe und eine Fohlenwiese; dazu spazierende Menschen, Hasen und Vögel. Alle leben in deiner eigenen Einzelspielerwelt.</p><p><strong>Deine erste Mission:</strong> Hilf Mira, finde Lumi und führe das Fohlen sicher zum Stall. Danach erweckst du die Lichtquelle mit drei Fähigkeitssteinen. Der Wegweiser zeigt zum nächsten Ziel; aktiviere es mit E oder der goldenen Aktionsschaltfläche.</p>',
      ' <div><strong>Aufs Pferd steigen:</strong> Im Modus „Mensch + Pferd“ neben dein Pony oder Pferd laufen und <kbd>M</kbd> oder „🐴 Aufsteigen“ drücken. Mit <kbd>M</kbd> wieder absteigen. <strong>Als Pferd spielen:</strong> <kbd>Q</kbd> oder „🐎 Pferd spielen“. <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> bewegen · <kbd>R</kbd> Mensch-Tempo · <kbd>G</kbd> Pferdegangart · <kbd>E</kbd> interagieren · <kbd>T</kbd> verwandeln · <kbd>Leertaste</kbd> springen. Fohlen sind nicht reitbar.</div>',
      ' <div class="pz-more"><button data-act="follow">🐴 Begleiter: Folgen</button><button data-act="restart">↻ Neu beginnen</button></div>',
      ' <p class="pz-note">Dies ist eine erste spielbare Vorschau, noch kein fertiges Star-Stable-ähnliches Spiel. Aktuell werden weder Konten noch Online-Spielstände angelegt.</p></div>',
      '</div>',
    ].join('');
    host.innerHTML = html;
    const shell = host.querySelector('.pz');
    const canvas = shell.querySelector('canvas');
    const entry = shell.querySelector('[data-entry]');
    const notice = shell.querySelector('[data-notice]');
    const error = shell.querySelector('[data-error]');
    const starText = shell.querySelector('[data-stars]');
    const activeText = shell.querySelector('[data-active]');
    const breedText = shell.querySelector('[data-breed]');
    const selectionText = shell.querySelector('[data-selection]');
    const keys = new Set();
    let selectedMode = 'duo', selectedHorseId = DEFAULT_HORSE;
    let state = newState('duo'), started = false, alive = true, raf = 0, last = 0, noticeUntil = 0;
    let cameraYaw = 0.18, camX = 0, camZ = 0, dragging = null;
    const questTitle=shell.querySelector('[data-quest-title]'), questText=shell.querySelector('[data-quest-text]');
    const wayfinder=shell.querySelector('[data-wayfinder]'), arrow=shell.querySelector('[data-arrow]'), distanceText=shell.querySelector('[data-distance]');
    const interactButton=shell.querySelector('[data-act="interact"]');
    const roleButton=shell.querySelector('.pz-role-switch');
    const mountButton=shell.querySelector('.pz-mount-switch');
    const paceButton=shell.querySelector('[data-act="pace"]');
    const gaitButton=shell.querySelector('[data-act="gait"]');
    const PI = Math.PI;
    function hint(message) {
      notice.textContent = message;
      notice.classList.add('pz-visible');
      noticeUntil = performance.now() + 3800;
    }
    function reset(mode) {
      state = newState(mode, selectedHorseId);
      ambientLastUpdate=0;
      cameraYaw = 0.18; camX = state.player.x; camZ = state.player.z;
      started = true; entry.hidden = true;
      keys.clear(); updateHud();
      hint(mode === 'horseOnly'
        ? '🐎 Du spielst jetzt als Pferd! Mira wartet am Stall.'
        : '🐴 Laufe zu deinem Pferd und steige mit M auf – oder spiele mit Q direkt als Pferd!');
      canvas.focus({preventScroll:true});
    }
    function updateObjective() {
      const goal=objective(state), entity=controlled(state);
      if(questTitle.textContent!==goal.title)questTitle.textContent=goal.title;
      if(questText.textContent!==goal.text)questText.textContent=goal.text;
      wayfinder.hidden=!goal.target;
      if(goal.target) {
        distanceText.textContent=Math.ceil(distance(entity,goal.target))+' m';
        arrow.style.transform='rotate('+(Math.atan2(goal.target.x-entity.x,goal.target.z-entity.z)-cameraYaw)+'rad)';
      }
      interactButton.disabled=!started || !goal.target;
      interactButton.classList.toggle('pz-ready',!!goal.target && distance(entity,goal.target)<=2.3);
      interactButton.setAttribute('aria-label',goal.action+' (E)');
      interactButton.querySelector('span').textContent=goal.action;
    }
    function updateHud() {
      updateObjective();
      starText.textContent = collected(state) + ' / 3';
      breedText.textContent = horseById(state.companion.horseId).name;
      const controlled = state.active === 'player' ? state.player : state.companion;
      activeText.textContent = state.mounted ? 'Zu Pferd' : state.active === 'companion' ? 'Begleitpferd' :
        controlled.form === 'human' ? 'Mensch' : state.mode === 'horseOnly' ? 'Dein Pferd' : 'Zauberpferd';
      roleButton.hidden = state.mode !== 'duo' || !started || state.mounted;
      roleButton.textContent = switchLabel(state);
      mountButton.hidden = state.mode !== 'duo' || !started;
      const unrideable=horseById(state.companion.horseId).foal;
      mountButton.disabled = !state.mounted && (unrideable || state.player.form !== 'human');
      mountButton.textContent = state.mounted ? '↧ Absteigen' : unrideable ? '🐣 Fohlen nicht reitbar' : '🐴 Aufsteigen';
      mountButton.setAttribute('aria-label',state.mounted?'Vom Pferd absteigen (M)':'Auf das Pferd steigen (M)');
      roleButton.setAttribute('aria-label', switchLabel(state) + ' (Q)');
      shell.querySelector('[data-act="transform"]').disabled = state.mode !== 'duo' || !started;
      paceButton.disabled = !started || controlled.form !== 'human';
      paceButton.querySelector('span').textContent = HUMAN_PACES[state.humanPace].label;
      paceButton.setAttribute('aria-label', 'Tempo Mensch: ' + HUMAN_PACES[state.humanPace].label + '. Wechseln mit R');
      gaitButton.disabled = !started || controlled.form !== 'horse';
      shell.querySelector('[data-act="jump"]').disabled = !started;
      shell.querySelector('[data-act="follow"]').disabled = state.mode !== 'duo' || !started;
      shell.querySelector('[data-act="gait"] span').textContent = ['Schritt','Trab','Galopp'][state.gait];
      shell.querySelector('[data-act="follow"]').textContent = '🐴 Begleiter: ' + (state.following ? 'Folgen' : 'Warten');
    }
    function action(act) {
      if (act === 'restart') { started = false; entry.hidden = false; keys.clear(); updateHud(); return; }
      if (!started) return;
      if (act === 'interact') { const message=interact(state); if(message)hint(message); }
      if (act === 'switch') { if (switchTarget(state)) hint(state.active === 'companion' ? '🐎 Jetzt spielst du als dein Pferd! Bewegen mit WASD oder den Pfeiltasten.' : 'Jetzt spielst du als Mensch. Tempo ändern mit R.'); }
      if (act === 'mount') {
        const result=mountOrDismount(state);
        hint({
          mounted:'🐴 Du sitzt im Sattel! Mit WASD lenken, G für Gangarten, M zum Absteigen.',
          dismounted:'Du bist abgestiegen. Dein Pferd wartet neben dir.',
          tooFar:'Gehe näher zu deinem Pferd, um aufzusteigen.',
          foal:'Fohlen sind nicht reitbar. Wähle ein Pony oder Großpferd.',
          needHuman:'Verwandle dich zuerst zurück in einen Menschen (T).',
          horseOnly:'Im Modus Nur Pferd steuerst du das Pferd direkt.'
        }[result]);
      }
      if (act === 'pace') { if (cycleHumanPace(state)) hint('Mensch-Tempo: ' + HUMAN_PACES[state.humanPace].label); }
      if (act === 'transform') { if (transform(state)) hint(state.player.form === 'horse' ? 'Du bist jetzt ein Zauberpferd! ✨' : 'Zurückverwandelt: Du bist wieder Mensch!'); else if(state.mounted)hint('Steige zuerst mit M vom Pferd ab.'); }
      if (act === 'gait' && controlled(state).form === 'horse') { state.gait = (state.gait + 1) % 3; hint('Pferde-Gangart: ' + ['Schritt','Trab','Galopp'][state.gait]); }
      if (act === 'follow') { state.following = !state.following; hint(state.following ? 'Dein Begleiter folgt dir.' : 'Dein Begleiter wartet.'); }
      if (act === 'jump') {
        const ent = state.active === 'player' ? state.player : state.companion;
        if (ent.jump <= 0) ent.jump = 0.001;
      }
      updateHud();
    }
    function updateSelection() {
      shell.querySelectorAll('[data-mode]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.mode === selectedMode)));
      shell.querySelectorAll('[data-horse]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.horse === selectedHorseId)));
      const chosen = horseById(selectedHorseId);
      selectionText.textContent = chosen.name + ' · ' + chosen.detail + (chosen.foal ? ' · Nicht reitbar' : '');
    }
    function onClick(event) {
      const mode = event.target.closest('[data-mode]');
      if (mode && MODES.includes(mode.dataset.mode)) { selectedMode = mode.dataset.mode; updateSelection(); return; }
      const horse = event.target.closest('[data-horse]');
      if (horse && Object.prototype.hasOwnProperty.call(HORSES,horse.dataset.horse)) { selectedHorseId = horse.dataset.horse; updateSelection(); return; }
      if (event.target.closest('[data-start]')) { reset(selectedMode); return; }
      const button = event.target.closest('[data-act]');
      if (button) action(button.dataset.act);
    }
    shell.addEventListener('click', onClick);
    const keyMap = { arrowup:'up', w:'up', arrowleft:'left', a:'left', arrowdown:'down', s:'down', arrowright:'right', d:'right' };
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !alive || !started || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (keyMap[key] || ['q','t','g','f','e','r','m',' '].includes(key)) e.preventDefault();
      if (keyMap[key]) keys.add(keyMap[key]);
      if (e.repeat) return;
      if (key === 'e') action('interact');
      if (key === 'q') action('switch');
      if (key === 'r') action('pace');
      if (key === 'm') action('mount');
      if (key === 't') action('transform');
      if (key === 'g') action('gait');
      if (key === 'f') action('follow');
      if (key === ' ') action('jump');
    }
    function onKeyUp(e) { const k = keyMap[e.key.toLowerCase()]; if (k) keys.delete(k); }
    function clearKeys() { keys.clear(); }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    // Pointer capture makes the virtual D-pad work with both fingers and mouse.
    const pads = [];
    shell.querySelectorAll('[data-move]').forEach(button => {
      const key = button.dataset.move;
      const down = e => { if (!started) return; e.preventDefault(); keys.add(key); button.setPointerCapture(e.pointerId); };
      const up = e => { keys.delete(key); if (button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', () => keys.delete(key));
      pads.push([button, down, up]);
    });
    function dragStart(e) {
      if (!started) return;
      dragging = { id: e.pointerId, x: e.clientX };
      canvas.setPointerCapture(e.pointerId);
    }
    function dragMove(e) {
      if (!dragging || dragging.id !== e.pointerId) return;
      cameraYaw += (e.clientX - dragging.x) * 0.006;
      dragging.x = e.clientX;
    }
    function dragEnd(e) { if (dragging && dragging.id === e.pointerId) dragging = null; }
    canvas.addEventListener('pointerdown', dragStart);
    canvas.addEventListener('pointermove', dragMove);
    canvas.addEventListener('pointerup', dragEnd);
    canvas.addEventListener('pointercancel', dragEnd);

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'low-power' });
    if (!gl) {
      error.hidden = false;
      error.textContent = 'Dein Browser unterstützt hier leider kein WebGL. Bitte aktiviere die Hardwarebeschleunigung oder versuche einen aktuellen Browser.';
      entry.hidden = true;
      return { dispose() { alive = false; shell.removeEventListener('click', onClick); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', clearKeys); } };
    }
    function shader(type, source) {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    let prog, staticBuffer, dynamicBuffer, ambientBuffer;
    let ambientVertexCount=0, ambientLastUpdate=0;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER,
        'attribute vec3 aPos; attribute vec3 aNorm; attribute vec3 aColor; uniform mat4 uPV; varying vec3 vColor; varying float vFog; void main(){vec4 clip=uPV*vec4(aPos,1.0);gl_Position=clip;float l=max(dot(normalize(aNorm),normalize(vec3(0.45,0.85,0.35))),0.0);vColor=aColor*(0.70+0.30*l);vFog=clamp((clip.w-19.0)/65.0,0.0,0.57);}'));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER,
        'precision mediump float; varying vec3 vColor; varying float vFog; void main(){gl_FragColor=vec4(mix(vColor,vec3(0.72,0.86,0.87),vFog),1.0);}'));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      error.hidden = false; error.textContent = 'Die 3D-Grafik konnte nicht gestartet werden: ' + e.message;
      entry.hidden = true;
      return { dispose() { alive = false; window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', clearKeys); } };
    }
    gl.useProgram(prog);
    const aPos = gl.getAttribLocation(prog, 'aPos'), aNorm = gl.getAttribLocation(prog, 'aNorm'), aColor = gl.getAttribLocation(prog, 'aColor');
    const uPV = gl.getUniformLocation(prog, 'uPV');
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.72, 0.86, 0.91, 1);
    staticBuffer = gl.createBuffer(); dynamicBuffer = gl.createBuffer(); ambientBuffer=gl.createBuffer();
    function mesh() { return { a: [] }; }
    function vert(m, p, n, c) { m.a.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2]); }
    function tri(m, p, q, r, n, c) { vert(m,p,n,c);vert(m,q,n,c);vert(m,r,n,c); }
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    function box(m, x, y, z, w, h, d, c, rot=0) {
      const cos=Math.cos(rot),sin=Math.sin(rot);
      function p(a,b,k){return [x+a*cos+k*sin,y+b,z+k*cos-a*sin];}
      const faces=[
        [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
        [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
        [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
        [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
        [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
        [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
      ];
      for (const f of faces) {
        const n=f[4],nn=[n[0]*cos+n[2]*sin,n[1],n[2]*cos-n[0]*sin];
        const v=f.slice(0,4).map(a=>p(a[0]*w/2,a[1]*h/2,a[2]*d/2));
        tri(m,v[0],v[1],v[2],nn,c);tri(m,v[0],v[2],v[3],nn,c);
      }
    }
    function ellipsoid(m,x,y,z,rx,ry,rz,c,rot=0) {
      const cos=Math.cos(rot),sin=Math.sin(rot),segs=10,rings=6;
      function v(a,b) {
        const phi=b*PI/rings,theta=a*PI*2/segs;
        const px=Math.sin(phi)*Math.cos(theta),py=Math.cos(phi),pz=Math.sin(phi)*Math.sin(theta);
        const n0=[px/rx,py/ry,pz/rz], nn=[n0[0]*cos+n0[2]*sin,n0[1],n0[2]*cos-n0[0]*sin];
        const len=Math.hypot(...nn)||1;
        return { p:[x+(px*rx)*cos+(pz*rz)*sin,y+py*ry,z+(pz*rz)*cos-(px*rx)*sin],n:nn.map(i=>i/len) };
      }
      for(let j=0;j<rings;j++)for(let i=0;i<segs;i++) {
        const a=v(i,j),b=v(i+1,j),d=v(i,j+1),e=v(i+1,j+1);
        for(const t of [[a,d,b],[b,d,e]]) for(const q of t) vert(m,q.p,q.n,c);
      }
    }
    function cone(m,x,y,z,rad,height,c,sides=7) {
      for(let i=0;i<sides;i++) {
        const a=i*2*PI/sides,b=(i+1)*2*PI/sides;
        const p=[x+rad*Math.cos(a),y,z+rad*Math.sin(a)];
        const q=[x+rad*Math.cos(b),y,z+rad*Math.sin(b)];
        const mid=(a+b)/2, n=[Math.cos(mid),rad/height,Math.sin(mid)],len=Math.hypot(...n);
        tri(m,p,q,[x,y+height,z],n.map(v=>v/len),c);
      }
    }
    function worldMesh() {
      const m=mesh(), green=[.40,.67,.42], green2=[.48,.72,.44],cream=[.94,.86,.70];
      box(m,0,-.23,0,73,.46,73,green);
      for(let j=-11;j<=11;j++) {
        const z=j*2.7,x=Math.sin(j*.24)*2.3;
        box(m,x,-.008,z,5.3,.045,3.05,[.78,.70,.51],Math.sin(j*.24)*.1);
      }
      // Hills and mountains at the edge of the meadow.
      for (let i=0;i<15;i++) {
        const a=i*2*PI/15, x=Math.sin(a)*37,z=Math.cos(a)*37;
        ellipsoid(m,x,.4,z,12,2.7+(i%4),8,i%2?[.37,.62,.48]:[.44,.68,.48]);
      }
      // Trees, carefully kept away from the road and spawn.
      for(let i=0;i<64;i++) {
        const x=(((i*17)%57)-28),z=(((i*29+7)%57)-28);
        if(Math.abs(x)<6 || (x>9&&x<19&&z>-15&&z<-5) || (x<-8&&z>8&&z<19))continue;
        const h=2.3+(i%5)*.45;
        box(m,x,h*.34,z,.32,h*.68,.32,[.43,.32,.22]);
        cone(m,x,h*.47,z,1.25,h*.65,i%3===0?[.19,.49,.40]:[.23,.53,.37]);
        cone(m,x,h*.8,z,.97,h*.58,i%3===0?[.23,.59,.44]:[.27,.63,.43]);
      }
      // Stable with roof, doorway, windows and paddock.
      box(m,-14,2,14,8,4,6,[.73,.37,.34]);
      cone(m,-14,4,14,5.7,3,[.36,.35,.45],4);
      box(m,-14,1.5,10.93,2.2,3.0,.15,[.33,.24,.22]);
      for(const x of [-16.5,-11.5])box(m,x,2.6,10.9,1.05,1.05,.16,[.84,.87,.73]);
      for(let x=-22;x<=-6;x+=2.1)for(const z of [5.5,21])box(m,x,.62,z,.15,1.24,.15,cream);
      for(let z=5.5;z<=21;z+=2.1)for(const x of [-22,-6])box(m,x,.62,z,.15,1.24,.15,cream);
      for(const z of [5.5,21])for(let x=-22;x< -6;x+=2.1)box(m,x+1,.7,z,2.1,.12,.13,cream);
      for(const x of [-22,-6])for(let z=5.5;z<21;z+=2.1)box(m,x,.7,z+1,.13,.12,2.1,cream);
      // Tiny village cottage and pond.
      box(m,16,1.8,14,5.2,3.6,5.3,[.89,.79,.63]);
      cone(m,16,3.65,14,3.8,2.25,[.61,.36,.38],4);
      box(m,16,1.2,11.25,1.2,2.4,.12,[.41,.54,.54]);
      ellipsoid(m,14.7,-.03,-11,5.8,.075,3.8,[.43,.75,.81]);
      for(let i=0;i<65;i++) {
        const x=(((i*23+8)%65)-32),z=(((i*13+9)%61)-30);
        if(Math.abs(x)<3.3 || (x>7&&x<21&&z< -5&&z>-17))continue;
        const c=i%3===0?[.96,.82,.52]:i%3===1?[.97,.66,.77]:[.96,.96,.89];
        box(m,x,.12,z,.045,.24,.045,[.31,.58,.32]);
        ellipsoid(m,x,.26,z,.15,.11,.15,c);
      }
      // Stable yard: hay stacks, troughs, shrub beds and logs.
      for(let i=0;i<17;i++){
        const x=-21+(i%6)*2.1,z=10+Math.floor(i/6)*1.7;
        if(x>-14 && z<12)continue;
        box(m,x,.36,z,1.05,.72,.72,[.84,.70,.40],i*.23);
        box(m,x,.73,z,.95,.065,.78,[.68,.51,.29],i*.23);
      }
      for(const [x,z] of [[-8,15],[7,14],[18,-23]]){
        box(m,x,.45,z,2.2,.8,1.1,[.39,.31,.25]);
        box(m,x,.88,z,1.9,.09,.86,[.43,.72,.79]);
      }
      for(let i=0;i<48;i++){
        const x=-29+((i*17)%58),z=-29+((i*31+9)%57);
        if(Math.abs(x)<4 || (x>-13&&x<-5&&z>0&&z<10))continue;
        const h=.32+(i%3)*.10;
        ellipsoid(m,x,h*.60,z,.38+(i%4)*.12,h,.4+(i%3)*.12,i%2?[.32,.60,.37]:[.26,.52,.36]);
      }
      for(let i=0;i<24;i++){
        const x=-27+(i*11)%54,z=-24+(i*19)%46;
        if(Math.abs(x)<4)continue;
        ellipsoid(m,x,.19,z,.30,.20,.34,[.64,.65,.60]);
      }
      return new Float32Array(m.a);
    }
    const ground=worldMesh();
    gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,ground,gl.STATIC_DRAW);

    function local(p,lx,y,lz){
      const co=Math.cos(p.heading),si=Math.sin(p.heading),scale=p.horseScale||1;
      return [p.x+(lx*co+lz*si)*scale,y*scale,p.z+(lz*co-lx*si)*scale];
    }
    function limb(m,p,lx,y,lz,w,h,d,c) {
      const v=local(p,lx,y,lz),scale=p.horseScale||1;
      box(m,v[0],v[1],v[2],w*scale,h*scale,d*scale,c,p.heading);
    }
    function blob(m,p,lx,y,lz,rx,ry,rz,c) {
      const v=local(p,lx,y,lz),scale=p.horseScale||1;
      ellipsoid(m,v[0],v[1],v[2],rx*scale,ry*scale,rz*scale,c,p.heading);
    }
    function horse(m,p,t,isCompanion) {
      const breed=horseById(p.horseId);
      const fur=breed.coat;
      const bob=Math.sin(p.walk*9)*.035, lift=p.jump>0?Math.sin(p.jump*PI/.78)*.8:0;
      const pose={...p,horseScale:breed.size};
      // All geometric dimensions are scaled, while foals have proportionally larger heads.
      // body proportions use y offsets while the whole horse can jump
      const base=lift+bob,graze=p.kind==='horse'?Math.max(0,Math.sin(t*.66+p.phase))*.25:0;
      blob(m,pose,0,1.38+base,0,.56,.49,.95,fur);
      blob(m,pose,0,1.65+base,.60,.32,.59,.36,fur);
      blob(m,pose,0,1.89+base-graze,.96,breed.foal?.39:.33,breed.foal?.40:.34,.43,fur);
      blob(m,pose,0,1.71+base-graze,1.26,.30,.20,.34,breed.muzzle);
      for(const side of [-1,1]){
        blob(m,pose,side*.19,2.21+base,.92,.115,.25,.11,fur);
        blob(m,pose,side*.27,1.96+base,1.21,.055,.055,.05,[.14,.16,.18]);
      }
      blob(m,pose,0,1.89+base,.61,.16,.38,.18,breed.mane); // mane
      for(const side of [-1,1]) for(const z of [-.61,.60]){
        const pace=Math.sin(p.walk*8+(side===1?PI:0)+(z<0?PI*.65:0))*.14;
        limb(m,pose,side*.37,.62+base,z+pace,.21,1.12,.25,fur);
        limb(m,pose,side*.37,.105+lift,z+pace,.25,.21,.33,[.32,.33,.34]);
      }
      blob(m,pose,0,1.08+base,-1.02,.17,.25,.55,breed.mane);
      // Tack stays attached to the personal companion; wild herds and foals
      // are untacked. Cloth, saddle seat, girth and stirrups are 3D meshes.
      if(isCompanion && !breed.foal) {
        const leather=[.31,.19,.14],gold=[.85,.70,.39];
        blob(m,pose,0,1.79+base,-.16,.58,.12,.63,[.28,.46,.62]); // saddle cloth
        blob(m,pose,0,1.91+base,-.18,.43,.13,.51,leather); // leather saddle
        blob(m,pose,0,2.01+base,-.32,.33,.08,.27,[.21,.14,.11]); // seat
        limb(m,pose,0,1.37+base,-.15,.06,.65,.08,[.40,.26,.17]); // belly girth
        for(const side of [-1,1]) {
          limb(m,pose,side*.53,1.42+base,-.17,.06,.72,.06,leather); // stirrup straps
          limb(m,pose,side*.53,1.04+base,-.12,.19,.055,.16,gold); // metal stirrups
          limb(m,pose,side*.25,1.91+base-graze,1.15,.058,.47,.063,leather); // cheek straps
          limb(m,pose,side*.25,2.02+base-graze,.98,.052,.36,.06,leather);
          limb(m,pose,side*.34,1.91+base,.69,.04,.055,.86,leather); // reins to hands
        }
        limb(m,pose,0,1.70+base-graze,1.38,.55,.07,.07,leather); // noseband
        limb(m,pose,0,2.08+base-graze,1.08,.59,.06,.07,leather); // browband
        limb(m,pose,0,1.67+base-graze,1.35,.62,.065,.065,gold); // bit
      }
    }
    function human(m,p) {
      const moving=Math.sin(p.walk*9),lift=p.jump>0?Math.sin(p.jump*PI/.78)*.75:0;
      const shirts=[[.28,.59,.55],[.76,.47,.48],[.36,.49,.73],[.79,.67,.42]];
      const skin=[.91,.71,.56],shirt=p===KEEPER?[.22,.53,.43]:p.style===undefined?[.59,.44,.70]:shirts[p.style%shirts.length],jeans=[.34,.49,.62];
      limb(m,p,0,1.26+lift,0,.62,.78,.37,shirt);
      blob(m,p,0,1.91+lift,.01,.29,.33,.27,skin);
      blob(m,p,0,2.15+lift,-.07,.32,.20,.31,[.36,.25,.22]);
      for(const side of [-1,1]){
        const k=side*moving*.12;
        limb(m,p,side*.19,.43+lift,k,.23,.82,.27,jeans);
        limb(m,p,side*.19,.09+lift,k+.12,.27,.18,.39,[.31,.33,.37]);
        limb(m,p,side*.43,1.20+lift,-k,.18,.76,.22,skin);
      }
    }
    function rider(m,p,t) {
      // A seated rider is rendered above the moving saddle, never at ground level.
      const horseScale=horseById(p.horseId).size;
      const bob=Math.sin(p.walk*9)*.035*horseScale;
      const jump=p.jump>0?Math.sin(p.jump*PI/.78)*.8*horseScale:0;
      const hips=horseScale*2.03+bob+jump,pose={x:p.x,z:p.z,heading:p.heading};
      const shirt=[.59,.44,.70],skin=[.91,.71,.56],jeans=[.30,.43,.62];
      blob(m,pose,0,hips,-.22,.35,.21,.30,jeans); // hips resting on seat
      limb(m,pose,0,hips+.54,-.08,.56,.87,.34,shirt);
      blob(m,pose,0,hips+1.20,.02,.27,.30,.26,skin);
      blob(m,pose,0,hips+1.46,-.06,.29,.17,.29,[.32,.23,.22]);
      for(const side of [-1,1]) {
        // Bent legs lie on opposite sides of the horse's body, feet in stirrups.
        limb(m,pose,side*.39,hips-.27,-.03,.24,.67,.29,jeans);
        limb(m,pose,side*.52,hips-.65,-.13,.25,.21,.37,[.20,.23,.25]);
        // Arms reach forward to hold the reins.
        limb(m,pose,side*.38,hips+.44,.24,.18,.67,.20,skin);
        blob(m,pose,side*.35,hips+.13,.55,.11,.11,.11,skin);
      }
    }
    function sparkle(m,s,t) {
      const y=1.05+Math.sin(t*2+s.x)*.15;
      ellipsoid(m,s.x,y,s.z,.31,.31,.31,[.98,.79,.29]);
      cone(m,s.x,y+.19,s.z,.23,.48,[1,.91,.61],4);
      cone(m,s.x,y-.57,s.z,.23,.38,[1,.91,.61],4);
      ellipsoid(m,s.x,.02,s.z,.62,.025,.62,[.84,.78,.45]);
    }
    // Static/animated wildlife uses a separate GPU buffer, regenerated only at
    // 10 fps. Beyond 18m, horses use a smaller silhouette instead of full rigs.
    function sceneAmbient(t) {
      const m=mesh(), center=controlled(state);
      for(const p of state.ambient.horses) {
        const dist=distance(p,center);
        if(dist>36)continue;
        if(dist<18) {
          horse(m,p,t,false);
        } else {
          const profile=horseById(p.horseId),pose={...p,horseScale:profile.size};
          blob(m,pose,0,1.35,0,.58,.48,.95,profile.coat);
          blob(m,pose,0,1.83,.83,.31,.35,.33,profile.coat);
          blob(m,pose,0,1.67,1.13,.28,.21,.27,profile.muzzle);
          for(const x of [-.37,.37])for(const z of [-.57,.60])
            limb(m,pose,x,.53,z,.20,1.05,.23,profile.coat);
        }
      }
      for(const p of state.ambient.people) {
        const dist=distance(p,center);
        if(dist>36)continue;
        if(dist<23)human(m,p);
        else {
          const coats=[[.28,.59,.55],[.76,.47,.48],[.36,.49,.73],[.79,.67,.42]];
          const coat=coats[p.style];
          box(m,p.x,1.05,p.z,.52,1.15,.37,coat,p.heading);
          ellipsoid(m,p.x,1.79,p.z,.28,.31,.25,[.88,.69,.56]);
          for(const d of [-.15,.15])box(m,p.x+d,.32,p.z,.18,.64,.20,[.33,.41,.59]);
        }
      }
      for(const p of state.ambient.rabbits) {
        if(distance(p,center)>29)continue;
        const bob=Math.max(0,Math.sin(t*2.6+p.phase))*.16;
        ellipsoid(m,p.x,.32+bob,p.z,.33,.26,.45,[.77,.71,.61]);
        ellipsoid(m,p.x,.48+bob,p.z+.28,.23,.22,.23,[.79,.74,.66]);
        for(const x of [-.15,.15]) {
          cone(m,p.x+x,.59+bob,p.z+.29,.085,.37,[.75,.64,.61],5);
        }
        ellipsoid(m,p.x,.37+bob,p.z-.47,.12,.12,.12,[.94,.90,.83]);
      }
      for(const p of state.ambient.birds) {
        if(distance(p,center)>37)continue;
        const y=4.1+Math.sin(t*1.3+p.phase)*.45;
        ellipsoid(m,p.x,y,p.z,.19,.13,.33,[.27,.46,.56]);
        const wing=.11+Math.abs(Math.sin(t*7+p.phase))*.20;
        box(m,p.x-.31,y+wing,p.z,.57,.065,.16,[.31,.55,.63],.13);
        box(m,p.x+.31,y+wing,p.z,.57,.065,.16,[.31,.55,.63],-.13);
      }
      return new Float32Array(m.a);
    }
    function sceneDynamic(t) {
      const m=mesh();
      // A soft ground shadow anchors the stylised figures to the meadow.
      for(const p of state.mode==='duo'?[state.player,state.companion]:[state.player]) {
        // The mounted human is drawn by rider() on top of the companion.
        if(state.mounted && p===state.player)continue;
        const scale=p.form==='horse'?horseById(p.horseId).size:1;
        ellipsoid(m,p.x,.01,p.z,.73*scale,.022,.87*scale,[.33,.52,.32]);
        if(p.form==='human')human(m,p);else horse(m,p,t,p===state.companion);
      }
      if(state.mounted)rider(m,state.companion,t);
      human(m,KEEPER);
      if(state.quest!=='meet' && state.quest!=='trail') {
        const foal=state.quest==='escort'||state.quest==='foal'?state.foal:{...state.foal,x:-12,z:7};
        horse(m,foal,t,false);
      }
      if(state.quest==='trail') {
        const track=TRAIL[state.trail];
        for(let i=0;i<3;i++)for(const side of [-1,1])ellipsoid(m,track.x+side*.22,.035,track.z+i*.4,.13,.035,.18,[.98,.81,.38]);
      }
      if(['stones','source','complete'].includes(state.quest))for(let i=0;i<STONES.length;i++) {
        const stone=STONES[i];
        box(m,stone.x,.35,stone.z,.7,.7,.7,state.stars[i]?[.96,.82,.42]:[.48,.51,.57]);
        if(!state.stars[i])sparkle(m,stone,t);
      }
      const lit=state.quest==='complete';
      ellipsoid(m,SOURCE.x,.02,SOURCE.z,1.3,.08,1.3,lit?[.44,.87,.92]:[.36,.49,.53]);
      if(lit) {
        for(let i=0;i<7;i++)ellipsoid(m,SOURCE.x+Math.cos(i*PI*2/7)*.7,1.1+Math.sin(t+i)*.45,SOURCE.z+Math.sin(i*PI*2/7)*.7,.12,.12,.12,[1,.91,.58]);
        const entity=controlled(state), y=entity.form==='human'?2.5:horseById(entity.horseId).size*2.6;
        for(let i=0;i<7;i++)ellipsoid(m,entity.x+Math.cos(i*PI*2/7)*.4,y,entity.z+Math.sin(i*PI*2/7)*.4,.08,.08,.08,[1,.88,.38]);
      }
      const goal=objective(state);
      if(goal.target) {
        const y=3.2+Math.sin(t*2)*.15;
        cone(m,goal.target.x,y,goal.target.z,.28,-.65,[1,.86,.40],4);
      }
      return new Float32Array(m.a);
    }
    function multiply(a,b) {
      const o=new Float32Array(16);
      for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)o[j*4+i]+=a[k*4+i]*b[j*4+k];
      return o;
    }
    function perspective(aspect) {
      const f=1/Math.tan(PI/6),near=.1,far=130;
      return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    }
    function lookAt(eye,at) {
      function norm(v){const n=Math.hypot(...v)||1;return v.map(q=>q/n);}
      function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
      const z=norm(eye.map((v,i)=>v-at[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
      return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
        -x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],-z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1]);
    }
    function draw(buffer,data,usage,existingCount=ground.length/9) {
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      if(data)gl.bufferData(gl.ARRAY_BUFFER,data,usage);
      for(const [attr,offset] of [[aPos,0],[aNorm,12],[aColor,24]]) {
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr,3,gl.FLOAT,false,36,offset);
      }
      gl.drawArrays(gl.TRIANGLES,0,data?data.length/9:existingCount);
    }
    function move(p,dx,dz,speed,dt) {
      const length=Math.hypot(dx,dz);
      if(length<.001)return;
      dx/=length; dz/=length;
      p.x=clamp(p.x+dx*speed*dt,-29,29);
      p.z=clamp(p.z+dz*speed*dt,-29,29);
      p.heading=Math.atan2(dx,dz);
      p.walk+=dt*speed/3;
    }
    function tick(t,dt) {
      if(!started)return;
      const entity=state.active==='player'?state.player:state.companion;
      const forward=(keys.has('up')?1:0)-(keys.has('down')?1:0);
      const right=(keys.has('right')?1:0)-(keys.has('left')?1:0);
      if(forward||right) {
        const dx=right*Math.cos(cameraYaw)+forward*Math.sin(cameraYaw);
        const dz=forward*Math.cos(cameraYaw)-right*Math.sin(cameraYaw);
        move(entity,dx,dz,movementSpeed(state),dt);
      }
      if(entity.jump>0){entity.jump+=dt;if(entity.jump>=.78)entity.jump=0;}
      if(state.mode==='duo'&&state.following) {
        const other=state.active==='player'?state.companion:state.player;
        const dx=entity.x-other.x,dz=entity.z-other.z,dist=Math.hypot(dx,dz);
        if(dist>2.5)move(other,dx,dz,Math.min(5,2.6+(dist-2.5)*.65),dt);
      }
      if(state.mounted) {
        state.player.x=state.companion.x;state.player.z=state.companion.z;
        state.player.heading=state.companion.heading;
        state.player.jump=state.companion.jump;
      }
      advanceFoal(state,dt);
      root.Arcade.pferdezauberWorld.tick(state.ambient,t,dt);
      updateObjective();
    }
    updateHud();
    function frame(now) {
      if(!alive)return;
      const dt=Math.min((now-last)/1000||0,.04);last=now;
      tick(now/1000,dt);
      if(now>noticeUntil)notice.classList.remove('pz-visible');
      const dpr=Math.min(window.devicePixelRatio||1,1.6);
      const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const entity=state.active==='player'?state.player:state.companion;
      camX+=(entity.x-camX)*Math.min(1,dt*7);camZ+=(entity.z-camZ)*Math.min(1,dt*7);
      const visualHeight=state.mounted ? horseById(entity.horseId).size*2.35 : entity.form==='human'?1.15:Math.max(.75,horseById(entity.horseId).size*1.15);
      const eye=[camX-Math.sin(cameraYaw)*8.8,4.1+visualHeight,camZ-Math.cos(cameraYaw)*8.8];
      gl.uniformMatrix4fv(uPV,false,multiply(perspective(w/h),lookAt(eye,[camX,visualHeight,camZ])));
      draw(staticBuffer,null,gl.STATIC_DRAW);
      // Separating ambient geometry from the player prevents rebuilding every
      // grazing horse, background person and bird on every animation frame.
      if(now-ambientLastUpdate>=100 || ambientVertexCount===0) {
        const data=sceneAmbient(now/1000);
        ambientVertexCount=data.length/9;
        draw(ambientBuffer,data,gl.DYNAMIC_DRAW);
        ambientLastUpdate=now;
      } else {
        draw(ambientBuffer,null,gl.DYNAMIC_DRAW,ambientVertexCount);
      }
      draw(dynamicBuffer,sceneDynamic(now/1000),gl.DYNAMIC_DRAW);
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
    return {
      dispose() {
        alive=false;cancelAnimationFrame(raf);
        shell.removeEventListener('click',onClick);
        window.removeEventListener('keydown',onKeyDown);
        window.removeEventListener('keyup',onKeyUp);
        window.removeEventListener('blur',clearKeys);
        canvas.removeEventListener('pointerdown',dragStart);
        canvas.removeEventListener('pointermove',dragMove);
        canvas.removeEventListener('pointerup',dragEnd);
        canvas.removeEventListener('pointercancel',dragEnd);
        for(const [el,down,up] of pads){el.removeEventListener('pointerdown',down);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);}
        gl.deleteBuffer(staticBuffer);gl.deleteBuffer(dynamicBuffer);gl.deleteBuffer(ambientBuffer);gl.deleteProgram(prog);
      }
    };
  };
})(globalThis);
