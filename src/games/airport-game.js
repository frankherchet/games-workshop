(function(root){
  'use strict';
  root.Arcade.games.fluglotse=function({host}){
    const C=root.AirportConfig,M=root.AirportModel,Renderer=root.AirportRenderer;
    const STORE='cs-games:fluglotse:v1',listeners=[];
    let raw=null,storageOK=true;
    try{raw=JSON.parse(localStorage.getItem(STORE)||'null');}catch{storageOK=false;}
    const progress=new M.ProgressManager(raw);
    let session=new M.GameSession(C.stageConfig(0)),mode='menu',screenWorld=0;
    let selected=null,draft=[],pointerId=null,frame=0,last=0,disposed=false;
    host.innerHTML=`<div class="ap-root">
      <a class="back-link" href="#alle">← Zur Spieleübersicht</a>
      <div class="ap-heading"><div><div class="eyebrow">DIE FLUGWEGE LIEGEN IN DEINER HAND</div>
      <h1>Fluglotse <span>Airport Chaos</span></h1>
      <p>Plane die Anflüge, verhindere Kollisionen und lande jedes Flugzeug sicher.</p></div>
      <span class="ap-label">4 WELTEN · 48 STAGES</span></div>
      <section class="ap-play" aria-label="Fluglotsen-Spielfeld">
        <div class="ap-toolbar"><div class="ap-hud"><strong data-hud="stage">Provinz · Stage 1</strong>
        <span data-hud="landings">Landungen 0 / 4</span><span data-hud="stars" aria-label="3 mögliche Sterne">★★★</span>
        </div><div class="ap-actions">
        <button data-action="menu">Stages</button><button data-action="pause">Pause</button>
        <button data-action="fullscreen" aria-pressed="false">Vollbild</button></div></div>
        <div class="ap-stage"><canvas width="960" height="640" tabindex="0" aria-label="Fluglotse. Ein Flugzeug mit Maus oder Finger berühren und eine Flugroute zu seiner Landebahn zeichnen.">Canvas benötigt.</canvas>
        <div class="ap-overlay" role="dialog" aria-label="Fluglotse-Menü" aria-modal="true"></div></div>
        <p class="ap-status" role="status">Tippe ein Flugzeug an und zeichne eine Route zum passenden Landeplatz.</p>
      </section>
      <p class="ap-help">Gelbe Privat- und weiße oder blaue Linienflugzeuge landen auf <b>C</b>, Helikopter auf <b>H</b>, Militärjets auf <b>M</b>. 
      Ein Zusammenstoß oder ein verpasstes Flugzeug beendet den Versuch. Mit jedem Fehlversuch sinken die möglichen Sterne – beim komplett neuen Start erhältst du wieder drei.</p>
    </div>`;
    const pane=host.querySelector('.ap-play'),canvas=host.querySelector('canvas'),overlay=host.querySelector('.ap-overlay');
    const status=host.querySelector('.ap-status'),renderer=new Renderer(canvas);
    const fullscreen=root.ArcadeFullscreen.create({element:pane,button:host.querySelector('[data-action="fullscreen"]'),stage:host.querySelector('.ap-stage'),aspect:C.WIDTH/C.HEIGHT});
    const on=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
    const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
    function save(){
      try{localStorage.setItem(STORE,JSON.stringify(progress.serialize()));storageOK=true;}
      catch{storageOK=false;}
    }
    function hud(){
      const cfg=session.config;
      host.querySelector('[data-hud="stage"]').textContent=`${cfg.world.name} · Stage ${cfg.stage}/12 · ${cfg.airfieldCount} Flugplatz${cfg.airfieldCount>1?'e':''}`;
      host.querySelector('[data-hud="landings"]').textContent=`Landungen: ${session.landings} / ${cfg.requiredLandings} · Flugzeuge: ${session.aircraft.length}`;
      const text=stars(session.attempts.possibleStars),el=host.querySelector('[data-hud="stars"]');
      el.textContent=text;el.setAttribute('aria-label',session.attempts.possibleStars+' mögliche Sterne');
    }
    function draw(){hud();renderer.draw(session,selected,draft);}
    function display(title,description,buttons,menu=false){
      mode=menu?'menu':session.status==='failed'?'failed':session.status==='won'?'won':'paused';
      selected=null;draft=[];pointerId=null;
      overlay.hidden=false;
      overlay.innerHTML=`<div class="ap-dialog"><div class="eyebrow">FLUGLOTSE · AIRPORT CHAOS</div>
        <h2>${title}</h2><p>${description}</p><div class="ap-dialog-actions">${buttons}</div>
        <a class="ap-dialog-back" href="#alle">Zur Spieleübersicht</a></div>`;
      overlay.querySelector('button')?.focus({preventScroll:true});draw();
    }
    function menu(){
      mode='menu';screenWorld=Math.min(screenWorld,Math.floor(progress.unlocked/12));
      const worlds=C.LEVELS.map((world,i)=>`<button data-world="${i}" aria-pressed="${screenWorld===i}" ${i*12>progress.unlocked?'disabled':''}>${world.name}</button>`).join('');
      const cells=Array.from({length:12},(_,i)=>{
        const index=screenWorld*12+i,value=progress.completed[index],locked=!progress.canPlay(index);
        return `<button data-stage="${index}" ${locked?'disabled':''} aria-label="Stage ${i+1}, ${locked?'gesperrt':value===null?'offen':value+' Sterne'}">
          <small>STAGE ${i+1}</small><strong>${i+1}</strong>
          <span>${locked?'🔒':value===null?'○':stars(value)}</span><small>${Math.ceil((i+1)/3)} FLUGPLATZ${i>=3?'E':''}</small></button>`;
      }).join('');
      overlay.hidden=false;overlay.innerHTML=`<div class="ap-dialog ap-menu">
        <div class="eyebrow">DEINE FLUGLEITUNG · ${progress.totalStars}/144 STERNE</div>
        <h2>Wähle deine Stage</h2>
        <p>Schließe jede Stage mit den erforderlichen Landungen ab. Für eine neue Welt musst du alle zwölf Stages der vorherigen schaffen.</p>
        <div class="ap-worlds">${worlds}</div><div class="ap-levels">${cells}</div>
        <p class="ap-storage">${storageOK?'Fortschritt wird nur auf diesem Gerät gespeichert.':'Speichern ist in diesem Browser nicht verfügbar.'}</p>
        <a class="ap-dialog-back" href="#alle">Zur Spieleübersicht</a></div>`;
      overlay.querySelector('button:not(:disabled)')?.focus({preventScroll:true});draw();
    }
    function runStage(index){
      if(!progress.canPlay(index))return;
      session=new M.GameSession(C.stageConfig(index));
      screenWorld=Math.floor(index/12);selected=null;draft=[];mode='playing';overlay.hidden=true;
      status.textContent='Flugzeug antippen und Route zum passenden Landeplatz zeichnen.';
      last=performance.now();canvas.focus({preventScroll:true});draw();
    }
    function pause(){
      if(mode==='playing'){
        display('Flugverkehr pausiert','Alle Flugzeuge stehen still. Du kannst deinen Anflug fortsetzen.',
          '<button data-action="resume">Weiterfliegen</button><button data-action="menu">Stage-Auswahl</button>');
        status.textContent='Pause';
      }else if(mode==='paused')resume();
    }
    function resume(){mode='playing';overlay.hidden=true;last=performance.now();canvas.focus({preventScroll:true});}
    function settle(){
      if(mode!=='playing')return;
      if(session.status==='failed'){
        const reason=session.failureReason==='AIRCRAFT_COLLISION'?'Zwei Flugzeuge sind zusammengestoßen.':'Ein Flugzeug hat das Spielfeld ohne Landung verlassen.';
        display('Stage gescheitert',`${reason} Noch ${session.attempts.possibleStars} von 3 Sternen möglich.`,
          '<button data-action="retry">Erneut versuchen</button><button data-action="regenerate">Stage komplett neu starten</button><button data-action="menu">Stage-Auswahl</button>');
        status.textContent=reason;
      }else if(session.status==='won'){
        const value=session.attempts.possibleStars,previous=progress.completed[session.config.index];
        progress.record(session.config.index,value);save();
        const saved=progress.completed[session.config.index];
        const finish=session.config.index===C.TOTAL-1;
        display(finish?'Alle Welten geschafft!':'Stage abgeschlossen!',
          `${stars(saved)} · ${session.landings} sichere Landungen. ${previous!==null?'Deine erste Sternebewertung bleibt gespeichert.':'Die nächste Stage ist freigeschaltet.'}`,
          `${finish?'':'<button data-action="next">Nächste Stage</button>'}<button data-action="again">Stage erneut spielen</button><button data-action="menu">Stage-Auswahl</button>`);
        status.textContent='Alle Flugzeuge sicher gelandet!';
      }
    }
    function coordinates(e){
      const r=canvas.getBoundingClientRect();
      return {x:M.clamp((e.clientX-r.left)/r.width*C.WIDTH,0,C.WIDTH),
        y:M.clamp((e.clientY-r.top)/r.height*C.HEIGHT,0,C.HEIGHT)};
    }
    on(canvas,'pointerdown',e=>{
      if(mode!=='playing')return;
      const point=coordinates(e);
      const touchRadius=Math.max(30,24*C.WIDTH/canvas.getBoundingClientRect().width);
      const closest=session.aircraft.reduce((best,p)=>M.distance(point,p)<(best?.dist??touchRadius)&&M.distance(point,p)<Math.max(touchRadius,p.radius+13)?{id:p.id,dist:M.distance(point,p)}:best,null);
      if(!closest)return;
      selected=closest.id;draft=[];pointerId=e.pointerId;
      canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});e.preventDefault();
    });
    on(canvas,'pointermove',e=>{
      if(pointerId!==e.pointerId||mode!=='playing')return;
      const p=coordinates(e);
      if(!draft.length||M.distance(p,draft[draft.length-1])>10)draft.push(p);
      if(draft.length>160)draft.splice(1,1);
      draw();e.preventDefault();
    });
    on(canvas,'pointerup',e=>{
      if(e.pointerId!==pointerId)return;
      const target=coordinates(e);
      if(draft.length){
        const lastPoint=draft[draft.length-1];
        if(M.distance(lastPoint,target)>3)draft.push(target);
        const plane=session.aircraft.find(p=>p.id===selected);
        // A nearby compatible landing zone captures the route endpoint.
        const zone=session.instance.zones.find(z=>plane&&z.accepts(plane)&&M.distance(z,target)<52);
        if(zone)draft.push({x:zone.x,y:zone.y});
        session.assignRoute(selected,draft);
        status.textContent=zone?'Route zum passenden Landeplatz gesetzt.':'Flugroute gesetzt. Achte auf die richtige Landebahn!';
      }
      selected=null;pointerId=null;draft=[];draw();e.preventDefault();
    });
    for(const event of ['pointercancel','lostpointercapture'])on(canvas,event,()=>{
      if(pointerId!==null){pointerId=null;selected=null;draft=[];draw();}
    });
    on(host,'click',e=>{
      const button=e.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.world!==undefined){screenWorld=Number(button.dataset.world);menu();return;}
      if(button.dataset.stage!==undefined){runStage(Number(button.dataset.stage));return;}
      switch(button.dataset.action){
        case 'menu':menu();break;
        case 'pause':pause();break;
        case 'resume':resume();break;
        case 'retry':session.retry();mode='playing';overlay.hidden=true;last=performance.now();status.textContent='Gleiche Welt, neuer Versuch.';draw();break;
        case 'regenerate':session.regenerate();mode='playing';overlay.hidden=true;last=performance.now();status.textContent='Neue Welt, wieder drei mögliche Sterne.';draw();break;
        case 'next':runStage(session.config.index+1);break;
        case 'again':runStage(session.config.index);break;
      }
    });
    on(document,'keydown',e=>{
      if(e.target.closest('dialog'))return;
      if(e.key==='Escape'){if(mode==='playing'){e.preventDefault();pause();}else if(mode==='paused'){e.preventDefault();resume();}}
    });
    const info=document.querySelector('[data-info]');if(info)on(info,'click',()=>{if(mode==='playing')pause();});
    on(window,'blur',()=>{if(mode==='playing')pause();});
    on(document,'visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
    function loop(time){
      if(disposed)return;
      const dt=Math.max(0,Math.min(.12,(time-last)/1000));last=time;
      if(mode==='playing'){session.step(dt);settle();}draw();
      frame=requestAnimationFrame(loop);
    }
    menu();last=performance.now();frame=requestAnimationFrame(loop);
    return {pause,reset(){runStage(session.config.index);},start(){if(mode==='paused')resume();},dispose(){
      disposed=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());fullscreen.dispose();
    }};
  };
})(globalThis);
