(function(root){
  'use strict';
  const WIDTH=960,HEIGHT=640;
  const AIRCRAFT={
    private:{label:'Privatflugzeug',speed:77,turn:2.1,radius:10,color:'#f8dc64',zone:'civil',size:1},
    airliner:{label:'Linienflugzeug',speed:94,turn:1.55,radius:15,color:'#e9eef1',zone:'civil',size:1.3},
    large:{label:'Großes Linienflugzeug',speed:105,turn:1.15,radius:20,color:'#72c8ed',zone:'civil',size:1.7},
    helicopter:{label:'Hubschrauber',speed:60,turn:2.8,radius:12,color:'#e69a55',zone:'helipad',size:1.1},
    jet:{label:'Militärjet',speed:148,turn:2.25,radius:12,color:'#b8db92',zone:'military',size:1.15}
  };
  const LEVELS=[
    {id:'province',name:'Provinz',subtitle:'Über grünen Feldern',theme:'province',types:['private','airliner']},
    {id:'island',name:'Insel',subtitle:'Anflug über dem Meer',theme:'island',types:['private','airliner','large']},
    {id:'city',name:'Stadt',subtitle:'Trubel zwischen Hochhäusern',theme:'city',types:['private','airliner','large','helicopter']},
    {id:'desert',name:'Wüstenstadt',subtitle:'Landungen unter heißer Sonne',theme:'desert',types:['private','airliner','large','helicopter','jet']}
  ];
  const PER_LEVEL=12,TOTAL=LEVELS.length*PER_LEVEL;
  const LANDINGS=[4,5,6,7,8,9,10,11,12,13,14,15];
  function stageConfig(index){
    if(!Number.isInteger(index)||index<0||index>=TOTAL)throw new RangeError('Ungültige Stage');
    const level=Math.floor(index/PER_LEVEL),stage=index%PER_LEVEL+1;
    return Object.freeze({
      index,level,stage,world:LEVELS[level],airfieldCount:Math.ceil(stage/3),
      requiredLandings:LANDINGS[stage-1],
      initialSpawnInterval:12.5-(stage-1)*.68-level*.15,
      minimumSpawnInterval:11.92-(stage-1)*.68-level*.15,
      spawnAcceleration:0.025+stage*.002,
      maxAircraft:Math.min(16,7+Math.ceil(stage/2))
    });
  }
  const config={WIDTH,HEIGHT,AIRCRAFT,LEVELS,PER_LEVEL,TOTAL,LANDINGS,stageConfig};
  root.AirportConfig=config;
  if(typeof module!=='undefined'&&module.exports)module.exports=config;
})(globalThis);
