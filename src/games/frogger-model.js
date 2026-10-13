(function(root) {
  'use strict';
  const D=root.FroggerLevels||(typeof require==='function'?require('./frogger-levels.js'):null);
  const PERIOD=13,STEP=1/120,HOP=.18;
  const mod=(n,d)=>((n%d)+d)%d;
  function create(level) {
    return {level,time:0,player:{...level.start},cooldown:0,hop:0,direction:{x:0,y:1},status:'playing',reason:'',collected:[],rescued:false,portalLock:null};
  }
  function phase(row,time) {
    const t=mod(time+(row.phase||0),row.cycle||6);
    if(row.signal)return {active:t<3,warning:t>=2.2&&t<3,label:t<3?'STOP':'LOS',remaining:(t<3?3:6)-t};
    if(row.pulse)return {active:t>=1.5&&t<2.8,warning:t<1.5,label:t<1.5?'ACHTUNG':t<2.8?'STOP':'LOS',remaining:(t<1.5?1.5:t<2.8?2.8:6)-t};
    if(row.kind==='sink')return {active:t<4.2,warning:t>=3.2&&t<4.2,label:t<3.2?'TRÄGT':t<4.2?'SINKT':'UNTER WASSER',remaining:(t<4.2?4.2:6)-t};
    if(row.wind){const t=mod(time,8);return {active:true,warning:t<2,label:t<2?'ACHTUNG':t<5?'SCHNELL':'RUHIG',remaining:(t<2?2:t<5?5:8)-t};}
    if(row.dock){const t=mod(time,8);return {active:true,warning:false,label:t<3?'ANLEGER':'FÄHRT',remaining:(t<3?3:8)-t};}
    return {active:true,warning:false,label:'',remaining:0};
  }
  function distance(row,time) {
    if(row.dock)return row.speed*(Math.floor(time/8)*5+Math.max(0,mod(time,8)-3));
    if(row.wind)return row.speed*(time+Math.floor(time/8)*3+Math.min(3,Math.max(0,mod(time,8)-2)));
    return row.speed*time;
  }
  function objects(row,time) {
    if(row.kind==='sink')return (row.offsets||[1,4,7]).map((x,i)=>({x,w:row.width||1.8,index:i,danger:false}));
    if(!row.offsets)return [];
    const result=row.offsets.map((offset,i)=>({x:mod(offset+distance(row,time)+2,PERIOD)-2,w:row.width,index:i,danger:(row.dangers||[]).includes(i),active:phase(row,time).active}));
    if(row.emergency)result.push(...objects(row.emergency,time).map(o=>({...o,emergency:true})));
    return result;
  }
  function support(row,x,time) {
    if(row.kind==='safe'||row.kind==='ice')return true;
    if(row.kind==='sink'&&!phase(row,time).active)return false;
    return objects(row,time).find(o=>!o.danger&&x>=o.x+.05&&x<=o.x+o.w-.05);
  }
  function fail(s,reason) {s.status='lost';s.reason=reason;}
  function resolve(s) {
    if(s.status!=='playing')return;
    const p=s.player,row=s.level.rows[p.y];
    if(p.x<0||p.x>D.WIDTH-1){fail(s,'Du bist über den Rand getrieben.');return;}
    if(row.kind==='road'&&objects(row,s.time).some(o=>o.active&&p.x+.28>o.x&&p.x-.28<o.x+o.w)){fail(s,'Erwischt! Warte auf die nächste Lücke.');return;}
    if(['water','sink'].includes(row.kind)&&!support(row,p.x,s.time)){fail(s,row.kind==='sink'?'Die Plattform ist versunken.':'Im Wasser gelandet. Suche eine sichere Plattform.');return;}
    s.level.flies.forEach((fly,i)=>{if(fly.y===p.y&&Math.abs(fly.x-p.x)<.48&&!s.collected.includes(i))s.collected.push(i);});
    if(s.level.friend&&p.y===s.level.friend.y&&Math.abs(p.x-s.level.friend.x)<.48)s.rescued=true;
    if(p.y===s.level.rows.length-1&&Math.abs(p.x-s.level.goal)<.48){
      if(s.level.friend&&!s.rescued){s.reason='Hole zuerst deinen Froschfreund ab.';return;}
      s.status='won';s.reason='Ziel erreicht!';
    }
  }
  function move(s,dx,dy) {
    if(s.status!=='playing'||s.cooldown>1e-8||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return false;
    const p=s.player,x=Math.round(p.x)+dx,y=p.y+dy;
    if(x<0||x>=D.WIDTH||y<0||y>=s.level.rows.length)return false;
    p.x=x;p.y=y;s.direction={x:dx,y:dy};s.cooldown=HOP;s.hop=HOP;s.reason='';
    resolve(s);return true;
  }
  function step(s,dt) {
    if(!Number.isFinite(dt)||dt<0||s.status!=='playing')return;
    // Cap frame catch-up: background time must never run an unseen attempt.
    let left=Math.min(dt,.25);
    while(left>1e-8&&s.status==='playing'){
      const slice=Math.min(STEP,left),row=s.level.rows[s.player.y],old=s.time;
      const rides=row.kind==='water'&&support(row,s.player.x,old);
      s.time+=slice;s.cooldown=Math.max(0,s.cooldown-slice);s.hop=Math.max(0,s.hop-slice);
      if(rides)s.player.x+=distance(row,s.time)-distance(row,old);
      resolve(s);left-=slice;
    }
  }
  function freshProgress(){return {version:1,stars:Array(50).fill(0),times:Array(50).fill(null),unlocked:0};}
  function loadProgress(raw){
    const result=freshProgress();
    if(!raw||raw.version!==1||!Array.isArray(raw.stars)||!Array.isArray(raw.times)||raw.stars.length!==50||raw.times.length!==50)return result;
    for(let i=0;i<50;i++){
      const stars=raw.stars[i],time=raw.times[i];
      if(Number.isInteger(stars)&&stars>=1&&stars<=3&&Number.isFinite(time)&&time>0&&time<=36000){result.stars[i]=stars;result.times[i]=time;}
    }
    while(result.unlocked<49&&result.stars[result.unlocked]>0)result.unlocked++;
    return result;
  }
  function record(progress,s){
    const i=D.levels.indexOf(s.level);
    if(s.status!=='won'||i<0||i>progress.unlocked)return 0;
    const stars=1+(s.collected.length===3?1:0)+(s.time<=s.level.targetTime?1:0);
    progress.stars[i]=Math.max(progress.stars[i],stars);
    const time=Math.max(.001,s.time);progress.times[i]=progress.times[i]===null?time:Math.min(progress.times[i],time);
    progress.unlocked=Math.min(49,Math.max(progress.unlocked,i+1));return stars;
  }
  const model={create,move,step,phase,objects,support,freshProgress,loadProgress,record,HOP,STEP};
  root.FroggerModel=model;
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
})(globalThis);
