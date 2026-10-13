(function(root){
 'use strict';
 const layout=[[39, 15, 500, 545], [600, 33, 488, 499], [1169, 26, 351, 539], [52, 615, 512, 366], [598, 574, 461, 406], [1184, 565, 308, 438]];
 let image=null,pending=null,loaded=false;
 function ready(){if(pending)return pending;if(!root.Image||!root.SnailAssets?.extras)return Promise.resolve(false);pending=new Promise(resolve=>{image=new root.Image();image.onload=()=>{loaded=(image.naturalWidth||image.width)>0;resolve(loaded);};image.onerror=()=>resolve(false);image.src=root.SnailAssets.extras;});return pending;}
 function draw(c,type,x,y,size=58){
  ready();if(!loaded)return false;const index={rake:0,mallet:1,sickle:2,thorn:3,resin:4,lantern:5}[type];if(index===undefined)return false;
  const [sx,sy,sw,sh]=layout[index],weapon=index<3,width=weapon?size*sw/sh:size,height=weapon?size:size*sh/sw;
  const smoothing=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;c.drawImage(image,sx,sy,sw,sh,x-width/2,y-height,width,height);c.imageSmoothingEnabled=smoothing;return true;
 }
 root.SnailExtras={draw,layout,get ready(){return ready();}};
})(globalThis);
