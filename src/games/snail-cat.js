(function(root){
 'use strict';
 const layout=[[31, 65, 241, 239], [322, 66, 224, 238], [568, 58, 227, 246], [853, 74, 248, 230], [31, 349, 257, 223], [315, 337, 240, 236], [578, 338, 256, 239], [858, 355, 256, 223], [36, 612, 232, 223], [306, 608, 254, 228], [585, 598, 248, 233], [863, 604, 229, 232], [29, 858, 239, 239], [312, 865, 222, 233], [579, 864, 225, 234], [860, 859, 231, 239], [33, 1165, 242, 158], [313, 1162, 239, 161], [585, 1167, 237, 157], [863, 1165, 233, 160]];
 let image=null,pending=null,loaded=false;
 function ready(){
  if(pending)return pending;if(!root.Image||!root.SnailAssets?.cat)return Promise.resolve(false);
  pending=new Promise(resolve=>{image=new root.Image();image.onload=()=>{loaded=(image.naturalWidth||image.width)>0;resolve(loaded);};image.onerror=()=>resolve(false);image.src=root.SnailAssets.cat;});return pending;
 }
 const rows={sit:0,walk:1,play:2,groom:3,sleep:4};
 function draw(c,cat,night=false,reduced=false){
  ready();if(!loaded||!cat)return false;
  const mode=rows[cat.mode]===undefined?'sit':cat.mode,age=reduced?0:cat.age||0;
  const frame=reduced?0:Math.floor(age*({walk:7,play:5,groom:3,sleep:1,sit:1}[mode]))%4;
  c.save();c.translate(Math.round(cat.x),Math.round(cat.y));c.scale(cat.facing||1,1);
  c.fillStyle=night?'#08132266':'#23352845';c.beginPath();c.ellipse(0,2,mode==='sleep'?24:18,4,0,0,Math.PI*2);c.fill();
  const smoothing=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;
  if(night&&typeof c.filter==='string')c.filter='brightness(0.72) saturate(0.75)';
  function paint(which,alpha){
   const [sx,sy,sw,sh]=layout[rows[which]*4+frame],scale=.22;
   c.globalAlpha=alpha;c.drawImage(image,sx,sy,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);
  }
  const blend=reduced?1:Math.min(1,age/.4),previous=cat.previousMode;
  if(blend<1&&rows[previous]!==undefined&&previous!==mode)paint(previous,1-blend);
  paint(mode,blend<1&&rows[previous]!==undefined&&previous!==mode?blend:1);
  c.imageSmoothingEnabled=smoothing;c.restore();return true;
 }
 root.SnailCat={draw,layout,get ready(){return ready();}};
})(globalThis);
