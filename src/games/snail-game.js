(function(root) {
  'use strict';
  const M=root.SnailModel, A=root.SnailArt, STORAGE='cs-games:schneckenkampf:v1';
  root.Arcade.games.schneckenkampf=function({host}) {
    let campaign=M.campaign(), state=null, level=0, difficulty='medium', character='fox';
    let disposed=false, paused=true, menu=true, shop=false, tool='water', seed='daisy', frame=0, last=0, clock=0, saveClock=0, hudClock=0;
    let shopCategory='plants',coinEffects=[];
    let lastPhase='day', lastOver=false, lastUnlock=0, joystick={x:0,y:0}, joyPointer=null, hold=false, storageOK=true;
    const keys=new Set(),listeners=[];
    const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    try{const raw=localStorage.getItem(STORAGE);if(raw)campaign=M.parseSave(raw)||M.campaign();}catch{storageOK=false;}
    function on(target,event,fn,options){target.addEventListener(event,fn,options);listeners.push(()=>target.removeEventListener(event,fn,options));}
    host.innerHTML=`<div class="sn-root sn-refined"><a class="back-link" href="#alle">← Zur Spieleplattform</a><div class="sn-title"><div><span class="sn-kicker">EIN GARTEN VOLLER GEHEIMNISSE</span><h1>Schneckenkampf<span aria-hidden="true"> ✦</span></h1><p>Tagsüber Blütenzauber. Nachts beginnt die Gartenwache.</p></div><span class="sn-edition">GARDEN TALES · V0.3</span></div><section class="sn-setup" aria-label="Figur, Schwierigkeit und Garten auswählen"></section><section class="sn-play" hidden><div class="sn-hud"><div class="sn-hud-left"><span>NÄCHTE <b data-hud="nights">0</b></span><span>MÜNZEN <b data-hud="money">0</b></span><span>PFLANZEN <b data-hud="plants">6</b></span></div><div class="sn-hud-right"><strong data-hud="phase">Morgens</strong><span data-hud="garden">Bauerngarten</span><span data-hud="limit"></span></div></div><div class="sn-world"><canvas width="1920" height="1280" tabindex="0" aria-label="Schneckenkampf: Garten aus der Vogelperspektive. Steuerung unter dem Spielfeld.">Für dieses Spiel wird Canvas benötigt.</canvas><div class="sn-dialog" hidden></div></div><div class="sn-notice" role="status" aria-live="polite"></div><div class="sn-bar"><div class="sn-tools"><button data-tool="water" aria-pressed="true">Gießen</button><button data-tool="seed" aria-pressed="false">Pflanzen</button><button data-tool="repair" aria-pressed="false">Reparieren</button><select class="sn-inventory" aria-label="Samen oder Verteidigung auswählen"></select></div><div class="sn-utilities"><button data-action="shop">Stand</button><button data-action="night">Nacht starten</button><button data-action="pause">Pause</button><button data-action="menu">Levelauswahl</button><button data-action="fullscreen">Vollbild</button></div></div><div class="sn-controls"><div class="sn-joystick" aria-label="Touch-Joystick zum Bewegen"><span class="sn-stick"></span><i aria-hidden="true">✚</i></div><div class="sn-control-hint"><b>Dein Garten braucht dich.</b><span>Joystick / WASD: laufen · Leertaste: Aktion<br>E: Stand · N: Nacht · Esc: Pause</span></div><button class="sn-action" data-action="use"><span data-hud="action">Gießen</span><small data-hud="cooldown">BEREIT</small></button></div></section><section class="sn-help"><h2>Deine erste Gartenwache</h2><p>Gieße die Pflanzen, bevor die Nacht beginnt: Gehe in ihre Nähe und tippe sie an oder nutze den Aktionsbutton. Zum Stand oben rechts musst du hinlaufen. Kaufe Samen für leere Plätze und stelle Fallen auf freien Wegen auf. Nachts trifft deine Hacke eine nahe Schnecke in Blickrichtung – anschließend lädt sie kurz nach.</p><div class="sn-help-grid"><p><b>Blüten & Münzen</b>Gegossene Pflanzen bringen nach jeder Nacht Geld. Nach zwei trockenen Tagen verwelken sie. Schnecken bringen kleine Prämien.</p><p><b>Neue Gärten</b>5 Nächte im Bauerngarten öffnen den Waldgarten. 10 Nächte dort öffnen den Schlossgarten. Jeder Garten und Modus hat seinen eigenen Spielstand.</p><p><b>Dein Fortschritt</b>Automatische Speicherung auf diesem Gerät. Beim Verlassen pausiert die Partie. Neue Partien ersetzen nur den ausgewählten Garten und Modus; Freischaltungen bleiben.</p></div></section></div>`;
    const pane=host.querySelector('.sn-play'),setup=host.querySelector('.sn-setup'),canvas=host.querySelector('canvas'),context=canvas.getContext('2d'),dialog=host.querySelector('.sn-dialog'),notice=host.querySelector('.sn-notice'),select=host.querySelector('select'),stick=host.querySelector('.sn-stick'),joy=host.querySelector('.sn-joystick');
    context.setTransform(2,0,0,2,0,0);
    if(root.SnailAssets?.garden)host.querySelector('.sn-root').style.setProperty('--sn-scenery',`url("${root.SnailAssets.garden}")`);
    const fullscreen=root.ArcadeFullscreen.create({element:pane,button:host.querySelector('[data-action="fullscreen"]'),stage:host.querySelector('.sn-world'),aspect:3/2});
    function clear(){keys.clear();joystick={x:0,y:0};hold=false;stick.style.transform='translate(-50%,-50%)';}
    function save(){
      if(state)M.record(campaign,state);
      try{localStorage.setItem(STORAGE,JSON.stringify(campaign));storageOK=true;}catch{storageOK=false;}
    }
    function menuView(){
      coinEffects=[];clear();paused=true;menu=true;shop=false;if(state)save();pane.hidden=true;setup.hidden=false;dialog.hidden=true;fullscreen.exit();
      const saved=campaign.runs[`${level}:${difficulty}`];
      setup.innerHTML=`<div class="sn-menu-hero"><div><span class="sn-kicker">WILLKOMMEN IN DEINEM KLEINEN REICH</span><h2>Blumen pflegen.<br>Schnecken trotzen.</h2><p>Wähle deine Gartenwache. Bewahre die Blüten vor dem, was nachts durch die Hecken kriecht.</p></div><canvas class="sn-menu-art" width="960" height="640" aria-label="Vorschau des märchenhaften Gartens"></canvas></div><div class="sn-menu-body"><div class="sn-choice-columns"><fieldset><legend>01 · Deine Figur</legend><div class="sn-character-row">${[['gardener','Gärtner'],['gardeneress','Gärtnerin'],['fox','Farmer-Fuchs']].map(([id,name])=>`<button data-character="${id}" aria-pressed="${character===id}"><canvas width="160" height="180" data-portrait="${id}" aria-hidden="true"></canvas><span>${name}</span></button>`).join('')}</div><p class="sn-muted">Alle drei Figuren sind gleich stark.</p></fieldset><fieldset><legend>02 · Deine Herausforderung</legend><div class="sn-difficulties">${Object.entries(M.DIFFICULTIES).map(([id,d])=>`<button data-difficulty="${id}" aria-pressed="${difficulty===id}">${d.label}</button>`).join('')}</div><p class="sn-muted">${difficulty==='easy'?'Günstiger einkaufen, weniger Schnecken, schnellere Hacke.':difficulty==='hard'?'Stärkere Wellen und höchstens 6 + eine weitere gefressene Pflanze je zwei überlebten Nächten.':'Die normale Gartenwache. Pflege, Planung und ein guter Hackenschlag.'}</p></fieldset></div><fieldset class="sn-levels"><legend>03 · Dein Garten</legend><div>${M.LEVELS.map((l,i)=>`<button data-level="${i}" ${i>campaign.unlocked?'disabled':''} aria-pressed="${level===i}"><span class="sn-garden-number">${i>campaign.unlocked?'🔒':`0${i+1}`}</span><strong>${l.name}</strong><small>${i>campaign.unlocked?`${M.LEVELS[i-1].unlock} Nächte im ${M.LEVELS[i-1].name}`:`Bestwert: ${campaign.best[i]} Nächte`}</small><span>${l.subtitle}</span></button>`).join('')}</div></fieldset><div class="sn-start-row">${saved&&!saved.over?`<button class="sn-button" data-action="continue">Fortsetzen · Nacht ${saved.nights+1}</button>`:''}<button class="sn-button ${saved&&!saved.over?'sn-secondary':''}" data-action="new">${saved?'Neue Partie':'Garten betreten'} <span aria-hidden="true">→</span></button><span class="sn-save-label">${storageOK?'Automatisch gespeichert · nur auf diesem Gerät':'Speicherung nicht verfügbar – bitte Browser-Einstellungen prüfen'}</span></div></div>`;
      const preview=setup.querySelector('.sn-menu-art'),pc=preview.getContext('2d');A.garden(pc,M.newRun(level,difficulty,character),0);A.ready.then(()=>{if(preview.isConnected&&!disposed)A.garden(pc,M.newRun(level,difficulty,character),0);});
      setup.querySelectorAll('[data-portrait]').forEach(el=>{const ctx=el.getContext('2d');ctx.scale(2.8,2.8);A.character(ctx,el.dataset.portrait,28,60);});
    }
    function show(title,text,actions){
      clear();paused=true;dialog.hidden=false;dialog.innerHTML=`<div class="sn-paper"><span class="sn-kicker">SCHNECKENKAMPF</span><h2>${escape(title)}</h2><p>${escape(text)}</p><div class="sn-dialog-actions">${actions}</div></div>`;
    }
    function enter(s){
      state=s;coinEffects=[];state.coinEvents=[];level=s.level;difficulty=s.difficulty;character=s.character;menu=false;shop=false;paused=false;setup.hidden=true;pane.hidden=false;dialog.hidden=true;clear();
      lastPhase=s.phase;lastOver=s.over;lastUnlock=campaign.unlocked;tool='water';updateInventory();sync();A.garden(context,state,clock);canvas.focus({preventScroll:true});save();
      if(s.over)gameOver();
    }
    function gameOver(){save();show('Der Garten ist verstummt',`${state.reason} Du hast ${state.nights} Nächte überlebt. Deine freigeschalteten Gärten bleiben erhalten.`,`<button class="sn-button" data-action="restart">Neue Partie</button><button class="sn-button sn-secondary" data-action="menu">Levelauswahl</button><a class="sn-button sn-secondary" href="#">Zurück zum Hauptmenü</a>`);}
    function updateInventory(){
      if(!state)return;const old=select.value;
      select.innerHTML=`<optgroup label="Samen">${Object.entries(M.PLANTS).map(([id,p])=>`<option value="${id}" ${!state.inventory[id]?'disabled':''}>${p.name} × ${state.inventory[id]}</option>`).join('')}</optgroup><optgroup label="Verteidigung">${Object.entries(M.ITEMS).filter(([id])=>id!=='food').map(([id,p])=>`<option value="${id}" ${!state.inventory[id]?'disabled':''}>${p.name} × ${state.inventory[id]}</option>`).join('')}</optgroup>`;
      if([...select.options].some(o=>o.value===old&&!o.disabled))select.value=old;else select.value=seed;
    }
    function sync(){
      if(!state)return;
      const set=(name,value)=>{const node=host.querySelector(`[data-hud="${name}"]`);if(node.textContent!==String(value))node.textContent=value;};
      set('nights',state.nights);set('money',state.money);set('plants',`${M.living(state).length}/${state.plots.filter(p=>p.unlocked).length}`);set('phase',M.phaseName(state));set('garden',`${M.LEVELS[state.level].name} · ${M.DIFFICULTIES[state.difficulty].label}`);
      set('limit',state.difficulty==='hard'?`Gefressen: ${state.eaten}/${M.lossLimit(state)}`:`${state.phase==='night'?`Welle: ${state.spawned}/${state.waveTotal} · ${state.snails.length} unterwegs`:`Tag: ${Math.max(0,Math.ceil(180-state.dayTime))} s`}`);
      set('action',state.phase==='night'?'Hacke':tool==='water'?'Gießen':tool==='seed'?'Pflanzen':tool==='repair'?'Reparieren':'Aufstellen');set('cooldown',state.phase==='night'&&state.cooldown>0?`${state.cooldown.toFixed(1)} s COOLDOWN`:'BEREIT');
      const text=state.notice+(storageOK?'':' · Speicherung nicht verfügbar');if(notice.textContent!==text)notice.textContent=text;
      host.querySelectorAll('[data-tool]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.tool===tool));button.disabled=state.phase==='night';});select.disabled=state.phase==='night';
      host.querySelector('[data-action="shop"]').disabled=state.phase==='night';host.querySelector('[data-action="night"]').disabled=state.phase==='night';
      host.querySelector('[data-action="pause"]').textContent=paused?'Fortsetzen':'Pause';host.querySelector('.sn-action').classList.toggle('sn-cooling',state.cooldown>0&&state.phase==='night');
    }
    function use(point){
      if(menu||paused||!state||state.over)return;
      if(state.phase==='night'){M.attack(state);sync();return;}
      point=point||{x:state.player.x+state.player.dx*52,y:state.player.y+state.player.dy*52};
      if(tool==='water'){const p=state.plots.filter(p=>p.unlocked).sort((a,b)=>M.dist(a,point)-M.dist(b,point))[0];if(p&&!p.type){state.notice='Dieser Platz ist leer. Wähle Pflanzen und einen Samen aus.';}else M.tend(state,point,seed);}
      else if(tool==='seed')M.tend(state,point,seed);
      else if(tool==='repair')M.repair(state,point);
      else if(tool.startsWith('build:'))M.place(state,tool.slice(6),point);
      updateInventory();save();sync();
    }
    function openShop(category=shopCategory){
      shopCategory=category;
      if(!state||state.phase!=='day'||state.over)return;
      if(M.dist(state.player,{x:835,y:175})>140){state.notice='Der Stand ist oben rechts. Gehe näher heran, um einzukaufen.';sync();return;}
      clear();paused=true;shop=true;dialog.hidden=false;
      const products=[...Object.entries(M.PLANTS).map(([id,p])=>({id,category:'plants',...p,description:`${p.rarity} · ${p.yield} Münzen pro gegossener Pflanze und Nacht.`,locked:p.level>campaign.unlocked})),...Object.entries(M.ITEMS).map(([id,p])=>({id,category:'defense',...p})),
        {id:'damage',category:'weapons',name:'Stärkere Hacke',price:35*state.damage,description:`Schaden ${state.damage} → ${state.damage+1}.`,locked:state.damage>=4},
        {id:'haste',category:'weapons',name:'Leichtere Hacke',price:30*(state.haste+1),description:'Verkürzt den Cooldown um 0,18 Sekunden.',locked:state.haste>=4},
        {id:'expand',category:'plants',name:'Garten erweitern',price:M.expansionPrice(state),description:'Drei weitere Pflanzplätze für diesen Garten.',locked:state.plots.every(p=>p.unlocked)}];
      dialog.innerHTML=`<div class="sn-paper sn-shop"><div class="sn-shop-heading"><div><span class="sn-kicker">DER KLEINE GARTENSTAND</span><h2>Samen, Schutz & gute Ideen</h2></div><button class="sn-button sn-secondary" data-action="close-shop">Zurück zum Garten</button></div><p>${state.money} Münzen · Futter im Vorrat: ${state.inventory.food}. Während des Einkaufs ist die Zeit angehalten.</p><nav class="sn-shop-categories" aria-label="Shop-Kategorien">${[["weapons","Waffen"],["plants","Pflanzen"],["defense","Fallen/Verteidigung"]].map(([id,name])=>`<button class="sn-button sn-secondary" data-shop-category="${id}" aria-pressed="${shopCategory===id}">${name}</button>`).join('')}</nav><div class="sn-shop-grid">${products.filter(p=>p.category===shopCategory).map(p=>`<article><strong>${p.name}</strong><p>${p.description}</p><button data-buy="${p.id}" ${p.locked||state.money<M.price(state,p.price)?'disabled':''}>${p.locked?(M.PLANTS[p.id]?'Nächsten Garten freischalten':'Maximum erreicht'):`Kaufen · ${M.price(state,p.price)} Münzen`}</button></article>`).join('')}</div><p class="sn-muted">Samen und Fallen nach dem Kauf auswählen. Fallen auf freien Wegen neben dem Beet aufstellen. Enten verbrauchen beim Nachtstart automatisch Futter.</p></div>`;sync();
    }
    function pause(){
      if(menu||!state||state.over||shop)return;
      if(paused){paused=false;dialog.hidden=true;canvas.focus({preventScroll:true});}
      else{show('Eine kleine Gartenpause','Deine Pflanzen und Schnecken warten. Der Spielstand ist gespeichert.','<button class="sn-button" data-action="resume">Weiterspielen</button><button class="sn-button sn-secondary" data-action="menu">Levelauswahl</button><a class="sn-button sn-secondary" href="#">Zurück zum Hauptmenü</a>');save();}sync();
    }
    on(host,'click',event=>{
      const button=event.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.character){character=button.dataset.character;menuView();return;}
      if(button.dataset.difficulty){difficulty=button.dataset.difficulty;menuView();return;}
      if(button.dataset.level!==undefined){level=Number(button.dataset.level);menuView();return;}
      if(button.dataset.shopCategory){openShop(button.dataset.shopCategory);return;}
      if(button.dataset.buy){M.buy(state,button.dataset.buy,campaign.unlocked);save();updateInventory();openShop();return;}
      if(button.dataset.tool){tool=button.dataset.tool;sync();canvas.focus({preventScroll:true});return;}
      const action=button.dataset.action;
      if(action==='new'){const saved=campaign.runs[`${level}:${difficulty}`];if(saved&&!saved.over){pane.hidden=false;setup.hidden=true;menu=false;show('Neue Partie beginnen?',`Nur der Spielstand in ${M.LEVELS[level].name} (${M.DIFFICULTIES[difficulty].label}) wird ersetzt. Bestwerte und Freischaltungen bleiben.`,`<button class="sn-button" data-action="restart">Neue Partie starten</button><button class="sn-button sn-secondary" data-action="menu">Abbrechen</button>`);}else enter(M.newRun(level,difficulty,character));}
      if(action==='restart')enter(M.newRun(level,difficulty,character));
      if(action==='continue')enter(campaign.runs[`${level}:${difficulty}`]);
      if(action==='menu')menuView();
      if(action==='shop')openShop();
      if(action==='close-shop'){shop=false;paused=false;dialog.hidden=true;sync();canvas.focus({preventScroll:true});}
      if(action==='pause')pause();
      if(action==='resume'){paused=false;dialog.hidden=true;sync();canvas.focus({preventScroll:true});}
      if(action==='night'&&!paused){M.beginNight(state);save();sync();canvas.focus({preventScroll:true});}
      if(action==='use')use();
    });
    on(select,'change',()=>{if(M.PLANTS[select.value]){seed=select.value;tool='seed';}else tool=`build:${select.value}`;sync();canvas.focus({preventScroll:true});});
    on(canvas,'pointerdown',e=>{if(paused||menu)return;canvas.focus({preventScroll:true});const rect=canvas.getBoundingClientRect(),point={x:(e.clientX-rect.left)/rect.width*960,y:(e.clientY-rect.top)/rect.height*640};if(M.dist(point,{x:835,y:175})<90){openShop();return;}if(state.phase==='day')use(point);else{const d=M.dist(point,state.player);if(d>0){state.player.dx=(point.x-state.player.x)/d;state.player.dy=(point.y-state.player.y)/d;}}});
    function moveJoy(e){if(joyPointer!==e.pointerId)return;const rect=joy.getBoundingClientRect();let x=(e.clientX-rect.left-rect.width/2)/(rect.width*.35),y=(e.clientY-rect.top-rect.height/2)/(rect.height*.35);const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}joystick={x,y};stick.style.transform=`translate(calc(-50% + ${x*30}px),calc(-50% + ${y*30}px))`;}
    on(joy,'pointerdown',e=>{if(menu||paused)return;e.preventDefault();joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);canvas.focus({preventScroll:true});});on(joy,'pointermove',moveJoy);
    const releaseJoy=e=>{if(e.pointerId===joyPointer){joyPointer=null;joystick={x:0,y:0};stick.style.transform='translate(-50%,-50%)';}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])on(joy,event,releaseJoy);
    const attackButton=host.querySelector('.sn-action');on(attackButton,'pointerdown',e=>{if(state?.phase==='night'&&!paused){e.preventDefault();hold=true;attackButton.setPointerCapture(e.pointerId);use();canvas.focus({preventScroll:true});}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])on(attackButton,event,()=>{hold=false;});
    on(document,'keydown',e=>{if(menu||e.target.closest('input,select,textarea'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','e','n','escape'].includes(key)){e.preventDefault();if(key==='escape'&&!e.repeat)pause();if(paused)return;keys.add(key);if(key===' '&&!e.repeat)use();if(key==='e'&&!e.repeat)openShop();if(key==='n'&&!e.repeat){M.beginNight(state);save();}}});
    on(document,'keyup',e=>keys.delete(e.key.toLowerCase()));
    const suspend=()=>{clear();save();if(!menu&&!paused&&!state?.over&&!shop)pause();};on(window,'blur',suspend);on(document,'visibilitychange',()=>{if(document.hidden)suspend();});on(window,'pagehide',save);on(document.querySelector('[data-info]'),'click',suspend);
    function loop(time){
      if(disposed)return;const dt=Math.min(.05,Math.max(0,(time-last)/1000));last=time;clock+=dt;
      if(state&&!menu){
        const input={x:joystick.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y:joystick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)};
        if(!paused){
          if((hold||keys.has(' '))&&state.phase==='night')M.attack(state);
          M.step(state,dt,input);
          if(state.over&&!lastOver){lastOver=true;gameOver();}
          else if(state.phase!==lastPhase){lastPhase=state.phase;save();updateInventory();if(state.phase==='day'){const unlocked=campaign.unlocked>lastUnlock;lastUnlock=campaign.unlocked;show(unlocked?'Ein neuer Garten ist frei!':`Nacht ${state.nights} überlebt`,`${state.lastIncome} Münzen für deine gegossenen Pflanzen.${unlocked?` ${M.LEVELS[campaign.unlocked].name} ist jetzt in der Levelauswahl verfügbar.`:''} Pflege deinen Garten für die nächste Nacht.`,`<button class="sn-button" data-action="resume">Weitergärtnern</button><button class="sn-button sn-secondary" data-action="menu">Levelauswahl</button>`);}}
          saveClock+=dt;if(saveClock>2){saveClock=0;save();}
        }
        hudClock+=dt;if(hudClock>.12){hudClock=0;sync();}for(const event of (state.coinEvents||[]).splice(0))coinEffects.push({...event,born:clock});
        coinEffects=coinEffects.filter(e=>clock-e.born<1.35);
        A.garden(context,state,clock,input,coinEffects);
      }
      frame=requestAnimationFrame(loop);
    }
    menuView();last=performance.now();frame=requestAnimationFrame(loop);
    return {dispose(){save();fullscreen.dispose();disposed=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());clear();}};
  };
})(globalThis);
