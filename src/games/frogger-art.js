(function(root) {
  'use strict';
  const D=root.FroggerLevels,M=root.FroggerModel;
  function projection(level,x,y){const scale=1-.2*y/(level.rows.length-1);return {x:480+(x-4)*82*scale,y:630-y*500/level.rows.length,scale,h:500/level.rows.length};}
  function draw(c,s,reduced=false){
    const l=s.level,w=D.WORLDS[l.world],t=reduced?0:s.time,p=(x,y)=>projection(l,x,y);
    const box=(x,y,width,height,color,r=6,edge=null)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,width,height,r);c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=2;c.stroke();}};
    const oval=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
    const line=(points,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
    const text=(value,x,y,color='#d9f6ef',size=12)=>{c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign='center';c.fillText(value,x,y);};
    c.fillStyle='#0d192b';c.fillRect(0,0,960,720);
    for(let i=0;i<42;i++)oval(i*197%960,i*73%100,1,1,w.color+'66');
    text(`${w.name.toUpperCase()} / ${l.id}`,480,37,w.color,14);text(l.name,480,72,'#e3fff5',24);
    for(let y=l.rows.length-1;y>=0;y--){
      const r=l.rows[y],a=p(-.5,y),b=p(8.5,y),water=['water','sink'].includes(r.kind),ph=M.phase(r,s.time);
      c.fillStyle=water?w.water:r.kind==='road'?'#1b263a':r.kind==='ice'?'#6086a3':w.ground;
      c.beginPath();c.moveTo(a.x,a.y-a.h/2);c.lineTo(b.x,a.y-a.h/2);c.lineTo(b.x+4,a.y+a.h/2);c.lineTo(a.x-4,a.y+a.h/2);c.closePath();c.fill();
      line([[a.x,a.y-a.h/2],[b.x,a.y-a.h/2]],w.color+'33',1);
      if(water)for(let i=0;i<13;i++){const x=a.x+(i*59+t*12)%(b.x-a.x);line([[x,a.y+Math.sin(i+t)*a.h*.25],[x+18,a.y+Math.sin(i+t)*a.h*.25]],'#79ebe53b',1);}
      if(r.kind==='road')for(let x=0;x<9;x++){const q=p(x,y);line([[q.x-12,q.y],[q.x+12,q.y]],'#9bb7c144');}
      if(r.kind==='ice')for(let x=0;x<9;x++){const q=p(x,y);line([[q.x-15,q.y+8],[q.x+9,q.y-7],[q.x+21,q.y-4]],'#d9faff99');}
      if(y===0||y===l.rows.length-1){const q=p(y===0?l.start.x:l.goal,y);box(q.x-32,q.y-14,64,28,y===0?'#21655b':'#74f7d0');if(y>0)text(l.friend&&!s.rescued?'FREUND?':'ZIEL',q.x,q.y+4,'#113744');}
      if(r.signal||r.pulse||r.kind==='sink'||r.wind||r.dock){const q=p(-.95,y);box(q.x-28,q.y-16,56,32,'#122238',5,ph.warning?'#ffe29a':ph.active&&r.kind==='road'?'#ff93a9':'#74f7d0');text(r.kind==='sink'?(ph.warning?'SINKT':ph.active?'BLATT':'WEG'):ph.label,q.x,q.y-2,'#e5fff5',9);text(`${Math.ceil(ph.remaining)} s`,q.x,q.y+11,'#e5fff5',10);}
      if(r.emergency){const ph=M.phase(r.emergency,s.time),q=p(9.05,y);box(q.x-28,q.y-16,56,32,'#233950',5,'#f2bc97');text(ph.warning?'BLAULICHT':ph.active?'STOP':'FREI',q.x,q.y-2,'#ffddb1',8);text(`${Math.ceil(ph.remaining)} s`,q.x,q.y+11,'#ffddb1',10);}
      c.save();c.beginPath();c.rect(a.x,a.y-a.h/2,b.x-a.x,a.h);c.clip();
      for(const o of M.objects(r,s.time)){
        const q=p(o.x+o.w/2,y),width=o.w*82*q.scale;
        if(water){
          if(r.kind==='sink'&&!ph.active){oval(q.x,q.y,width*.4,5,'#74f7d033');continue;}
          oval(q.x,q.y+8,width*.5,8,'#68fbe833');
          if(r.kind==='sink'||r.style==='lily'){oval(q.x,q.y,width*.47,Math.min(a.h*.3,18),ph.warning?'#dfc28e':'#58b895');line([[q.x-width*.4,q.y],[q.x+width*.4,q.y]],'#befab9');}
          else{box(q.x-width/2,q.y-11,width,24,o.danger?'#577b4a':r.style==='ice'?'#a7d7e8':r.style==='platform'?'#817ab7':r.style==='boat'?'#f3a1b0':'#826760',10,w.color);line([[q.x-width*.4,q.y-3],[q.x+width*.4,q.y-3]],'#ffffff55');if(o.danger){oval(q.x+width*.27,q.y-12,5,5,'#ffd18d');for(let i=0;i<4;i++)box(q.x-width*.25+i*width*.15,q.y-4,4,4,'#ebfacc',0);}if(r.style==='boat')box(q.x-width*.18,q.y-21,width*.36,17,'#314962');}
        }else if(r.kind==='road'&&o.active){
          if(r.style==='bike'){oval(q.x-width*.28,q.y+8,10,10,'#0d192b');oval(q.x+width*.28,q.y+8,10,10,'#0d192b');line([[q.x-width*.28,q.y+8],[q.x,q.y-8],[q.x+width*.12,q.y+8],[q.x-width*.28,q.y+8],[q.x+width*.28,q.y+8],[q.x+width*.1,q.y-15]],'#ff93a8',3);oval(q.x,q.y-23,7,7,'#e2bf9a');line([[q.x,q.y-16],[q.x-6,q.y-2],[q.x+8,q.y+7]],'#82d9d4',5);}
          else if(r.style==='ant'){oval(q.x,q.y,11,7,'#e5b88d');oval(q.x-15,q.y,7,5,'#ffd0a5');for(const side of [-1,1])line([[q.x-5,q.y],[q.x-15,q.y+side*12],[q.x-22,q.y+side*15]],'#e5b88d');}
          else{box(q.x-width/2,q.y-14,width,28,o.emergency?'#afd2ff':r.style==='beam'?'#ed8abf':r.style==='sled'?'#9edbef':'#ee91aa',7,'#ffdab7');if(r.style!=='beam'){box(q.x-width*.18,q.y-21,width*.36,18,'#39566b');oval(q.x-width*.3,q.y+14,8,5,'#0d192b');oval(q.x+width*.3,q.y+14,8,5,'#0d192b');if(o.emergency)box(q.x-8,q.y-24,16,5,'#6cc7ff',2);}}
        }
      }
      c.restore();
      for(const [i,f]of l.flies.entries())if(f.y===y&&!s.collected.includes(i)){const q=p(f.x,y),h=reduced?0:Math.sin(t*2+i)*3;oval(q.x,q.y-17+h,12,12,'#ffe49a33');oval(q.x,q.y-17+h,5,5,'#ffe49a');}
      if(l.friend&&l.friend.y===y&&!s.rescued){const q=p(l.friend.x,y);frog(q.x,q.y,.65,'#ffbf91');text('♥',q.x,q.y-32,'#ffdca1',15);}
      for(const portal of l.portals||[])if(portal.y===y){const q=p(portal.x,y);oval(q.x,q.y,25,13,'#c5b0ff55');c.strokeStyle='#d2bdff';c.lineWidth=3;c.beginPath();c.ellipse(q.x,q.y,25,13,0,0,Math.PI*2);c.stroke();text(portal.label,q.x,q.y+4,'#faf1ff');}
      if(s.player.y===y){const q=p(s.player.x,y);if(s.rescued)frog(q.x-27,q.y+10,.55,'#ffbf91');frog(q.x,q.y-(reduced?0:Math.sin(s.hop/M.HOP*Math.PI)*12),1,s.status==='lost'?'#d792b8':'#83f6c4');}
      for(const side of [-1,1]){const q=p(side<0?-1.6:9.6,y);if(l.world===4)box(q.x-14,q.y-18,28,26,'#534575',5,w.color);else if(l.world===3)line([[q.x-15,q.y+6],[q.x,q.y-21],[q.x+15,q.y+6]],'#b9e6f0',4);else{line([[q.x,q.y+7],[q.x-12,q.y-14],[q.x,q.y+7],[q.x+9,q.y-25]],w.color+'77',4);oval(q.x+9,q.y-25,5,7,'#f9a0b5');}}
    }
    text('↑ Ziel · ← ↓ → Wege erkunden · Sichere Inseln zum Warten',480,695,'#a3c2cb',12);
    function frog(x,y,scale,color){c.save();c.translate(x,y);c.scale(scale,scale);oval(0,9,22,8,'#06162688');oval(-16,5,10,6,color);oval(16,5,10,6,color);oval(0,-3,20,17,color);for(const side of [-1,1]){oval(side*12,-18,9,9,color);oval(side*12,-20,5,5,'#e4fff1');oval(side*12,-21,2.5,3,'#153541');}line([[-7,1],[0,4],[7,1]],'#276a62');c.restore();}
  }
  root.FroggerArt={draw,projection};
  if(typeof module!=='undefined'&&module.exports)module.exports={projection};
})(globalThis);
