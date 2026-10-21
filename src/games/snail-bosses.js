(function(root){
 'use strict';
 const layout=[[46, 67, 219, 212], [340, 88, 233, 194], [671, 84, 216, 199], [977, 84, 225, 199], [42, 385, 233, 204], [340, 394, 234, 193], [673, 388, 224, 201], [986, 393, 218, 194], [32, 673, 245, 222], [345, 692, 230, 203], [665, 690, 240, 206], [987, 690, 225, 206], [45, 981, 233, 207], [357, 983, 233, 200]];
 let image=null,pending=null,loaded=false;
 function ready(){if(pending)return pending;if(!root.Image||!root.SnailAssets?.bosses)return Promise.resolve(false);pending=new Promise(resolve=>{image=new root.Image();image.onload=()=>{loaded=(image.naturalWidth||image.width)>0;resolve(loaded);};image.onerror=()=>resolve(false);image.src=root.SnailAssets.bosses;});return pending;}
 function draw(c,n,time=0,reduced=false){
  ready();if(!loaded||n.type!=='boss')return false;
  const index=Number.isInteger(n.bossDesign)&&n.bossDesign>=0&&n.bossDesign<14?n.bossDesign:0;
  const [sx,sy,sw,sh]=layout[index],width=140,height=width*sh/sw,wave=reduced?0:Math.sin(time*3+n.id)*.012;
  const smoothing=c.imageSmoothingEnabled;c.save();c.translate(n.x,n.y+10);c.scale(n.dx<0?-1:1,1);
  c.fillStyle='#08132255';c.beginPath();c.ellipse(0,2,52,9,0,0,Math.PI*2);c.fill();c.scale(1+wave,1-wave);
  c.imageSmoothingEnabled=true;c.drawImage(image,sx,sy,sw,sh,-width/2,-height,width,height);c.restore();c.imageSmoothingEnabled=smoothing;return true;
 }
 root.SnailBosses={draw,layout,get ready(){return ready();}};
})(globalThis);
