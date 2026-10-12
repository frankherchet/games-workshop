(function (root) {
  'use strict';

  // The prototype intentionally uses native WebGL: no CDN, no game server or
  // Node.js is needed to play it on the ALL-INKL webspace.
  const MODES = ['duo', 'horseOnly'];
  const SPEEDS = [2.7, 4.4, 6.6];
  function newState(mode) {
    return {
      mode: MODES.includes(mode) ? mode : 'duo',
      player: { x: 0, z: -1, heading: 0, form: mode === 'horseOnly' ? 'horse' : 'human', jump: 0, walk: 0 },
      companion: { x: 1.7, z: -2.5, heading: 0, form: 'horse', jump: 0, walk: 0 },
      active: 'player', gait: 0, following: true, stars: [false, false, false],
    };
  }
  function switchTarget(s) {
    if (s.mode !== 'duo') return false;
    s.active = s.active === 'player' ? 'companion' : 'player';
    return true;
  }
  function transform(s) {
    if (s.mode !== 'duo') return false;
    s.player.form = s.player.form === 'human' ? 'horse' : 'human';
    return true;
  }
  function collected(s) { return s.stars.filter(Boolean).length; }
  root.Arcade.pferdezauberLogic = { newState, switchTarget, transform, collected };

  root.Arcade.games.pferdezauber = function ({ host }) {
    const html = [
      '<div class="pz">',
      ' <div class="pz-top"><a href="#alle" class="pz-back">← Zur Spieleübersicht</a><div><span class="pz-spark">✦</span> PFERDEZAUBER <small>3D-Spielwiese · Prototyp</small></div></div>',
      ' <div class="pz-scene">',
      '  <canvas class="pz-canvas" aria-label="Dreidimensionale Pferdewiese. Nutze Tastatur oder die Schaltflächen zur Steuerung."></canvas>',
      '  <div class="pz-hud"><div class="pz-hudcard"><span>✨ Lichtfunken</span><b data-stars>0 / 3</b></div><div class="pz-hudcard"><span>Du steuerst</span><b data-active>Mensch</b></div></div>',
      '  <div class="pz-notice" role="status" aria-live="polite" data-notice>Willkommen im Tal der Wandelwinde!</div>',
      '  <div class="pz-pad" aria-label="Bewegen"><button data-move="up" aria-label="Vorwärts">▲</button><div><button data-move="left" aria-label="Nach links">◀</button><button data-move="down" aria-label="Rückwärts">▼</button><button data-move="right" aria-label="Nach rechts">▶</button></div></div>',
      '  <div class="pz-actions"><button data-act="switch" title="Figur wechseln (Q)">⇄ <span>Wechseln</span></button><button data-act="transform" title="Verwandeln (T)">✦ <span>Verwandeln</span></button><button data-act="gait" title="Gangart (G)">♞ <span>Schritt</span></button><button data-act="jump" title="Springen (Leertaste)">↥ <span>Springen</span></button></div>',
      '  <div class="pz-entry" data-entry><div class="pz-entry-card"><span class="pz-eyebrow">WILLKOMMEN IN DEINER WELT</span><h1>Pferdezauber</h1><p>Laufe über grüne Wiesen, entdecke drei Lichtfunken und wechsle zwischen Mensch und Pferd.</p>',
      '   <div class="pz-choice"><button data-mode="duo">🐴 Mensch + Pferd <small>Begleiter, Figurenwechsel & Verwandlung</small></button><button data-mode="horseOnly">🐎 Nur Pferd <small>Die Welt auf vier Hufen entdecken</small></button></div>',
      '   <p class="pz-note">Kostenlose 3D-Demo · kein Konto · kein Online-Spielstand · keine externen Inhalte</p>',
      '  </div></div>',
      '  <div class="pz-error" data-error hidden></div>',
      ' </div>',
      ' <div class="pz-info"><p><strong>Deine erste Mission:</strong> Sammle die drei goldenen Lichtfunken auf der Wiese. Du kannst jederzeit die Spielfigur wechseln oder dich verwandeln.</p>',
      ' <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> bewegen · <kbd>Q</kbd> Figur wechseln · <kbd>T</kbd> verwandeln · <kbd>G</kbd> Gangart · <kbd>Leertaste</kbd> springen. Kamera: mit Maus oder Finger ziehen.</div>',
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
    const keys = new Set();
    let state = newState('duo'), started = false, alive = true, raf = 0, last = 0, noticeUntil = 0;
    let cameraYaw = 0.18, camX = 0, camZ = 0, dragging = null;
    const stars = [{ x: 5, z: 5 }, { x: -8, z: 8 }, { x: 13, z: -10 }];
    const PI = Math.PI;
    function hint(message) {
      notice.textContent = message;
      notice.classList.add('pz-visible');
      noticeUntil = performance.now() + 3800;
    }
    function reset(mode) {
      state = newState(mode);
      cameraYaw = 0.18; camX = state.player.x; camZ = state.player.z;
      started = true; entry.hidden = true;
      keys.clear(); updateHud();
      hint('Entdecke drei goldene Lichtfunken! ✨');
    }
    function updateHud() {
      starText.textContent = collected(state) + ' / 3';
      const controlled = state.active === 'player' ? state.player : state.companion;
      activeText.textContent = state.active === 'companion' ? 'Begleitpferd' :
        controlled.form === 'human' ? 'Mensch' : state.mode === 'horseOnly' ? 'Dein Pferd' : 'Zauberpferd';
      shell.querySelector('[data-act="switch"]').disabled = state.mode !== 'duo' || !started;
      shell.querySelector('[data-act="transform"]').disabled = state.mode !== 'duo' || !started;
      shell.querySelector('[data-act="gait"]').disabled = !started;
      shell.querySelector('[data-act="jump"]').disabled = !started;
      shell.querySelector('[data-act="follow"]').disabled = state.mode !== 'duo' || !started;
      shell.querySelector('[data-act="gait"] span').textContent = ['Schritt','Trab','Galopp'][state.gait];
      shell.querySelector('[data-act="follow"]').textContent = '🐴 Begleiter: ' + (state.following ? 'Folgen' : 'Warten');
    }
    function action(act) {
      if (act === 'restart') { started = false; entry.hidden = false; keys.clear(); updateHud(); return; }
      if (!started) return;
      if (act === 'switch') { if (switchTarget(state)) hint('Jetzt steuerst du die andere Figur.'); }
      if (act === 'transform') { if (transform(state)) hint(state.player.form === 'horse' ? 'Du bist jetzt ein Zauberpferd! ✨' : 'Zurückverwandelt: Du bist wieder Mensch!'); }
      if (act === 'gait') { state.gait = (state.gait + 1) % 3; hint('Gangart: ' + ['Schritt','Trab','Galopp'][state.gait]); }
      if (act === 'follow') { state.following = !state.following; hint(state.following ? 'Dein Begleiter folgt dir.' : 'Dein Begleiter wartet.'); }
      if (act === 'jump') {
        const ent = state.active === 'player' ? state.player : state.companion;
        if (ent.jump <= 0) ent.jump = 0.001;
      }
      updateHud();
    }
    function onClick(event) {
      const mode = event.target.closest('[data-mode]');
      if (mode) { reset(mode.dataset.mode); return; }
      const button = event.target.closest('[data-act]');
      if (button) action(button.dataset.act);
    }
    shell.addEventListener('click', onClick);
    const keyMap = { arrowup:'up', w:'up', arrowleft:'left', a:'left', arrowdown:'down', s:'down', arrowright:'right', d:'right' };
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || !alive) return;
      const key = e.key.toLowerCase();
      if (keyMap[key] || ['q','t','g','f',' '].includes(key)) e.preventDefault();
      if (keyMap[key]) keys.add(keyMap[key]);
      if (e.repeat) return;
      if (key === 'q') action('switch');
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
    let prog, staticBuffer, dynamicBuffer;
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
    staticBuffer = gl.createBuffer(); dynamicBuffer = gl.createBuffer();
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
      return new Float32Array(m.a);
    }
    const ground=worldMesh();
    gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,ground,gl.STATIC_DRAW);

    function local(p,lx,y,lz){const co=Math.cos(p.heading),si=Math.sin(p.heading);return [p.x+lx*co+lz*si,y,p.z+lz*co-lx*si];}
    function limb(m,p,lx,y,lz,w,h,d,c) {
      const v=local(p,lx,y,lz);box(m,v[0],v[1],v[2],w,h,d,c,p.heading);
    }
    function blob(m,p,lx,y,lz,rx,ry,rz,c) {
      const v=local(p,lx,y,lz);ellipsoid(m,v[0],v[1],v[2],rx,ry,rz,c,p.heading);
    }
    function horse(m,p,t,isCompanion) {
      const foal=false,scale=1,fur=isCompanion?[.74,.49,.32]:[.82,.71,.56];
      const bob=Math.sin(p.walk*9)*.035, lift=p.jump>0?Math.sin(p.jump*PI/.78)*.8:0;
      const pose={...p};
      // body proportions use y offsets while the whole horse can jump
      const base=lift+bob;
      blob(m,pose,0,1.38+base,0,.56,.49,.95,fur);
      blob(m,pose,0,1.65+base,.60,.32,.59,.36,fur);
      blob(m,pose,0,1.89+base,.96,.33,.34,.43,fur);
      blob(m,pose,0,1.71+base,1.26,.30,.20,.34,[.81,.71,.65]);
      for(const side of [-1,1]){
        blob(m,pose,side*.19,2.21+base,.92,.115,.25,.11,fur);
        blob(m,pose,side*.27,1.96+base,1.21,.055,.055,.05,[.14,.16,.18]);
      }
      blob(m,pose,0,1.89+base,.61,.16,.38,.18,[.36,.27,.22]); // mane
      for(const side of [-1,1]) for(const z of [-.61,.60]){
        const pace=Math.sin(p.walk*8+(side===1?PI:0)+(z<0?PI*.65:0))*.14;
        limb(m,pose,side*.37,.62+base,z+pace,.21,1.12,.25,fur);
        limb(m,pose,side*.37,.105+lift,z+pace,.25,.21,.33,[.32,.33,.34]);
      }
      blob(m,pose,0,1.08+base,-1.02,.17,.25,.55,[.40,.28,.22]);
      // Saddle blanket on the companion makes the two horses distinguishable.
      if(isCompanion)blob(m,pose,0,1.83+base,-.12,.55,.12,.66,[.35,.56,.70]);
    }
    function human(m,p) {
      const moving=Math.sin(p.walk*9),lift=p.jump>0?Math.sin(p.jump*PI/.78)*.75:0;
      const skin=[.91,.71,.56],shirt=[.59,.44,.70],jeans=[.34,.49,.62];
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
    function sparkle(m,s,t) {
      const y=1.05+Math.sin(t*2+s.x)*.15;
      ellipsoid(m,s.x,y,s.z,.31,.31,.31,[.98,.79,.29]);
      cone(m,s.x,y+.19,s.z,.23,.48,[1,.91,.61],4);
      cone(m,s.x,y-.57,s.z,.23,.38,[1,.91,.61],4);
      ellipsoid(m,s.x,.02,s.z,.62,.025,.62,[.84,.78,.45]);
    }
    function sceneDynamic(t) {
      const m=mesh();
      // A soft ground shadow anchors the stylised figures to the meadow.
      for(const p of state.mode==='duo'?[state.player,state.companion]:[state.player]) {
        ellipsoid(m,p.x,.01,p.z,.73,.022,.87,[.33,.52,.32]);
        if(p.form==='human')human(m,p);else horse(m,p,t,p===state.companion);
      }
      for(let i=0;i<stars.length;i++)if(!state.stars[i])sparkle(m,stars[i],t);
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
    function draw(buffer,data,usage) {
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      if(data)gl.bufferData(gl.ARRAY_BUFFER,data,usage);
      for(const [attr,offset] of [[aPos,0],[aNorm,12],[aColor,24]]) {
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr,3,gl.FLOAT,false,36,offset);
      }
      gl.drawArrays(gl.TRIANGLES,0,(data||ground).length/9);
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
        move(entity,dx,dz,entity.form==='human'?2.8:SPEEDS[state.gait],dt);
      }
      if(entity.jump>0){entity.jump+=dt;if(entity.jump>=.78)entity.jump=0;}
      if(state.mode==='duo'&&state.following) {
        const other=state.active==='player'?state.companion:state.player;
        const dx=entity.x-other.x,dz=entity.z-other.z,dist=Math.hypot(dx,dz);
        if(dist>2.5)move(other,dx,dz,Math.min(5,2.6+(dist-2.5)*.65),dt);
      }
      for(let i=0;i<stars.length;i++){
        const s=stars[i];
        if(!state.stars[i]&&Math.hypot(entity.x-s.x,entity.z-s.z)<1.35){
          state.stars[i]=true;updateHud();
          if(collected(state)===3)hint('✨ Geschafft! Alle drei Lichtfunken entdeckt. Das Abenteuer beginnt!');
          else hint('✨ Lichtfunke entdeckt! Finde die übrigen.');
        }
      }
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
      const eye=[camX-Math.sin(cameraYaw)*8.8,5.2,camZ-Math.cos(cameraYaw)*8.8];
      gl.uniformMatrix4fv(uPV,false,multiply(perspective(w/h),lookAt(eye,[camX,1.15,camZ])));
      draw(staticBuffer,null,gl.STATIC_DRAW);
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
        gl.deleteBuffer(staticBuffer);gl.deleteBuffer(dynamicBuffer);gl.deleteProgram(prog);
      }
    };
  };
})(globalThis);
