(function(root) {
  'use strict';
  // Stable, deterministic, offline NPC population: no networking or multiplayer.
  const groups=Object.freeze([
    { name:'Sonnenweide', x:9, z:8, r:3, horses:['haflinger','welsh','friesian','haflinger'] },
    { name:'Westweide', x:-19, z:-3, r:3.1, horses:['friesian','haflinger','friesian','welsh'] },
    { name:'Talherde', x:20, z:-18, r:3, horses:['welsh','haflinger','friesian','haflinger'] },
    { name:'Ponykoppel', x:-17, z:18, r:2.1, horses:['shetland','welsh','shetland'] },
    { name:'Fohlenwiese', x:20, z:4, r:1.9, horses:['foal-black','foal-brown'] }
  ]);
  const pairs=Object.freeze([
    {x:2,z:7,phase:0},
    {x:-6,z:-4,phase:1.5},
    {x:-13,z:11,phase:3},
    {x:22,z:11,phase:4.5}
  ]);
  function create() {
    const horses=groups.flatMap((g,gi)=>g.horses.map((horseId,i)=>({
      x:g.x+Math.sin(i*1.6)*g.r*.6,z:g.z+Math.cos(i*1.6)*g.r*.6,
      cx:g.x,cz:g.z,radius:g.r*(.55+.09*(i%3)),phase:i*1.64+gi*.56,
      heading:i,walk:0,jump:0,form:'horse',horseId,herd:gi,kind:'horse'
    })));
    const people=pairs.flatMap((p,gi)=>Array.from({length:2},(_,i)=>({
      x:p.x+i*.8,z:p.z+i*.5,cx:p.x,cz:p.z,offset:i*.8,
      phase:p.phase,heading:0,walk:0,jump:0,form:'human',style:(gi+i)%4,kind:'human'
    })));
    const rabbits=Array.from({length:6},(_,i)=>({
      x:(i<3?4:21)+i%3,z:i<3?-7:1,cx:i<3?4:21,cz:i<3?-7:1,
      phase:i*1.37,kind:'rabbit'
    }));
    const birds=Array.from({length:10},(_,i)=>({
      x:-20+i%5*9,z:-16+Math.floor(i/5)*24,cx:-20+i%5*9,
      cz:-16+Math.floor(i/5)*24,phase:i*1.25,kind:'bird'
    }));
    return {horses,people,rabbits,birds};
  }
  function tick(pop,t,dt) {
    for(const h of pop.horses){
      const a=h.phase+t*.15;
      h.x=h.cx+Math.sin(a)*h.radius; h.z=h.cz+Math.cos(a)*h.radius;
      h.heading=Math.atan2(Math.cos(a),-Math.sin(a));
      h.walk+=dt*.12;
    }
    for(const p of pop.people){
      const a=p.phase+t*.18;
      p.x=p.cx+Math.sin(a)*1.4+p.offset;
      p.z=p.cz+Math.cos(a)*1.15+p.offset*.45;
      p.heading=Math.atan2(Math.cos(a),-Math.sin(a));
      p.walk+=dt*.22;
    }
    for(const r of pop.rabbits){
      r.x=r.cx+Math.sin(t*.42+r.phase)*1.7;
      r.z=r.cz+Math.cos(t*.37+r.phase)*1.5;
    }
    for(const b of pop.birds){
      b.x=b.cx+Math.sin(t*.38+b.phase)*4.4;
      b.z=b.cz+Math.cos(t*.33+b.phase)*3.6;
    }
  }
  function stats(pop){
    return {horseHerds:3,horseGroups:groups.length,horses:pop.horses.length,
      people:pop.people.length,rabbits:pop.rabbits.length,birds:pop.birds.length};
  }
  root.Arcade.pferdezauberWorld={groups,create,tick,stats};
})(globalThis);
