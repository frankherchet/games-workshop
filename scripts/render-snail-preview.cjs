// Optional offline visual check; @napi-rs/canvas is not a game dependency.
const fs=require('node:fs');
const {createCanvas,Image}=require('@napi-rs/canvas');
global.Image=Image;global.SnailAssets={garden:require('node:path').resolve('src/assets/garden-fine-v3.png')};
global.SnailModel=require('../src/games/snail-model.js');require('../src/games/snail-art.js');
(async()=>{
 await global.SnailArt.ready;
 const canvas=createCanvas(1920,1280),c=canvas.getContext('2d');c.scale(2,2);
 const M=global.SnailModel,s=M.newRun(0,'medium','fox');s.player.x=505;s.player.y=430;s.player.dx=1;s.player.dy=0;
 Object.keys(M.PLANTS).forEach((type,i)=>{s.plots[i].type=type;s.plots[i].hp=M.PLANTS[type].hp;s.plots[i].watered=true;});
 s.plots.slice(0,12).forEach((p,i)=>{p.unlocked=true;p.type=Object.keys(M.PLANTS)[i%4];p.hp=M.PLANTS[p.type].hp;p.watered=true;});
 for(const phase of ['day','night']){
  s.phase=phase;if(phase==='night')for(const [i,type]of ['normal','fast','armored','giant'].entries())s.snails.push({id:i,type,x:220+i*135,y:210,hp:3,maxHp:4,dx:1,dy:0});
  global.SnailArt.garden(c,s,2,{x:1},[{x:490,y:320,amount:6,born:1.5},{x:362,y:245,amount:5,born:1.8}]);fs.writeFileSync(`dist/schneckenkampf-v3-${phase}.png`,canvas.toBuffer('image/png'));
 }
})();
