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
  const safe = () => ({kind:'safe'});
  const road = (speed=1.2, style='bike', options={}) => ({kind:'road',speed,width:1.1,offsets:[0,4.5,9],style,...options});
  const water = (speed=.65, options={}) => ({kind:'water',speed,width:2.6,offsets:[0,4.4,8.8],style:'log',...options});
  const levels=[];
  function add(world,name,rows,options={}) {
    const number=levels.filter(l=>l.world===world).length+1;
    levels.push({id:`${world+1}-${String(number).padStart(2,'0')}`,world,number,name,rows:[safe(),...rows,safe()],start:{x:4,y:0},goal:4,flies:[],targetTime:45,...options});
  }
  add(0,'Der erste Sprung',[safe(),safe(),safe()],{flies:[{x:2,y:1},{x:6,y:2},{x:4,y:3}],hint:'Ein Tastendruck, ein Sprung. Erreiche den leuchtenden Zielsteg.'});
  add(0,'Fahrradweg',[road(.8),safe(),road(-.9),safe()],{flies:[{x:1,y:2},{x:7,y:2},{x:4,y:4}],hint:'Warte auf eine Lücke. Grasinseln sind immer sicher.'});
  add(0,'Treibholz',[safe(),water(.5),safe()],{flies:[{x:1,y:1},{x:7,y:1},{x:4,y:3}],hint:'Spring auf einen Baumstamm. Er trägt dich mit; Wasser ist gefährlich.'});
  const data={WIDTH,WORLDS,levels};
  root.FroggerLevels=data;
  if(typeof module!=='undefined'&&module.exports)module.exports=data;
})(globalThis);
