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
    const shade=(y,height,top,bottom)=>{const g=c.createLinearGradient(0,y,0,y+height);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;};
    const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,l.world===4?'#181a3d':'#0d192b');sky.addColorStop(1,'#142c37');c.fillStyle=sky;c.fillRect(0,0,960,720);
    if(l.world===0||l.world===2)for(let i=0;i<13;i++){const x=i*82,y=122+(i%3)*8;box(x-4,y-20,8,30,'#173c3c',2);oval(x,y-35,30,32,'#24514b');oval(x-12,y-37,19,25,'#286254');oval(x+7,y-48,20,18,'#377565');}
    if(l.world===1)for(let i=0;i<16;i++){const x=i*65,h=55+(i%4)*18;box(x,159-h,42,h,shade(159-h,h,'#355167','#172b3f'),2);for(let j=0;j<3;j++)for(let k=0;k<3;k++)box(x+8+j*9,168-h+k*14,4,6,(i+j+k)%3?'#ffc29a66':'#74f7d077',0);line([[x,160-h],[x+42,160-h]],'#bda0d544',1);}
    if(l.world===3){c.globalAlpha=.18;for(let i=0;i<5;i++)line([[0,90+i*5],[200,22+i*8],[400,95+i*5],[620,34+i*7],[960,78+i*4]],i%2?'#b6b0ff':'#8ffad4',9);c.globalAlpha=1;}
    if(l.world===4){oval(805,80,45,45,shade(35,90,'#af93d1','#44335f'));c.save();c.translate(805,80);c.rotate(-.35);c.strokeStyle='#ccb9f488';c.lineWidth=4;c.beginPath();c.ellipse(0,0,67,15,0,0,Math.PI*2);c.stroke();c.restore();}
    for(let i=0;i<42;i++)oval(i*197%960,i*73%100,1,1,w.color+'66');
    text(`${w.name.toUpperCase()} / ${l.id}`,480,37,w.color,14);text(l.name,480,72,'#e3fff5',24);
    for(let y=l.rows.length-1;y>=0;y--){
      const r=l.rows[y],a=p(-.5,y),b=p(8.5,y),water=['water','sink'].includes(r.kind),ph=M.phase(r,s.time);
      c.fillStyle=water?shade(a.y-a.h/2,a.h,w.water,'#112e3d'):r.kind==='road'?shade(a.y-a.h/2,a.h,'#293648','#182438'):r.kind==='ice'?shade(a.y-a.h/2,a.h,'#91c8d4','#527b9d'):shade(a.y-a.h/2,a.h,w.ground,'#162e33');
      c.beginPath();c.moveTo(a.x,a.y-a.h/2);c.lineTo(b.x,a.y-a.h/2);c.lineTo(b.x+4,a.y+a.h/2);c.lineTo(a.x-4,a.y+a.h/2);c.closePath();c.fill();
      line([[a.x,a.y-a.h/2],[b.x,a.y-a.h/2]],w.color+'33',1);
      if(r.kind==='safe'){
        line([[a.x-4,a.y+a.h/2-3],[b.x+4,a.y+a.h/2-3]],'#081c2880',5);
        for(let i=0;i<30;i++){const x=a.x+((i*79+y*43)%(b.x-a.x)),yy=a.y+((i*17+y*11)%Math.max(1,a.h-10))-a.h/2+5;oval(x,yy,1.5,1,(i+y)%3?'#8dcaae26':'#ffd9a322');}
      }
      if(r.kind==='safe')for(let x=0;x<9;x++){
        const q=p(x,y);oval(q.x,q.y+7,22*q.scale,3,'#74f7d00b');
        if(x!==l.start.x&&x!==l.goal){const offset=(x+y)%2?12:-12;line([[q.x+offset,q.y+9],[q.x+offset-3,q.y+5],[q.x+offset,q.y+9],[q.x+offset+4,q.y+3]],w.color+'4d',1.5);}
      }
      if(water){
        for(let i=0;i<17;i++){const x=a.x+(i*59+t*10)%(b.x-a.x),yy=a.y+Math.sin(i+t*.7)*a.h*.3;line([[x,yy],[Math.min(b.x,x+15+i%4*7),yy]],i%3?'#70d5dd40':'#c2fff660',1);}
        line([[a.x,a.y-a.h/2+2],[b.x,a.y-a.h/2+2]],'#6ae2d870',2);
      }
      if(r.kind==='road')for(let x=0;x<9;x++){const q=p(x,y);line([[q.x-12,q.y],[q.x+12,q.y]],'#9bb7c144');}
      if(r.kind==='ice')for(let x=0;x<9;x++){const q=p(x,y);line([[q.x-15,q.y+8],[q.x+9,q.y-7],[q.x+21,q.y-4]],'#d9faff99');}
      for(const x of r.blocked||[]){const q=p(x,y);box(q.x-29*q.scale,q.y-14,58*q.scale,28,l.world===3?'#567489':'#806170',7,l.world===3?'#bde8ee':'#e6a4ae');if(l.world===1){line([[q.x-26*q.scale,q.y-17],[q.x+26*q.scale,q.y-17]],'#ffb18b',7);text('×',q.x,q.y+6,'#ffe7cf',16);}}
      if(y===0||y===l.rows.length-1){const q=p(y===0?l.start.x:l.goal,y);box(q.x-35,q.y-14,70,32,'#142b30',7);box(q.x-32,q.y-17,64,28,shade(q.y-17,28,y===0?'#428f7e':'#a1ffdd',y===0?'#23574f':'#46c6ab'),6,y===0?'#72e9c580':'#c9ffec');if(y>0){text(l.friend&&!s.rescued?'FREUND?':'ZIEL',q.x,q.y+1,'#113744');line([[q.x-24,q.y+7],[q.x+24,q.y+7]],'#167d7633',1);}}
      if(r.signal||r.pulse||r.kind==='sink'||r.wind||r.dock){const q=p(-.95,y);box(q.x-28,q.y-16,56,32,'#122238',5,ph.warning?'#ffe29a':ph.active&&r.kind==='road'?'#ff93a9':'#74f7d0');text(r.kind==='sink'?(ph.warning?(r.style==='ice'?'BRICHT':'SINKT'):ph.active?(r.style==='ice'?'EIS':'BLATT'):'WEG'):ph.label,q.x,q.y-2,'#e5fff5',9);text(`${Math.ceil(ph.remaining)} s`,q.x,q.y+11,'#e5fff5',10);}
      if(r.emergency){const ph=M.phase(r.emergency,s.time),q=p(9.05,y);box(q.x-28,q.y-16,56,32,'#233950',5,'#f2bc97');text(ph.warning?'BLAULICHT':ph.active?'STOP':'FREI',q.x,q.y-2,'#ffddb1',8);text(`${Math.ceil(ph.remaining)} s`,q.x,q.y+11,'#ffddb1',10);}
      c.save();c.beginPath();c.rect(a.x,0,b.x-a.x,720);c.clip();
      for(const o of M.objects(r,s.time)){
        if(o.x+o.w<-.5||o.x>8.5)continue;
        const q=p(o.x+o.w/2,y),width=o.w*82*q.scale;
        if(water){
          if(r.kind==='sink'&&!ph.active){oval(q.x,q.y,width*.4,5,'#74f7d033');continue;}
          oval(q.x,q.y+12,width*.52,9,'#061d3280');
          c.strokeStyle='#8eece24d';c.lineWidth=1;c.beginPath();c.ellipse(q.x,q.y+9,width*.54,11,0,0,Math.PI*2);c.stroke();
          if(r.style==='ice'){box(q.x-width/2,q.y-11,width,23,ph.warning?'#dbcfa7':'#a7d7e8',9,'#dbf9fa');line([[q.x-14,q.y+6],[q.x+5,q.y-6],[q.x+18,q.y+3]],'#6489a3');}
          else if(r.kind==='sink'||r.style==='lily'){const h=Math.min(a.h*.3,18);oval(q.x,q.y+3,width*.47,h,'#246653');oval(q.x,q.y,width*.47,h,shade(q.y-h,h*2,ph.warning?'#e6ce9a':'#9ad3a3',ph.warning?'#a58d62':'#3b9c7d'));for(const angle of [-.5,0,.5])line([[q.x,q.y],[q.x+width*.39,q.y+angle*h]],'#c1edb566',1);oval(q.x-width*.12,q.y-4,7,4,'#e4a3c5');oval(q.x-width*.12,q.y-6,3,2,'#ffe6bb');}
          else if(!o.danger&&r.style==='log'){
            box(q.x-width/2,q.y-6,width,23,'#3c3940',11);box(q.x-width/2,q.y-13,width,25,shade(q.y-13,25,'#b88c78','#68514f'),11,'#d5b29c');
            for(let i=0;i<3;i++)line([[q.x-width*.43,q.y-7+i*6],[q.x-width*.16,q.y-9+i*6],[q.x+width*.34,q.y-6+i*6]],'#60494066',1);
            oval(q.x+width/2-9,q.y,8,11,'#c09b80');c.strokeStyle='#70574e';c.lineWidth=1.5;c.beginPath();c.ellipse(q.x+width/2-9,q.y,4,7,0,0,Math.PI*2);c.stroke();
            line([[q.x-width*.36,q.y-11],[q.x-width*.02,q.y-12],[q.x+width*.16,q.y-9]],'#83bb9377',3);
          }else{
            box(q.x-width/2,q.y-4,width,22,'#273043',10);box(q.x-width/2,q.y-13,width,24,shade(q.y-13,24,o.danger?'#86aa68':r.style==='platform'?'#a99acc':'#f3b7bb',o.danger?'#405a45':r.style==='platform'?'#5f5684':'#b66b93'),10,w.color);
            line([[q.x-width*.4,q.y-7],[q.x+width*.4,q.y-7]],'#ffffff55');
            if(o.danger){for(let i=0;i<5;i++)oval(q.x-width*.3+i*width*.12,q.y-10,4,3,'#40644b');for(const side of [-1,1]){oval(q.x+width*.32,q.y+side*6,5,5,'#ecdc99');oval(q.x+width*.34,q.y+side*6,2,2,'#213934');}for(let i=0;i<4;i++)box(q.x+width*.1+i*width*.08,q.y+5,4,3,'#ebfacc',0);}
            if(r.style==='boat'){box(q.x-width*.18,q.y-24,width*.36,20,shade(q.y-24,20,'#6f91a4','#314962'));box(q.x-width*.14,q.y-20,width*.28,9,'#acebe9');}
            if(r.style==='platform')for(let i=0;i<4;i++)line([[q.x-width*.38+i*width*.24,q.y-9],[q.x-width*.38+i*width*.24,q.y+6]],'#d0c6f333',1);
          }
        }else if(r.kind==='road'&&o.active){
          if(r.style==='bike'){oval(q.x-width*.28,q.y+8,10,10,'#0d192b');oval(q.x+width*.28,q.y+8,10,10,'#0d192b');line([[q.x-width*.28,q.y+8],[q.x,q.y-8],[q.x+width*.12,q.y+8],[q.x-width*.28,q.y+8],[q.x+width*.28,q.y+8],[q.x+width*.1,q.y-15]],'#ff93a8',3);oval(q.x,q.y-23,7,7,'#e2bf9a');line([[q.x,q.y-16],[q.x-6,q.y-2],[q.x+8,q.y+7]],'#82d9d4',5);}
          else if(r.style==='ant'){oval(q.x,q.y,11,7,'#e5b88d');oval(q.x-15,q.y,7,5,'#ffd0a5');for(const side of [-1,1])line([[q.x-5,q.y],[q.x-15,q.y+side*12],[q.x-22,q.y+side*15]],'#e5b88d');}
          else if(r.style==='duck'){oval(q.x,q.y+3,19,10,'#f2cf9b');oval(q.x+13,q.y-7,10,10,'#e6c695');oval(q.x+16,q.y-9,2,2,'#192c3a');box(q.x+21,q.y-7,10,5,'#f29f7d',2);}
          else if(r.style==='gate'){box(q.x-width/2,q.y-14,width,28,'#826f9e',3,'#f8c2f1');for(let x=q.x-width/2+15;x<q.x+width/2;x+=30)line([[x,q.y-12],[x-14,q.y+12]],'#ded1ff',4);}
          else{
            oval(q.x,q.y+16,width*.53,7,'#06132188');
            box(q.x-width/2,q.y-8,width,27,'#5c465b',8);box(q.x-width/2,q.y-16,width,28,shade(q.y-16,28,o.emergency?'#d8e9ff':r.style==='beam'?'#f4b0d6':r.style==='sled'?'#d1edf4':'#ffaac2',o.emergency?'#789ecb':r.style==='beam'?'#b75eae':r.style==='sled'?'#719fae':'#b75b85'),8,'#ffdab7');
            if(r.style!=='beam'){box(q.x-width*.2,q.y-23,width*.4,19,shade(q.y-23,19,'#8bb3c4','#354e6a'),6);line([[q.x-width*.15,q.y-20],[q.x+width*.06,q.y-20]],'#c8eef4aa',2);oval(q.x-width*.3,q.y+15,8,6,'#0b1728');oval(q.x+width*.3,q.y+15,8,6,'#0b1728');for(const side of [-1,1]){oval(q.x+side*width*.3,q.y+15,3,3,'#82929f');box(q.x+side*(width*.5-7)-3,q.y-6,6,7,side===Math.sign(r.speed)?'#ffe6ae':'#fe869d',2);}if(o.emergency)box(q.x-8,q.y-25,16,5,'#6cc7ff',2);}
          }
        }
      }
      c.restore();
      for(const [i,f]of l.flies.entries())if(f.y===y&&!s.collected.includes(i)){const q=p(f.x,y),h=reduced?0:Math.sin(t*2+i)*3;c.shadowColor='#ffe49a';c.shadowBlur=reduced?0:14;oval(q.x,q.y-17+h,5,5,'#ffe49a');c.shadowBlur=0;oval(q.x-5,q.y-20+h,4,2,'#faf5c777');oval(q.x+5,q.y-20+h,4,2,'#faf5c777');}
      if(l.friend&&l.friend.y===y&&!s.rescued){const q=p(l.friend.x,y);frog(q.x,q.y,.65,'#ffbf91');text('♥',q.x,q.y-32,'#ffdca1',15);}
      for(const portal of l.portals||[])if(portal.y===y){const pos=M.portalPosition(l,portal,s.time),q=p(pos.x,y);oval(q.x,q.y,25,13,'#c5b0ff55');c.strokeStyle='#d2bdff';c.lineWidth=3;c.beginPath();c.ellipse(q.x,q.y,25,13,0,0,Math.PI*2);c.stroke();text(portal.label,q.x,q.y+4,'#faf1ff');}
      if(s.player.y===y){const q=p(s.player.x,y);if(s.rescued)frog(q.x-27,q.y+10,.55,'#ffbf91');frog(q.x,q.y-(reduced?0:Math.sin(s.hop/M.HOP*Math.PI)*12),1,s.status==='lost'?'#d792b8':'#83f6c4');}
      for(const side of [-1,1]){
        if(side<0&&(r.signal||r.pulse||r.kind==='sink'||r.wind||r.dock)||side>0&&r.emergency)continue;
        const q=p(side<0?-1.65:9.65,y);oval(q.x,q.y+9,23,8,'#06172566');if(l.world===4){box(q.x-14,q.y-18,28,26,shade(q.y-18,26,'#8570aa','#393753'),5,w.color);box(q.x-8,q.y-13,16,7,'#9cdcdbaa',2);}else if(l.world===3){oval(q.x,q.y+3,19,8,'#648b9b');line([[q.x-15,q.y+6],[q.x,q.y-21],[q.x+15,q.y+6]],'#b9e6f0',4);}else{
        for(let i=0;i<4;i++){const dx=(i-1.5)*9,dy=(i%2)*7;oval(q.x+dx,q.y-4-dy,10,15,shade(q.y-25,35,l.world===2?'#739c68':'#4e9980','#24594f'));line([[q.x+dx,q.y+7],[q.x+dx-2,q.y-15-dy]],'#a0dfb84d',1);}
        if(y%2===0){for(const dx of [-7,7]){oval(q.x+dx,q.y-17,5,7,'#e2a0bc');oval(q.x+dx,q.y-20,2,3,'#f8d4d9');}oval(q.x+18,q.y+6,5,3,'#7ba4a1');}
      }}
    }
    text('↑ Ziel · ← ↓ → Wege erkunden · Sichere Inseln zum Warten',480,695,'#a3c2cb',12);
    function frog(x,y,scale,color){
      c.save();c.translate(x,y);c.scale(scale,scale);oval(0,12,23,8,'#06162666');
      for(const side of [-1,1]){oval(side*17,7,11,6,shade(0,14,color,'#32786d'));for(let i=0;i<3;i++)oval(side*(20+i*3),9-i,3,2,color);}
      oval(0,-1,21,18,shade(-20,38,color,'#348c75'));oval(0,6,12,9,s.status==='lost'?'#edc2d6':'#c6edd3');
      for(const side of [-1,1]){oval(side*12,-18,10,10,shade(-28,20,color,'#408b77'));oval(side*12,-20,6.5,7,'#edfff4');oval(side*12,-20,3.3,4.4,'#173c44');oval(side*12-1,-22,1.6,1.7,'#ffffff');oval(side*14,-5,3.5,2,'#ffb6b666');}
      oval(-7,-8,3,1.5,'#d3ffe866');line([[-7,-1],[0,2],[7,-1]],'#24665c',1.5);c.restore();
    }
  }
  root.FroggerArt={draw,projection};
  if(typeof module!=='undefined'&&module.exports)module.exports={projection};
})(globalThis);
