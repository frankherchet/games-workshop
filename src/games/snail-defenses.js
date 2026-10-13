(function(root){
 'use strict';
 const layout=[[43, 97, 303, 233], [419, 86, 272, 243], [758, 97, 313, 215], [1117, 83, 331, 233], [1448, 155, 362, 155], [1810, 31, 311, 295], [44, 452, 302, 224], [419, 433, 269, 252], [754, 449, 326, 214], [1117, 436, 331, 229], [1448, 505, 362, 162], [1810, 386, 310, 289]];
 let image=null,pending=null,loaded=false;
 function ready(){
  if(pending)return pending;if(!root.Image||!root.SnailAssets?.defenses)return Promise.resolve(false);
  pending=new Promise(resolve=>{image=new root.Image();image.onload=()=>{loaded=(image.naturalWidth||image.width)>0;resolve(loaded);};image.onerror=()=>resolve(false);image.src=root.SnailAssets.defenses;});return pending;
 }
 function draw(c,item,time=0){
  const index={pit:0,beer:1,fence:2,electric:3,copper:4,duck:5}[item.type];if(index===undefined)return root.SnailExtras?.draw(c,item.type,item.x,item.y+14,58)||false;
  ready();if(!loaded)return false;
  const worn=item.type==='duck'?(Math.hypot(item.dx||0,item.dy||0)>.05&&Math.floor(time*4)%2):item.type==='fence'?item.hp<27:item.type==='copper'?item.age>=2:item.charges<=2;
  const [sx,sy,sw,sh]=layout[index+(worn?6:0)],width={pit:58,beer:42,fence:66,electric:66,copper:64,duck:32}[item.type],height=width*sh/sw;
  const smoothing=c.imageSmoothingEnabled;c.save();c.imageSmoothingEnabled=true;if(item.type==='duck'&&!item.fed)c.globalAlpha=.7;
  if(item.type==='duck'&&item.dx<-.1){c.translate(item.x*2,0);c.scale(-1,1);}
  c.drawImage(image,sx,sy,sw,sh,item.x-width/2,item.y+14-height,width,height);c.restore();c.imageSmoothingEnabled=smoothing;return true;
 }
 root.SnailDefenses={draw,layout,get ready(){return ready();}};
})(globalThis);
