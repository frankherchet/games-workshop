(function(root) {
  'use strict';
  const WIDTH = 9;
  const WORLDS = [
    {name:'Sonnenauen', color:'#63f7ce', water:'#145e68', ground:'#193e3c'},
    {name:'Neonhafen', color:'#fc8da8', water:'#174963', ground:'#292f4b'},
    {name:'Dschungelruinen', color:'#baf884', water:'#165b55', ground:'#254439'},
    {name:'Polarlichter', color:'#a6dcff', water:'#23496c', ground:'#3b5667'},
    {name:'Orbitalgarten', color:'#c1a5ff', water:'#343052', ground:'#302c4a'}
  ];
  const safe = (options={}) => ({kind:'safe',...options});
  const road = (speed=1.2, style='bike', options={}) => ({kind:'road',speed,width:1.1,offsets:[0,4.5,9],style,...options});
  const water = (speed=.65, options={}) => ({kind:'water',speed,width:2.6,offsets:[0,4.4,8.8],style:'log',...options});
  const levels=[];
  function add(world,name,rows,options={}) {
    const number=levels.filter(l=>l.world===world).length+1;
    const map=[safe(),...rows,safe()],banks=map.map((r,i)=>r.kind==='safe'?i:-1).filter(i=>i>0&&i<map.length-1);
    levels.push({id:`${world+1}-${String(number).padStart(2,'0')}`,world,number,name,rows:map,start:{x:4,y:0},goal:4,flies:[{x:1,y:banks[0]||0},{x:7,y:banks[Math.floor(banks.length/2)]||0},{x:4,y:banks.at(-1)||0}],targetTime:45,...options});
  }
  add(0,'Der erste Sprung',[safe(),safe(),safe()],{flies:[{x:2,y:1},{x:6,y:2},{x:4,y:3}],hint:'Ein Tastendruck, ein Sprung. Erreiche den leuchtenden Zielsteg.'});
  add(0,'Fahrradweg',[road(.8),safe(),road(-.9),safe()],{flies:[{x:1,y:2},{x:7,y:2},{x:4,y:4}],hint:'Warte auf eine Lücke. Grasinseln sind immer sicher.'});
  add(0,'Treibholz',[safe(),water(.5),safe()],{flies:[{x:1,y:1},{x:7,y:1},{x:4,y:3}],hint:'Spring auf einen Baumstamm. Er trägt dich mit; Wasser ist gefährlich.'});
  add(0,'Gegen den Strom',[safe(),water(.65),water(-.65),safe()],{hint:'Die Stämme fahren gegeneinander. Achte auf deine nächste Landung.'});
  add(0,'Picknickverkehr',[road(1),safe(),water(.7),safe(),road(-1.1),safe()]);
  add(0,'Seerosenpfad',[safe(),water(0,{style:'lily',width:1.8,offsets:[1,4,7]}),water(.7,{width:2}),safe()]);
  add(0,'Entenparade',[road(.75,'duck',{pulse:true,width:1.6}),safe(),water(.65),safe()],{hint:'ACHTUNG kündigt die Enten an. Warte auf der Grasinsel.'});
  add(0,'Inselhüpfen',[water(.65),safe(),water(-.8),safe(),water(.6),safe()]);
  add(0,'Kleiner Freund',[road(1),safe(),water(.65),safe(),road(-.85),safe()],{friend:{x:7,y:4},hint:'Rette den orangefarbenen Frosch auf der rechten Insel vor dem Ziel.'});
  add(0,'Das große Gartenfest',[road(1.3),safe(),road(-1.1,'duck',{pulse:true}),safe(),water(.7),water(-.75),water(.8),safe()],{targetTime:60});
  const city=(speed=1.2,options={})=>road(speed,'car',{width:1.5,...options});
  const boat=(speed=.65,options={})=>water(speed,{style:'boat',...options});
  const tram=()=>road(2.5,'tram',{pulse:true,width:3,offsets:[0,7]});
  add(1,'Grün heißt los',[city(1,{signal:true}),safe()],{hint:'STOP: Verkehr. LOS: freie Querung. Die Zahl zeigt die Zeit bis zum Wechsel.'});
  add(1,'Feierabendspur',[city(1.1),safe(),city(-1.6),safe()]);
  add(1,'Straßenbahn',[city(.9,{signal:true}),safe(),tram(),safe()],{hint:'ACHTUNG kündigt die Bahn an. Warte vor dem Gleis auf der Insel.'});
  add(1,'Hafentaxi',[safe(),boat(.6),boat(-.75),safe()]);
  add(1,'Marktgasse',[city(.9,{width:2}),safe({blocked:[0,1,6,7,8]}),city(-1.2,{signal:true}),safe({blocked:[0,1,2,7,8]}),city(1.2),safe()],{flies:[{x:3,y:2},{x:4,y:4},{x:5,y:6}],hint:'Marktstände begrenzen die Inseln. Plane die freie Gasse für deine Landung.'});
  add(1,'Zwei Kreuzungen',[city(1.2,{signal:true}),safe(),city(-1.4,{signal:true,phase:3}),safe()]);
  add(1,'Nachtfähre',[safe(),boat(.8,{dock:true,width:3.3,offsets:[0,4.4,8.8]}),safe(),boat(-.6),safe()],{hint:'Die Fähren halten drei Sekunden. ANLEGER ist dein ruhiges Einstiegsfenster.'});
  add(1,'Blaulicht',[city(1.1,{signal:true,emergency:{kind:'road',speed:3,width:1.3,offsets:[0],pulse:true,phase:3}}),safe(),city(-1.3,{signal:true,phase:2}),safe()],{hint:'Blaulicht fährt auch bei LOS. Achte auf die zusätzliche Warnung.'});
  add(1,'Dachgarten-Rettung',[city(1.3),safe(),tram(),safe(),boat(.7),safe()],{friend:{x:1,y:4},hint:'Dein Freund wartet links auf der sicheren Terrasse hinter dem Gleis.'});
  add(1,'Letzte Fähre',[city(1.5,{signal:true}),safe(),tram(),safe(),boat(.85,{dock:true,width:3.2}),boat(-.7),safe()],{targetTime:65});
  const sink=(phase=0)=>({kind:'sink',width:2,offsets:[1,4,7],phase});
  const ants=(speed=1)=>road(speed,'ant',{width:.8,offsets:[0,2.7,5.4,8.1,10.8]});
  add(2,'Das atmende Blatt',[safe(),sink(),safe()],{hint:'BLATT trägt dich. SINKT warnt eine Sekunde vor dem Untertauchen.'});
  add(2,'Wasserfallweg',[sink(),sink(1),sink(2),safe()]);
  add(2,'Ameisenstraße',[ants(.9),safe(),ants(-1.1),safe()]);
  add(2,'Lianenfloß',[safe(),sink(),water(.7),safe()]);
  add(2,'Tempeltor',[sink(1),safe(),ants(1.2),safe(),sink(2),safe()]);
  add(2,'Krokodilbucht',[safe(),water(.55,{width:2.3,dangers:[1]}),safe(),water(-.65),safe()],{hint:'Augen und Zähne bedeuten Gefahr. Nur Holzflöße tragen dich.'});
  add(2,'Regenpause',[safe(),water(.6,{wind:true}),safe(),sink(1),safe()],{hint:'Die Strömung wird angekündigt und zeitweise schneller. Warte auf den Steininseln.'});
  add(2,'Drei Rhythmen',[sink(0),safe(),sink(2),safe(),sink(4),safe()]);
  add(2,'Der verlorene Forscher',[ants(1),safe(),sink(2),safe(),water(-.7),safe()],{friend:{x:7,y:4},hint:'Dein Freund wartet im rechten Seitenhof hinter den Blättern.'});
  add(2,'Herz des Dschungels',[water(.7),safe(),sink(1),sink(3),safe(),water(-.65,{dangers:[1]}),safe(),ants(1.2),safe()],{targetTime:70});
  const ice=()=>({kind:'ice'});
  const floe=(speed=.6,options={})=>water(speed,{style:'ice',...options});
  const sled=(speed=1,options={})=>road(speed,'sled',{width:1.5,...options});
  const thin=phase=>({...sink(phase),style:'ice'});
  add(3,'Rutschschule',[ice(),safe(),ice(),safe()],{hint:'Auf Eis folgt ein Zusatzschritt. Schnee fängt dich auf; es gibt keine endlose Rutschkette.'});
  add(3,'Schneespuren',[safe(),ice(),safe(),ice(),safe(),ice(),safe()]);
  add(3,'Schlittenweg',[ice(),safe(),sled(.9),safe(),sled(-1.2),safe()]);
  add(3,'Schollenfahrt',[safe(),floe(.6),floe(-.6),safe()]);
  add(3,'Dünnes Eis',[ice(),safe(),thin(1),safe(),ice(),safe()],{hint:'BRICHT warnt vor dem Einbruch. Treibende Schollen lösen kein Rutschen aus.'});
  add(3,'Frostkurve',[ice(),safe({blocked:[0,4,5,6,7,8]}),ice(),safe({blocked:[0,1,2,3,4,8]}),ice(),safe({blocked:[0,1,2,6,7,8]})],{flies:[{x:1,y:2},{x:7,y:4},{x:4,y:6}],hint:'Die Schneefelder liegen versetzt. Richte deinen nächsten Sprung auf dem Eis seitlich aus.'});
  add(3,'Schneepflug',[sled(.7,{width:3,offsets:[0,7]}),safe(),ice(),safe(),sled(-1.4),safe()]);
  add(3,'Windfenster',[safe(),floe(.6,{wind:true}),safe(),ice(),safe(),floe(-.7),safe()],{hint:'ACHTUNG kündigt den Wind an. SCHNELL bewegt die Schollen schneller.'});
  add(3,'Wärme für zwei',[ice(),safe(),sled(1.1),safe(),thin(2),safe()],{friend:{x:7,y:4},hint:'Dein Freund wartet rechts an der Hütte hinter dem Schlittenweg.'});
  add(3,'Unter dem Polarlicht',[ice(),safe(),thin(1),safe(),floe(.8),floe(-.8),safe(),sled(1.3),safe()],{targetTime:65});
  const cargo=(speed=1.3)=>road(speed,'cargo',{width:1.5});
  const platform=(speed=.65,options={})=>water(speed,{style:'platform',...options});
  const gate=phase=>road(0,'gate',{pulse:true,width:9,offsets:[0],phase});
  const beam=phase=>road(2,'beam',{pulse:true,width:2,offsets:[0,6.5],phase});
  const pair=(ax,ay,bx,by,label='A')=>[{x:ax,y:ay,label},{x:bx,y:by,label}];
  add(4,'Portalprobe',[safe(),safe(),safe(),safe()],{portals:pair(4,1,4,4),hint:'Gleiche Buchstaben verbinden Portale. Am Ausgang bleibst du stehen, bis du weiterhüpfst.'});
  add(4,'Frachtring',[cargo(1.3),safe(),cargo(-1.4),safe()]);
  add(4,'Satellitensteg',[safe(),platform(.6),platform(-.65),safe()]);
  add(4,'Zwei Verbindungen',[safe(),cargo(1.2),safe(),safe(),cargo(-1.3),safe(),safe()],{portals:[...pair(1,1,7,3),...pair(7,4,1,7,'B')]});
  add(4,'Gewächshaus-Schleuse',[safe(),gate(0),safe(),gate(3),safe(),safe()],{portals:pair(1,1,7,3),hint:'ACHTUNG kündigt die geschlossene Schleuse an. Warte auf den sicheren Inseln.'});
  add(4,'Solarfenster',[beam(0),safe(),beam(2),safe(),cargo(1.3),safe()],{hint:'Energiebalken haben eine Vorwarnung und ein klares Zeitfenster.'});
  add(4,'Umlaufbahn',[safe(),cargo(1.1),safe(),platform(.5,{oscillate:true,width:3.2,offsets:[3]}),safe(),safe()],{portals:[{x:4,y:1,label:'A'},{x:5,y:4,label:'A',ride:0}],hint:'Das Portal setzt dich sicher in die Mitte der beweglichen Wartungsplattform.'});
  add(4,'Sternenroute',[safe(),cargo(1.3),safe(),platform(.75),safe(),cargo(-1.2),safe()],{portals:[...pair(4,1,4,7),...pair(1,1,7,5,'B')],flies:[{x:1,y:3},{x:7,y:5},{x:1,y:7}]});
  add(4,'Die letzte Rettung',[cargo(1.4),safe(),gate(0),safe(),platform(-.7),safe(),cargo(1.2),safe()],{friend:{x:7,y:4},portals:pair(1,2,1,6),hint:'Rette den Freund im rechten Außenbiom. Portale kürzen deinen Rückweg ab.'});
  add(4,'Heimkehr',[safe(),gate(0),safe(),platform(.7),platform(-.7),safe(),beam(2),safe(),cargo(1.5),safe()],{portals:[...pair(1,1,7,3),...pair(1,6,7,8,'B')],targetTime:70,hint:'Deine letzte Querung. Bringe den kleinen Frosch zurück in den Orbitalgarten.'});
  const data={WIDTH,WORLDS,levels};
  root.FroggerLevels=data;
  if(typeof module!=='undefined'&&module.exports)module.exports=data;
})(globalThis);
