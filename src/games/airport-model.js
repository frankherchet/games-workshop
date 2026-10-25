(function(root){
  'use strict';
  const C=root.AirportConfig||(typeof require==='function'?require('./airport-config.js'):null);
  const TAU=Math.PI*2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const turnDelta=(angle)=>Math.atan2(Math.sin(angle),Math.cos(angle));
  function randomSeed(){return (Math.random()*0xffffffff)>>>0;}
  function randomFrom(seed){
    let n=(seed>>>0);
    return ()=>{n=(n+0x6d2b79f5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  }
  class FlightPath{
    constructor(points=[]){this.points=points.map(p=>({x:clamp(p.x,0,C.WIDTH),y:clamp(p.y,0,C.HEIGHT)}));}
    copy(){return new FlightPath(this.points);}
  }
  class LandingZone{
    constructor(type,x,y,angle=0){this.type=type;this.x=x;this.y=y;this.angle=angle;this.radius=type==='helipad'?21:27;}
    accepts(aircraft){return !!aircraft&&aircraft.zoneType===this.type;}
  }
  class CivilRunway extends LandingZone{constructor(x,y,angle){super('civil',x,y,angle);}}
  class MilitaryRunway extends LandingZone{constructor(x,y,angle){super('military',x,y,angle);}}
  class Helipad extends LandingZone{constructor(x,y){super('helipad',x,y,0);}}
  class Airfield{
    constructor(id,x,y,types,orientation){
      this.id=id;this.x=x;this.y=y;this.orientation=orientation;this.size=74;
      this.zones=[];
      if(types.includes('civil'))this.zones.push(new CivilRunway(x-23,y+4,orientation));
      if(types.includes('military'))this.zones.push(new MilitaryRunway(x+23,y-28,orientation));
      if(types.includes('helipad'))this.zones.push(new Helipad(x+57,y+45));
    }
  }
  class Aircraft{
    constructor(type,id,x,y,heading){
      const spec=C.AIRCRAFT[type];if(!spec)throw new Error('Unbekannter Flugzeugtyp: '+type);
      this.type=type;this.id=id;this.x=x;this.y=y;this.heading=heading;
      this.speed=spec.speed;this.turnRate=spec.turn;this.radius=spec.radius;this.size=spec.size;
      this.zoneType=spec.zone;this.color=spec.color;this.path=new FlightPath();this.hasRoute=false;
      this.entered=false;this.lastTrail=[];
    }
    setPath(points){this.path=new FlightPath(points);this.hasRoute=this.path.points.length>0;}
    move(dt){
      while(this.path.points.length&&distance(this,this.path.points[0])<Math.max(7,this.speed*dt*1.4)){
        this.path.points.shift();
      }
      if(this.path.points.length){
        const target=this.path.points[0];
        const targetHeading=Math.atan2(target.y-this.y,target.x-this.x);
        this.heading+=clamp(turnDelta(targetHeading-this.heading),-this.turnRate*dt,this.turnRate*dt);
      }
      this.x+=Math.cos(this.heading)*this.speed*dt;
      this.y+=Math.sin(this.heading)*this.speed*dt;
      if(this.x>=0&&this.x<=C.WIDTH&&this.y>=0&&this.y<=C.HEIGHT)this.entered=true;
    }
  }
  class PrivatePlane extends Aircraft{constructor(id,x,y,h){super('private',id,x,y,h);}}
  class Airliner extends Aircraft{constructor(id,x,y,h){super('airliner',id,x,y,h);}}
  class LargeAirliner extends Aircraft{constructor(id,x,y,h){super('large',id,x,y,h);}}
  class Helicopter extends Aircraft{constructor(id,x,y,h){super('helicopter',id,x,y,h);}}
  class MilitaryJet extends Aircraft{constructor(id,x,y,h){super('jet',id,x,y,h);}}
  const CLASSES={private:PrivatePlane,airliner:Airliner,large:LargeAirliner,helicopter:Helicopter,jet:MilitaryJet};
  class StageInstance{
    constructor(config,seed,airfields){
      this.config=config;this.seed=seed>>>0;this.airfields=airfields;
      this.zones=airfields.flatMap(airfield=>airfield.zones);
    }
  }
  class StageGenerator{
    generate(config,seed=randomSeed()){
      const rng=randomFrom(seed),positions=[
        {x:235,y:197},{x:715,y:197},{x:235,y:443},{x:715,y:443}
      ];
      for(let i=positions.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
      const types=['civil'];
      if(config.world.types.includes('helicopter'))types.push('helipad');
      if(config.world.types.includes('jet'))types.push('military');
      const airfields=positions.slice(0,config.airfieldCount).map((p,i)=>
        new Airfield(i,p.x+(rng()-.5)*70,p.y+(rng()-.5)*48,types,rng()<.5?0:Math.PI/2)
      );
      return new StageInstance(config,seed,airfields);
    }
  }
  class TrafficSpawner{
    constructor(instance){
      this.instance=instance;this.rng=randomFrom(instance.seed^0x9e3779b9);
      this.lastSpawnDirection=null;this.nextSpawnAt=1.4;this.elapsed=0;this.serial=0;
      this.history=[];this.pending=null;
    }
    interval(){
      const cfg=this.instance.config;
      return Math.max(cfg.minimumSpawnInterval,cfg.initialSpawnInterval-cfg.spawnAcceleration*this.elapsed);
    }
    chooseDirection(){
      const choices=this.lastSpawnDirection==='N'?['S','E','W']:['N','S','E','W'];
      return choices[Math.floor(this.rng()*choices.length)];
    }
    choosePosition(dir){
      const margin=34;
      const x=margin+this.rng()*(C.WIDTH-margin*2);
      const y=margin+this.rng()*(C.HEIGHT-margin*2);
      switch(dir){
        case 'N':return {x,y:-2,heading:Math.PI/2};
        case 'S':return {x,y:C.HEIGHT+2,heading:-Math.PI/2};
        case 'E':return {x:C.WIDTH+2,y,heading:Math.PI};
        default:return {x:-2,y,heading:0};
      }
    }
    spawn(active){
      // Keep the next candidate stable if the edge is temporarily occupied.
      // Routes chosen by the player must not change the replay's spawn sequence.
      if(!this.pending){
        const dir=this.chooseDirection(),pos=this.choosePosition(dir);
        const types=this.instance.config.world.types;
        const type=types[Math.floor(this.rng()*types.length)];
        this.pending={dir,pos,type};
      }
      const {dir,pos,type}=this.pending;
      if(active.some(a=>distance(a,pos)<a.radius+65))return null;
      this.pending=null;
      this.lastSpawnDirection=dir;
      const Plane=CLASSES[type],plane=new Plane(++this.serial,pos.x,pos.y,pos.heading);
      this.history.push({dir,x:pos.x,y:pos.y,type});
      return plane;
    }
    tick(dt,active){
      this.elapsed+=dt;this.nextSpawnAt-=dt;
      if(this.nextSpawnAt>0)return null;
      if(active.length>=this.instance.config.maxAircraft){this.nextSpawnAt=1;return null;}
      const plane=this.spawn(active);
      this.nextSpawnAt=plane?this.interval():.35;
      return plane;
    }
  }
  class CollisionSystem{
    static isCollision(a,b){return distance(a,b)<a.radius+b.radius;}
    static findCollision(planes){
      for(let i=0;i<planes.length;i++)for(let j=i+1;j<planes.length;j++){
        if(this.isCollision(planes[i],planes[j]))return [planes[i],planes[j]];
      }
      return null;
    }
  }
  class StageAttemptManager{
    constructor(){this.failedAttempts=0;}
    get possibleStars(){return Math.max(0,3-this.failedAttempts);}
    fail(){this.failedAttempts++;return this.possibleStars;}
    reset(){this.failedAttempts=0;}
  }
  class ProgressManager{
    constructor(raw){this.completed=Array(C.TOTAL).fill(null);this.load(raw);}
    load(raw){
      if(!raw||raw.version!==1||!Array.isArray(raw.completed)||raw.completed.length!==C.TOTAL)return;
      for(let i=0;i<C.TOTAL;i++){
        const n=raw.completed[i];
        if(n===null)continue;
        if(!Number.isInteger(n)||n<0||n>3)break;
        if(i>0&&this.completed[i-1]===null)break;
        this.completed[i]=n;
      }
    }
    get unlocked(){const next=this.completed.indexOf(null);return next===-1?C.TOTAL-1:next;}
    canPlay(index){return Number.isInteger(index)&&index>=0&&index<=this.unlocked&&index<C.TOTAL;}
    record(index,stars){
      if(!this.canPlay(index)||this.completed[index]!==null)return false;
      if(!Number.isInteger(stars)||stars<0||stars>3)return false;
      this.completed[index]=stars;return true;
    }
    serialize(){return {version:1,completed:[...this.completed]};}
    get totalStars(){return this.completed.reduce((n,v)=>n+(v??0),0);}
  }
  class GameSession{
    constructor(config,seed=randomSeed()){
      this.config=config;
      this.generator=new StageGenerator();
      this.instance=this.generator.generate(config,seed);
      this.attempts=new StageAttemptManager();
      this.resetAttempt();
    }
    resetAttempt(){
      this.aircraft=[];this.spawner=new TrafficSpawner(this.instance);
      this.landings=0;this.elapsed=0;this.status='playing';this.failureReason='';
      this.lastLanded=null;this.lastCollision=null;
    }
    retry(){this.resetAttempt();}
    regenerate(seed=randomSeed()){
      this.instance=this.generator.generate(this.config,seed);
      this.attempts.reset();this.resetAttempt();
    }
    assignRoute(id,points){
      const a=this.aircraft.find(p=>p.id===id);
      if(this.status!=='playing'||!a||!Array.isArray(points)||!points.length)return false;
      a.setPath(points);return true;
    }
    fail(reason){
      if(this.status!=='playing')return;
      this.status='failed';this.failureReason=reason;this.attempts.fail();
    }
    step(dt){
      if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
      let remaining=Math.min(dt,.25);
      while(remaining>1e-8&&this.status==='playing'){
        const slice=Math.min(.025,remaining);remaining-=slice;this.elapsed+=slice;
        const spawned=this.spawner.tick(slice,this.aircraft);
        if(spawned)this.aircraft.push(spawned);
        for(const plane of this.aircraft){
          plane.move(slice);
          if(plane.entered&&(plane.x< -plane.radius||plane.x>C.WIDTH+plane.radius||plane.y< -plane.radius||plane.y>C.HEIGHT+plane.radius)){
            this.fail('AIRCRAFT_ESCAPED');break;
          }
        }
        if(this.status!=='playing')break;
        const crash=CollisionSystem.findCollision(this.aircraft);
        if(crash){this.lastCollision=crash.map(p=>({x:p.x,y:p.y}));this.fail('AIRCRAFT_COLLISION');break;}
        for(const plane of [...this.aircraft]){
          // Only a deliberately routed aircraft may land. Unrouted flyovers do not count.
          if(!plane.entered||!plane.hasRoute)continue;
          const zone=this.instance.zones.find(z=>z.accepts(plane)&&distance(z,plane)<z.radius);
          if(!zone)continue;
          this.aircraft.splice(this.aircraft.indexOf(plane),1);this.landings++;
          this.lastLanded={x:zone.x,y:zone.y,at:this.elapsed};
          if(this.landings>=this.config.requiredLandings){this.status='won';break;}
        }
      }
    }
  }
  const model={randomSeed,randomFrom,clamp,distance,FlightPath,LandingZone,CivilRunway,MilitaryRunway,Helipad,Airfield,Aircraft,
    PrivatePlane,Airliner,LargeAirliner,Helicopter,MilitaryJet,StageInstance,StageGenerator,TrafficSpawner,CollisionSystem,
    StageAttemptManager,ProgressManager,GameSession};
  root.AirportModel=model;
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
})(globalThis);
