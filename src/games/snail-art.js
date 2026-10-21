(function(root) {
  'use strict';
  const M=root.SnailModel, terrainCache=new Map();
  const sceneryCache=new Map();
  function scenerySource(level=0){
    return root.SnailAssets?.[['garden','gardenForest','gardenCastle'][level]]||root.SnailAssets?.garden;
  }
  function loadScenery(level=0){
    const source=scenerySource(level);
    if(!root.Image||!source)return Promise.resolve(false);
    if(sceneryCache.has(source))return sceneryCache.get(source).ready;
    const entry={image:new root.Image(),ready:null,loaded:false};
    sceneryCache.set(source,entry);
    entry.ready=new Promise(resolve=>{entry.image.onload=()=>{entry.loaded=(entry.image.naturalWidth||entry.image.width)>0;resolve(entry.loaded);};entry.image.onerror=()=>resolve(false);entry.image.src=source;});
    return entry.ready;
  }
  const motion=root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const palettes={'.':null,h:'#49382f',s:'#e9bfa0',d:'#bf866b',g:'#455d4a',G:'#739264',b:'#3d6573',B:'#78a2aa',y:'#d5ae65',Y:'#fae2a0',o:'#ba6537',O:'#f0a663',k:'#26353b',w:'#f3e6cb',p:'#c583a2'};
  const person=['.....hhhhhh.....','....hyyyyyyh....','...hyyyyyyyyh...','..yyyyyyyyyyyy..','.....ssssss.....','.....skssks.....','.....ssssss.....','......sdds......','....GGbbbbGG....','...sGGbBBbGGs...','...sGGbbbbGGs...','...sGGbbbbGGs...','....GGbbbbGG....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'];
  const woman=['.....hhhhhh.....','....hyyyyyyh....','...hyyyyyyyyh...','..yyyyyyyyyyyy..','....hssssssh....','....hskssksh....','....hssssssh....','....hhpddphh....','....ppbbbbpp....','...sppbBBbpps...','...sppbbbbpps...','...sppbbbbpps...','....ppbbbbpp....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'];
  const fox=['....o......o....','....oO....Oo....','....oOyyyyOo....','...yyyyyyyyyy...','.....OOOOOO.....','....OOkOOkOO....','.....OwwwO......','......wkw.......','....GGbbbbGG....','...OGGbBBbGGO...','...OGGbbbbGGO...','...OGGbbbbGGO...','....GGbbbbGG....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'];
  const trees=[[58,112],[310,85],[610,91],[916,123],[57,375],[914,389],[66,608],[892,610]];
  const lamps=[[94,172],[760,197],[760,556]];
  const hash=(x,y=0)=>{let value=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);value=Math.imul(value^(value>>>13),1274126177);return (value>>>0)/4294967295;};
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function oval(c,x,y,rx,ry,color,step=3){
    c.fillStyle=color;
    for(let row=-ry;row<ry;row+=step){const mid=(row+step/2)/ry,half=Math.sqrt(Math.max(0,1-mid*mid))*rx;c.fillRect(Math.round(x-half),Math.round(y+row),Math.round(half*2),step);}
  }
  function sparkle(c,x,y,size,color){rect(c,x-size,y-1,size*2+2,2,color);rect(c,x-1,y-size,2,size*2+2,color);}
  function sprite(c,pattern,x,y,scale=2,palette=palettes){pattern.forEach((row,py)=>[...row].forEach((char,px)=>{if(palette[char])rect(c,x+px*scale,y+py*scale,scale,scale,palette[char]);}));}
  const shadeCache=new Map();
  function shade(color,amount){const key=color+':'+amount;if(shadeCache.has(key))return shadeCache.get(key);const value=parseInt(color.slice(1),16),parts=[value>>16,(value>>8)&255,value&255].map(n=>Math.max(0,Math.min(255,n+amount)));const result='#'+parts.map(n=>n.toString(16).padStart(2,'0')).join('');shadeCache.set(key,result);return result;}
  function fineSprite(c,pattern,x,y){
    for(let py=0;py<pattern.length*2;py++)for(let px=0;px<32;px++){
      const row=Math.floor(py/2),col=Math.floor(px/2),char=pattern[row]?.[col],base=palettes[char];if(!base)continue;
      const edge=!palettes[pattern[row]?.[col+1]],light=!palettes[pattern[row-1]?.[col]],texture=(px*3+py*7)%5;
      const amount=edge&&px%2? -18 :light&&py%2===0?17:texture===0?8:texture===1?-5:0;
      c.fillStyle=shade(base,amount);c.fillRect(x+px*1.5,y+py*1.5,1.5,1.5);
    }
  }

  function ground(c,level){
    const colors=[['#759448','#7c9d4f','#839f51','#6c8b44','#829b53','#708f4a'],['#50744b','#5a7c4f','#648754','#466b47','#5d7a50','#6a8658'],['#6d8b60','#77946a','#829970','#627e58','#748d65','#7e956d']][level];
    rect(c,0,0,960,640,M.LEVELS[level].ground);
    for(let y=0;y<640;y+=12)for(let x=0;x<960;x+=12){const r=hash(x,y);rect(c,x,y,12,12,colors[Math.floor(r*colors.length)%colors.length]);if(r>.63){rect(c,x+2,y+5,2,5,'#b6ca713b');rect(c,x+6,y+2,2,6,'#254b3326');}}
    // Low contrast meadow patches give the ground larger, natural variations.
    for(let i=0;i<50;i++)oval(c,hash(i,5)*960,hash(i,7)*640,20+hash(i,8)*35,9+hash(i,9)*15,i%2?'#bfd08116':'#254a3820',4);
    function path(x,y,w,h){rect(c,x-3,y-3,w+6,h+6,level===2?'#4c635a66':'#4c623d60');rect(c,x,y,w,h,level===2?'#9da69b':'#c3b58d');for(let py=y+4;py<y+h;py+=8)for(let px=x+4;px<x+w;px+=13){const r=hash(px,py);rect(c,px,py,3+r*6,2+r*2,r>.5?'#e9ddb4a0':'#85785c55');}rect(c,x,y,w,3,'#e9dfb788');}
    path(77,149,807,35);path(718,149,39,441);path(160,540,595,32);
    if(level===2){for(let y=150;y<570;y+=21){rect(c,719,y,37,1,'#4f625866');rect(c,736+(y%2)*6,y,1,20,'#4f625855');}}
    oval(c,162,93,82,40,'#8a98714d',4);oval(c,162,88,76,35,'#597f75',4);oval(c,163,85,68,29,'#5f9b9c',3);oval(c,170,90,57,20,'#72aaa8',3);
    for(let i=0;i<13;i++){const angle=i/13*Math.PI*2;oval(c,162+Math.cos(angle)*77,91+Math.sin(angle)*36,5+hash(i)*6,3+hash(i,2)*3,'#b5b69c',2);}
    for(let i=0;i<80;i++){const x=115+hash(i,1)*730,y=i%2?487+hash(i,3)*32:198+hash(i,4)*24;rect(c,x,y,2,7,'#476d3e');rect(c,x+3,y-3,2,10,'#a1b465');if(i%3===0){rect(c,x-1,y-2,5,3,['#e5cf99','#dfadc6','#a8c8cf'][i%3]);}}
    for(let i=0;i<12;i++)oval(c,120+i*64,579+hash(i)*4,4+hash(i,3)*5,2+hash(i,4)*3,'#a7af8c',2);
    // Wooden perimeter with uneven grain, nails and shaded grass along the base.
    for(let x=114;x<907;x+=43){rect(c,x,599,7,27,'#72533b');rect(c,x,599,3,25,'#ba9762');rect(c,x+7,607,36,5,'#91704c');rect(c,x+7,607,36,1,'#c2a275');rect(c,x+2,608,2,2,'#434e42');rect(c,x+8,623,23,4,'#3b603d66');}
  }
  function drawGround(c,level){
    let surface=terrainCache.get(level);
    if(!surface){
      if(root.OffscreenCanvas)surface=new root.OffscreenCanvas(960,640);
      else if(root.document){surface=root.document.createElement('canvas');surface.width=960;surface.height=640;}
      if(surface){ground(surface.getContext('2d'),level);terrainCache.set(level,surface);}
    }
    if(surface)c.drawImage(surface,0,0);else ground(c,level);
  }
  function tree(c,x,y,level,time,index){
    const phase=x*.019+index,wind=Math.round(Math.sin(time*.9+phase)*2),width=38+hash(index,4)*8;
    oval(c,x+15,y+26,width+10,12,'#173d3234');
    rect(c,x-9,y-15,18,46,'#604834');rect(c,x-7,y-14,5,43,'#ac8856');rect(c,x+6,y-13,3,42,'#463a30');rect(c,x-13,y+27,26,5,'#64543b');
    for(let i=0;i<6;i++){rect(c,x-4+(i%2)*6,y-5+i*5,4,2,'#4e3e31');}
    c.save();c.translate(wind,Math.round(Math.sin(time*.75+phase)*.6));
    const palette=level===1?['#254b3c','#345b43','#466e49','#638951','#8aa45d']:level===2?['#385b4a','#4f725a','#698761','#8fa476','#b1b988']:['#365c38','#4e743e','#6b914a','#8aab59','#b0c26e'];
    if(level===1&&index%3===0){for(let row=0;row<4;row++){oval(c,x,y-74+row*15,20+row*10,17,palette[row%3],3);rect(c,x-8,y-79+row*15,17,4,palette[3]);}}
    else{
      oval(c,x,y-38,width+7,31,palette[0]);
      const clusters=[[-23,-58,24,21],[18,-62,26,22],[-4,-76,28,21],[-25,-31,22,19],[20,-35,24,21],[0,-48,29,25]];
      clusters.forEach(([dx,dy,rx,ry],i)=>{const sway=Math.round(Math.sin(time*1.1+phase+i)*1.4);oval(c,x+dx+sway,y+dy,rx,ry,palette[1+i%3]);oval(c,x+dx-5+sway,y+dy-7,rx*.65,ry*.42,palette[Math.min(4,2+i%3)]);});
      for(let i=0;i<35;i++){const angle=hash(i,index)*Math.PI*2,r=hash(i,index+2)*width;const lx=x+Math.cos(angle)*r,ly=y-49+Math.sin(angle)*r*.65;rect(c,lx,ly,3+hash(i,9)*5,2,palette[i%2?3:0]);}
      if(level===0)for(const [dx,dy] of [[-27,-43],[17,-58],[9,-24]]){oval(c,x+dx,y+dy,4,4,'#c27853',2);rect(c,x+dx-2,y+dy-2,2,2,'#f0bf77');}
    }
    c.restore();
  }
  function bushes(c,time){
    for(const [x,y]of [[116,268],[837,330],[120,468],[835,505]]){const bend=Math.round(Math.sin(time+x)*1);oval(c,x,y,22,12,'#365b3d');oval(c,x-8+bend,y-6,13,11,'#628850');oval(c,x+10+bend,y-5,13,10,'#79974f');for(let i=0;i<4;i++){rect(c,x-13+i*8,y-5+(i%2)*5,3,3,i%2?'#dfa6c1':'#e6d8a6');}}
  }
  function pond(c,time){
    for(let i=0;i<5;i++){const x=120+i*20+Math.sin(time*.5+i)*6,y=74+(i%3)*13;rect(c,x,y,13+Math.sin(time+i)*4,1,'#b1d9c38c');}
    for(const [x,y]of [[130,68],[189,91]]){oval(c,x,y,10,5,'#39734e',2);rect(c,x+1,y-2,2,3,'#87ad74');oval(c,x-2,y-4,3,2,'#e4b5cb',2);}
    for(let i=0;i<9;i++){const x=91+i*5,y=98+(i%3)*4,bend=Math.sin(time*1.2+i)*2;rect(c,x,y-19,2,25,'#567944');rect(c,x+bend,y-24,2,8,'#aeb97b');rect(c,x+bend,y-27,3,6,'#8d6b44');}
  }
  function architecture(c,level,time){
    if(level===1)for(let i=0;i<12;i++){const x=112+i*65,y=108+(i%3)*14;rect(c,x-2,y,4,12,'#d8c3a5');oval(c,x,y-2,9,5,'#a183b1',2);rect(c,x-4,y-4,3,2,'#ddbdd7');}
    if(level===2){rect(c,357,46,184,39,'#53675f');for(let row=0;row<3;row++)for(let col=0;col<8;col++){const x=358+col*23+(row%2)*5;rect(c,x,48+row*12,21,10,['#849187','#9fa89b','#77867d'][(row+col)%3]);rect(c,x+1,49+row*12,18,1,'#c0c4ac');}for(let x=357;x<541;x+=23)rect(c,x,34,14,15,'#85948a');rect(c,424,44,47,55,'#42544d');oval(c,447,49,24,18,'#a8b19f',3);rect(c,432,51,30,44,'#263e3a');for(let y=58;y<114;y+=10){rect(c,384+(y%3)*4,y,5,7,'#749263');rect(c,514-(y%4)*3,y,4,7,'#618152');}}
    // Scarecrow: patched shirt, straw fingers and a swinging sleeve.
    rect(c,630,146,5,53,'#95734d');rect(c,606,157,51,4,'#a08358');rect(c,622,149,22,28,'#789168');rect(c,625,150,5,25,'#91a07a');rect(c,637,161,5,6,'#b1a06e');rect(c,622,128,21,20,'#deb575');rect(c,618,124,29,6,'#b9995e');rect(c,625,118,17,7,'#ddc089');rect(c,627,136,2,2,'#473a2c');rect(c,637,136,2,2,'#473a2c');rect(c,634,142,5,1,'#8b603f');rect(c,647,158+Math.sin(time)*2,8,8,'#718761');
    // Stall: timber grain, hanging herbs, baskets and a fluttering awning.
    rect(c,774,184,142,8,'#173c3233');rect(c,781,104,11,81,'#674a33');rect(c,890,104,11,81,'#674a33');rect(c,783,105,3,76,'#bd9564');rect(c,892,105,3,76,'#bd9564');rect(c,773,147,139,40,'#ad8053');
    for(let i=0;i<9;i++){rect(c,775+i*15,151,1,32,'#815c3c');rect(c,777+i*15,154+(i%3)*5,8,1,'#d7ab71');}rect(c,767,144,149,8,'#d3a56b');rect(c,768,146,147,2,'#f1c486');rect(c,766,88,152,33,'#e7dbb8');
    for(let i=0;i<10;i++){const x=766+i*15,y=116+Math.round(Math.sin(time*1.4+i*.6)*2);rect(c,x,88,15,29,i%2?'#dccfab':'#b97065');rect(c,x,y,15,7,i%2?'#f1e4c0':'#d38d7d');rect(c,x+1,91,2,22,'#ffffff16');}
    rect(c,797,48,90,32,'#6b4d34');rect(c,799,50,86,2,'#a88050');c.fillStyle='#f8e8bf';c.font='bold 14px monospace';c.textAlign='center';c.fillText('STAND',842,70);
    rect(c,823,157,41,22,'#efd8a5');rect(c,825,159,37,1,'#fff0c7');c.fillStyle='#765335';c.font='11px monospace';c.fillText('SHOP',844,173);
    for(let i=0;i<3;i++){oval(c,808+i*28,136,10,5,'#755333',2);rect(c,799+i*28,136,18,7,'#bb955d');rect(c,800+i*28,138,15,1,'#e3c287');for(let j=0;j<3;j++)rect(c,801+i*28+j*5,129,4,6,['#d48979','#b3bf77','#d5b26b'][i]);}
    for(let i=0;i<3;i++){oval(c,810+i*27,203,10,4,'#17352b33');rect(c,802+i*27,191,16,17,'#c6a275');rect(c,802+i*27,191,16,2,'#e8cfa0');rect(c,804+i*27,199,12,2,'#8e7546');rect(c,805+i*27,194,3,3,'#eedbaa');}
    for(const [x,y]of lamps){rect(c,x-3,y-21,6,41,'#654e34');rect(c,x-2,y-21,2,40,'#af8a50');rect(c,x-8,y-33,16,21,'#493e2d');rect(c,x-5,y-30,10,14,'#edca7c');rect(c,x-3,y-28,3,9,'#fff0ba');rect(c,x-10,y-36,20,4,'#725536');}
  }

  function flower(c,p,time,night){
    const x=p.x,y=p.y;
    c.save();c.translate(x,y);c.scale(.66,.66);c.translate(-x,-y);
    if(!p.unlocked){rect(c,x-27,y-27,54,54,'#344f3322');for(let i=0;i<4;i++)rect(c,x-24+i*15,y-25,5,2,'#c3ce9355');c.fillStyle='#dfdaa36b';c.font='16px monospace';c.textAlign='center';c.fillText('+',x,y+6);c.restore();return;}
    // Sunken soil follows the grass without a raised rectangular planter.
    oval(c,x,y+10,29,20,'#27482e25',1);
    oval(c,x,y+9,26,17,p.watered?'#65472f':'#896341',1);
    oval(c,x-1,y+7,24,15,p.watered?'#745238':'#967248',1);
    for(let i=0;i<130;i++){
      const angle=hash(i+75,x)*Math.PI*2,radius=Math.sqrt(hash(i+51,y));
      const gx=x+Math.cos(angle)*radius*24,gy=y+8+Math.sin(angle)*radius*14;
      rect(c,gx,gy,1+(i%7===0?1:0),1,[p.watered?'#513d2d':'#795539','#b3976188','#4b392e99','#d6b68155'][i%4]);
    }
    for(let i=0;i<18;i++){const angle=i*Math.PI*2/18,gx=x+Math.cos(angle)*26,gy=y+9+Math.sin(angle)*17;rect(c,gx,gy-2-(i%3),1,3+i%3,i%2?'#54733f':'#8ba059');}
    if(!p.type){oval(c,x,y+9,12,7,'#483b2c',1);rect(c,x-5,y+5,3,3,'#d5bc80');rect(c,x+2,y+7,3,2,'#bd9b63');rect(c,x-1,y-7,2,10,'#b8d295');rect(c,x-5,y-3,10,2,'#b8d295');c.restore();return;}
    const plant=M.PLANTS[p.type],dry=p.dry>0,weak=p.hp<plant.hp*.5,bend=Math.round(Math.sin(time*1.2+x*.01)*(dry?1:2)),fy=y-20+(dry?6:0),fx=x+bend;
    rect(c,x-2,y-17,4,33,dry?'#85744c':'#3a7042');rect(c,x,y-17,1,30,dry?'#b3a16c':'#7aa962');
    oval(c,x-10,y+2,9,4,dry?'#948249':'#538a45',2);oval(c,x+9,y-6,8,4,dry?'#a49056':'#6c9d4a',2);rect(c,x-13,y+1,10,1,'#9cbc6d');
    const petals=dry?'#c9ac85':plant.color;
    if(p.type==='daisy'){
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,px=fx+Math.cos(angle)*9,py=fy+Math.sin(angle)*9;if(weak&&i===5)continue;oval(c,px,py,5,5,petals,2);rect(c,px-1,py-3,3,2,dry?'#ddc39d':'#fff0bb');}
      oval(c,fx,fy,5,5,'#b78939',2);oval(c,fx-1,fy-1,4,3,'#f0c568',2);rect(c,fx-2,fy-2,2,2,'#ffe7a0');
    }else if(p.type==='tulip'){
      rect(c,fx-11,fy-10,22,14,dry?'#ae876c':'#b9618c');rect(c,fx-8,fy-12,6,20,petals);rect(c,fx+2,fy-15,6,21,petals);rect(c,fx-2,fy-13,6,21,dry?'#d1ad86':'#f4b0cd');rect(c,fx-8,fy-12,2,10,'#ffe0de');rect(c,fx+7,fy-9,3,12,'#8d5271');rect(c,fx-5,fy+6,12,3,petals);
    }else if(p.type==='moon'){
      for(let i=0;i<5;i++){const angle=i*Math.PI*2/5-.3,px=fx+Math.cos(angle)*9,py=fy+Math.sin(angle)*9;oval(c,px,py,6,5,dry?'#bda893':'#908dc6',2);oval(c,px-1,py-2,4,3,petals,2);}rect(c,fx-3,fy-3,6,6,'#e4ddef');rect(c,fx-1,fy-1,2,2,'#fff9db');
    }else{
      oval(c,fx,fy,14,12,dry?'#927e83':'#487b9c',2);oval(c,fx-2,fy-3,11,9,petals,2);oval(c,fx+2,fy+1,7,6,dry?'#bcaa99':'#78bfc7',2);oval(c,fx,fy-1,4,4,dry?'#cebea4':'#d6f3ef',2);rect(c,fx-9,fy-7,6,2,'#e6f8ed');rect(c,fx+7,fy+2,2,5,'#39758b');
    }
    // Veins, pollen and petal highlights use individual logical pixels.
    const petalCount=p.type==='daisy'?8:p.type==='moon'?5:0;
    for(let i=0;i<petalCount;i++){
      const angle=i*Math.PI*2/petalCount-(p.type==='moon'?.3:0),px=fx+Math.cos(angle)*9,py=fy+Math.sin(angle)*9;
      for(let j=0;j<5;j++)rect(c,px-3+j,py-2+(j%2),1,1,dry?'#eed3ad':'#fff7e5');
      rect(c,px+2,py+2,1,2,dry?'#a68b69':shade(plant.color,-30));
    }
    for(let i=0;i<7;i++){rect(c,x-1,y-13+i*4,1,1,dry?'#b49c66':'#9db778');}
    if(p.type==='tulip')for(let i=0;i<5;i++){rect(c,fx-6+i*3,fy-8+(i%2),1,7,'#ffe4e266');rect(c,fx-8+i*4,fy+3,1,2,'#934868');}
    if(p.type==='crystal')for(let i=0;i<6;i++){const angle=i*Math.PI/3;rect(c,fx+Math.cos(angle)*7,fy+Math.sin(angle)*5,2,1,'#edfdf1');}
    if(p.watered){rect(c,x+19,y+14,4,7,'#61b6d3');rect(c,x+20,y+12,2,3,'#a8e9ed');rect(c,x-17,y+15,5,1,'#c3e7e77a');}
    if((p.type==='moon'||p.type==='crystal')&&night){const light=Math.max(.15,.5+Math.sin(time*1.5+x)*.2);c.globalAlpha=light;sparkle(c,fx+19,fy-12,2,'#d9ecff');c.globalAlpha=1;}
    rect(c,x-15,y+23,30,3,'#3a4130');rect(c,x-15,y+23,30*p.hp/plant.hp,3,weak?'#dd9b7a':'#a7c980');
    c.restore();
  }

  function character(c,type,x,y,time=0,moving=false,direction={dx:0,dy:1},pose={}){
    time=motion?.matches?0:time;const walk=moving?Math.sin(time*13):0,bob=moving?Math.round(Math.abs(walk)):0;
    if(root.SnailSprites?.character(c,type,x,y,time,moving,direction)){
      if(pose.water){const cx=x+direction.dx*21,cy=y-19+direction.dy*12;rect(c,cx-8,cy-5,15,11,'#658f99');rect(c,cx-6,cy-4,10,2,'#c2d9d0');rect(c,cx+6,cy-3,10,3,'#729da6');}
      return;
    }
    const flip=direction.dx<-.4;if(flip){c.save();c.translate(x*2,0);c.scale(-1,1);}
    oval(c,x,y+2,21,6,'#102e303b');
    if(type==='fox'){const sway=Math.round(Math.sin(time*3.5)*3);rect(c,x+15,y-24+sway,17,8,'#b56636');rect(c,x+28,y-31+sway,8,12,'#df9855');rect(c,x+29,y-31+sway,7,5,'#f0dfbd');rect(c,x+18,y-23+sway,8,2,'#edb775');}
    const pattern=type==='fox'?fox:type==='gardeneress'?woman:person;
    fineSprite(c,pattern.slice(0,13),x-24,y-51-bob);
    // Alternating steps and swinging arms, rather than moving the whole sprite up and down.
    for(let leg=0;leg<2;leg++){const offset=moving?Math.round(walk*(leg?3:-3)):0,lx=x+(leg?3:-12);rect(c,lx,y-12,9,10+offset,'#3d6573');rect(c,lx+1,y-12,2,9+offset,'#719aa2');rect(c,lx-1,y-3+offset,11,5,'#26353b');rect(c,lx,y-3+offset,7,1,'#52605d');}
    for(let side of [-1,1]){const offset=moving?Math.round(walk*side*3):0;rect(c,x+side*19-2,y-22+offset,5,8,type==='fox'?'#e4a061':'#e5b494');rect(c,x+side*19-1,y-21+offset,2,3,type==='fox'?'#f5c189':'#f4d0ae');}
    rect(c,x-8,y-48-bob,16,2,'#f6d992');rect(c,x-14,y-44-bob,27,1,'#f2d493');rect(c,x-14,y-42-bob,25,2,'#a4804d');
    rect(c,x-8,y-22-bob,7,7,'#78a2aa');rect(c,x-7,y-21-bob,5,1,'#a9c2bc');rect(c,x+4,y-28-bob,2,2,'#d4bf88');rect(c,x-13,y-13,26,2,'#675444');
    // A leaf charm, stitched cuffs and a tiny sash keep the garden figures folkloric.
    rect(c,x-16,y-27-bob,3,9,'#98ad75');rect(c,x+14,y-27-bob,3,9,'#98ad75');rect(c,x-3,y-26-bob,1,5,'#d8bc77');
    oval(c,x-2,y-20-bob,2,3,'#d5cb8a',1);rect(c,x-2,y-22-bob,1,2,'#fff0bb');rect(c,x+10,y-12,2,9,'#b99170');
    if(direction.dy<-.45){rect(c,x-8,y-38-bob,20,15,type==='fox'?'#e99f5b':type==='gardeneress'?'#765445':'#b58e63');rect(c,x-6,y-38-bob,14,2,type==='fox'?'#f3b477':'#c3a179');}
    else if((time+x*.003)%4.7<.12){rect(c,x-7,y-35-bob,3,2,type==='fox'?'#eda464':'#e4b89b');rect(c,x+6,y-35-bob,3,2,type==='fox'?'#eda464':'#e4b89b');}
    if(pose.water){const cx=x+direction.dx*21,cy=y-19+direction.dy*12;rect(c,cx-8,cy-5,15,11,'#658f99');rect(c,cx-6,cy-4,10,2,'#a8ccd0');rect(c,cx+6,cy-3,10,3,'#729da6');rect(c,cx-10,cy-8,3,8,'#416772');}
    if(flip)c.restore();
  }
  function snail(c,n,time,night){
    const detailedBoss=n.type==='boss'&&root.SnailBosses?.draw(c,n,time,!!motion?.matches);
    if(detailedBoss||root.SnailSprites?.snail(c,n,time)){
      if(night&&!detailedBoss){const facing=n.dx<0?-1:1;for(let i=0;i<2;i++){const ex=n.x+facing*(19+i*5),ey=n.y-11-i*3;oval(c,ex,ey,4,4,'#ffd77b28',1);rect(c,ex,ey,2,2,n.type==='armored'?'#b4eef8':'#fff0bd');}}
      if(n.type==='boss'&&!detailedBoss){
        const x=n.x-18,y=n.y-61;rect(c,x,y,32,6,'#8b632e');rect(c,x+2,y-6,5,8,'#d9b66b');rect(c,x+13,y-11,5,13,'#eed58b');rect(c,x+25,y-7,5,9,'#d9b66b');rect(c,x+13,y-3,4,3,'#a74967');
      }
      if(n.maxHp>1&&n.type!=='boss'){rect(c,n.x-15,n.y-31,30,3,'#342d3c');rect(c,n.x-15,n.y-31,30*n.hp/n.maxHp,3,'#d992a0');}
      return;
    }
    const giant=['giant','boss'].includes(n.type),r=n.type==='boss'?32:giant?19:12,breath=Math.round(Math.sin(time*3+n.id)*.8),direction=n.dx<0?-1:1;
    oval(c,n.x+4,n.y+10,r+13,5,'#16343145');c.save();c.translate(Math.round(n.x),Math.round(n.y));c.scale(direction,1);
    const skin=n.type==='fast'?'#b4a987':giant?'#789588':'#91a184';
    for(let i=0;i<7;i++)rect(c,-r-9+i*7,5+Math.round(Math.sin(time*6+i)*1),8,6,i%2?skin:'#698b78');
    oval(c,0,-3+breath,r,r, n.type==='armored'?'#526d80':giant?'#754e77':'#986c47',2);
    oval(c,-3,-6+breath,r-3,r-4,n.type==='armored'?'#8498a6':giant?'#b887ab':'#c99b66',2);
    const coil=n.type==='armored'?'#516677':giant?'#805b8a':'#8e643f';
    for(let i=0;i<17;i++){const angle=i*.53,radius=(17-i)*r/20;rect(c,Math.cos(angle)*radius-2,-3+Math.sin(angle)*radius+breath,3,3,coil);}
    rect(c,-r+5,-r+3,7,2,n.type==='armored'?'#d4dfda':'#e6be89');
    if(n.type==='armored'){rect(c,-9,-12,2,22,'#bdc6bf');rect(c,1,-13,2,21,'#465d6b');rect(c,7,-8,2,14,'#c8d1c7');}
    if(giant){rect(c,-15,-17,5,3,'#ddb4c9');rect(c,10,-13,4,5,'#715178');}
    rect(c,r+4,-1,10,10,skin);rect(c,r+5,0,3,3,'#b9c39d');
    const sway=Math.round(Math.sin(time*2+n.id)*2);rect(c,r+6,-12+sway,2,13-sway,skin);rect(c,r+12,-9-sway,2,10+sway,skin);
    if(night){rect(c,r+3,-16+sway,8,7,'#f3d99520');rect(c,r+9,-13-sway,8,7,'#f3d99520');}
    rect(c,r+5,-14+sway,4,3,night?'#f9de94':'#263c32');rect(c,r+11,-11-sway,4,3,night?'#ffeba6':'#263c32');
    rect(c,r+9,6,5,1,'#527362');if(n.type==='fast'){rect(c,-r-18,10,12,1,'#cdd9ca65');rect(c,-r-12,13,7,1,'#cdd9ca45');}c.restore();
    if(n.maxHp>1){rect(c,n.x-15,n.y-r-10,30,3,'#342d3c');rect(c,n.x-15,n.y-r-10,30*n.hp/n.maxHp,3,'#d992a0');}
  }
  function structure(c,t,time){
    if(root.SnailDefenses?.draw(c,t,time)){
      if(t.type==='fence'){rect(c,t.x-20,t.y+20,40,3,'#32523a');rect(c,t.x-20,t.y+20,40*t.hp/M.ITEMS.fence.hp,3,'#cbae75');}
      if(t.charges){c.fillStyle='#fff0c5';c.font='bold 10px Georgia';c.textAlign='center';c.fillText(t.charges,t.x,t.y+29);}
      if(t.type==='electric'&&t.charges>0&&Math.sin(time*5+t.id)>.7)sparkle(c,t.x+10,t.y-19,2,'#c5f5f0');
      return;
    }
    const x=t.x,y=t.y;oval(c,x+4,y+13,24,6,'#25442d32');
    if(t.type==='duck'){const bob=t.fed?Math.round(Math.sin(time*5+t.id)):0;oval(c,x,y+3,13,8,t.fed?'#e8dcb8':'#a8a58c',2);oval(c,x-4,y+1,8,5,'#fff0cf',2);rect(c,x+6,y-16+bob,9,18,t.fed?'#f2e7c8':'#c4bca2');rect(c,x+14,y-11+bob,8,4,'#e9b763');rect(c,x+12,y-15+bob,2,2,'#2c4436');rect(c,x-5,y+10,4,3,'#d9a153');rect(c,x+6,y+10,4,3,'#d9a153');return;}
    if(t.type==='pit'){oval(c,x,y,23,18,'#8e6b48',3);oval(c,x,y+2,18,13,'#372e2b',3);oval(c,x+2,y+5,12,7,'#202e29',2);rect(c,x-20,y-12,13,3,'#b59b64');rect(c,x+9,y-10,9,3,'#64824b');}
    if(t.type==='beer'){oval(c,x,y+10,13,5,'#65442e',2);rect(c,x-12,y-12,24,25,'#b68850');for(let i=0;i<4;i++)rect(c,x-9+i*5,y-10,1,21,'#7a5835');rect(c,x-13,y-9,26,3,'#82745b');rect(c,x-13,y+8,26,3,'#817059');oval(c,x,y-11,12,5,'#d7bd7b',2);oval(c,x,y-12,8,3,'#fff0bf',2);rect(c,x-6,y-12,3,2,'#cfa55b');}
    if(t.type==='fence'||t.type==='electric'){
      const electric=t.type==='electric';for(const px of [-22,17]){rect(c,x+px,y-19,6,42,electric?'#829399':'#805b3c');rect(c,x+px,y-19,2,40,electric?'#c1c9c1':'#d0aa70');rect(c,x+px-1,y-21,8,3,electric?'#6d8088':'#ab8857');}
      for(const py of [-8,8]){rect(c,x-22,y+py,44,5,electric?'#839b9c':'#ab8758');rect(c,x-21,y+py,42,1,electric?'#c2d0cc':'#dfbd83');for(const px of [-19,18])rect(c,x+px,y+py+2,2,2,'#4d5f55');}
      if(electric){rect(c,x-5,y-18,4,12,'#8ee0e8');rect(c,x-1,y-8,6,3,'#b8f1f1');rect(c,x+2,y-5,3,9,'#8fe3e8');if(Math.sin(time*4+t.id)>.8)sparkle(c,x+15,y-8,3,'#d8f8f1');}
      else{if(t.hp<M.ITEMS.fence.hp/2){rect(c,x-9,y-7,3,4,'#543f32');rect(c,x-6,y-4,4,1,'#543f32');}rect(c,x-20,y+25,40,3,'#32523a');rect(c,x-20,y+25,40*t.hp/M.ITEMS.fence.hp,3,'#cbae75');}
    }
    if(t.type==='copper'){rect(c,x-26,y-9,52,19,'#b3774e');rect(c,x-26,y-9,52,3,'#efc386');rect(c,x-26,y+7,52,3,'#764d3a');for(let i=0;i<6;i++)rect(c,x-23+i*8,y-2,4,2,'#dfa36b');}
    if(t.charges){c.fillStyle='#eee2c3';c.font='10px monospace';c.textAlign='center';c.fillText(t.charges,x,y+33);}
  }
  function atmosphere(c,s,time){
    if(s.phase==='night'){
      rect(c,0,0,960,640,'#102547aa');
      for(const [x,y]of lamps){const radius=100+Math.sin(time*2+x)*3,glow=c.createRadialGradient(x,y-24,4,x,y-24,radius);glow.addColorStop(0,'#ffe2a269');glow.addColorStop(.45,'#f4c17b24');glow.addColorStop(1,'#f4c17b00');c.fillStyle=glow;c.fillRect(x-radius,y-24-radius,radius*2,radius*2);rect(c,x-4,y-28,8,10,'#ffe7ad');}
      for(const p of s.plots)if(p.type==='moon'||p.type==='crystal'){const glow=c.createRadialGradient(p.x,p.y-20,2,p.x,p.y-20,42);glow.addColorStop(0,'#c7d8ff44');glow.addColorStop(1,'#c7d8ff00');c.fillStyle=glow;c.fillRect(p.x-42,p.y-62,84,84);}
    }else{
      const evening=Math.max(0,(s.dayTime-90)/90);if(evening)rect(c,0,0,960,640,`rgba(235,149,92,${evening*.15})`);
      const light=c.createLinearGradient(0,0,960,640);light.addColorStop(0,'#fff0c21c');light.addColorStop(.6,'#fff0c200');light.addColorStop(1,'#253b4520');c.fillStyle=light;c.fillRect(0,0,960,640);
    }
  }
  function ambient(c,night,time){
    for(let i=0;i<12;i++){const x=(i*83+Math.sin(time*.3+i)*24+960)%960,y=95+(i*47)%438+Math.sin(time*.7+i)*12;
      if(night){const brightness=.28+(Math.sin(time*1.5+i)+1)*.25;c.globalAlpha=brightness;rect(c,x-3,y-3,7,7,'#cbd88c22');rect(c,x,y,2,2,'#f0e8ab');c.globalAlpha=1;}
      else{const wing=1+Math.round(Math.abs(Math.sin(time*6+i))*3);rect(c,x-wing,y-2,wing,4,i%2?'#e6b6ce':'#f1dfab');rect(c,x+2,y-2,wing,4,i%2?'#f1cddd':'#ffeec7');rect(c,x+1,y,1,4,'#766b57');}
    }
    if(night)for(let i=0;i<4;i++){const x=(time*6+i*287)%1320-180,y=230+i*88+Math.sin(time*.3+i)*12;c.save();c.translate(x,y);c.scale(2.8,.24);const fog=c.createRadialGradient(0,0,5,0,0,110);fog.addColorStop(0,'#bdcad623');fog.addColorStop(.55,'#b2c0cd12');fog.addColorStop(1,'#b2c0cd00');c.fillStyle=fog;c.fillRect(-110,-110,220,220);c.restore();}
  }
  // Find a safe initial position once; all subsequent movement is continuous.
  function catStart(s,origin=s.player){
    const seed=s.level*977;
    const obstacles=[...s.plots.filter(p=>p.unlocked),...s.structures];
    for(let i=0;i<80;i++){
      const nearby=origin&&i<60;
      const x=nearby?Math.max(140,Math.min(820,origin.x+(hash(seed+i*13,41)-.5)*210)):140+hash(seed+i*13,41)*680;
      const y=nearby?Math.max(205,Math.min(520,origin.y+(hash(seed+i*17,83)-.5)*150)):205+hash(seed+i*17,83)*315;
      const dx=(hash(seed+i*19,97)>.5?1:-1)*(55+hash(seed+i*23,101)*65),dy=(hash(seed+i*29,107)-.5)*55;
      const target={x:Math.max(140,Math.min(820,x+dx)),y:Math.max(205,Math.min(520,y+dy))};
      const vx=target.x-x,vy=target.y-y,length=vx*vx+vy*vy;
      if(origin&&Math.hypot(x-origin.x,y-origin.y)<42)continue;
      if(obstacles.some(o=>{const t=length?Math.max(0,Math.min(1,((o.x-x)*vx+(o.y-y)*vy)/length)):0;return Math.hypot(o.x-x-vx*t,o.y-y-vy*t)<42;}))continue;
      return {x,y,facing:vx<0?-1:1};
    }
    return null; // A completely occupied garden has no safe visiting place.
  }
  function createCat(s){
    const point=catStart(s);if(!point)return null;
    return {...point,mode:'sit',age:0,remaining:4,decision:0,target:null,walking:false};
  }
  function catRouteClear(s,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
    return ![...s.plots.filter(p=>p.unlocked),...s.structures].some(o=>{
      const t=length?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/length)):0;
      return Math.hypot(o.x-a.x-dx*t,o.y-a.y-dy*t)<42;
    });
  }
  function nextCatAction(cat,s){
    const sequence=['walk','play','sit','walk','groom','sleep','walk','sit','play','sleep'];
    const decision=cat.decision++,mode=sequence[decision%sequence.length],roll=hash(decision+17,s.level+51);
    cat.previousMode=cat.mode;cat.mode=mode;cat.age=0;cat.walking=false;cat.target=null;
    cat.remaining=mode==='sleep'?22+roll*18:mode==='sit'?5+roll*6:mode==='groom'?6+roll*4:5+roll*3;
    if(mode!=='walk')return;
    for(let i=0;i<48;i++){
      const angle=hash(decision*71+i*17,s.level+33)*Math.PI*2,distance=55+hash(i*19,decision+13)*95;
      const target={x:Math.max(140,Math.min(820,cat.x+Math.cos(angle)*distance)),y:Math.max(205,Math.min(520,cat.y+Math.sin(angle)*distance))};
      if(M.dist(cat,target)<35||!catRouteClear(s,cat,target))continue;
      cat.target=target;cat.walking=true;cat.facing=target.x<cat.x?-1:1;cat.remaining=M.dist(cat,target)/24;return;
    }
    cat.mode='sit';cat.remaining=5;
  }
  function updateCat(cat,s,elapsed){
    if(!cat||s.over||motion?.matches||!Number.isFinite(elapsed)||elapsed<=0)return;
    let left=Math.min(elapsed,30);
    while(left>1e-8){
      if(cat.remaining<=1e-8)nextCatAction(cat,s);
      const dt=Math.min(.1,left,cat.remaining);left-=dt;cat.remaining-=dt;cat.age+=dt;
      if(cat.mode==='walk'&&cat.target){
        const distance=M.dist(cat,cat.target),step=Math.min(distance,24*dt),next={x:cat.x+(cat.target.x-cat.x)/Math.max(distance,.001)*step,y:cat.y+(cat.target.y-cat.y)/Math.max(distance,.001)*step};
        if(catRouteClear(s,cat,next)){cat.x=next.x;cat.y=next.y;}
        else{cat.previousMode=cat.mode;cat.mode='sit';cat.walking=false;cat.target=null;cat.remaining=2;cat.age=0;}
      }
    }
  }
  function blackCat(c,cat,night=false){
    if(!cat)return;
    if(root.SnailCat?.draw(c,cat,night,!!motion?.matches))return;
    const mode=cat.mode||'sit',age=motion?.matches?0:cat.age||0;
    const poses={sit:[0,-11,10,14,0,-27],walk:[-2,-11,15,8,12,-23],sleep:[0,-6,18,8,14,-8],play:[0,-10,11,12,3,-25],groom:[0,-10,10,13,0,-22]};
    const blend=motion?.matches?1:Math.min(1,age/.65),ease=blend*blend*(3-2*blend);
    const from=poses[cat.previousMode]||poses[mode],to=poses[mode]||poses.sit,p=to.map((v,i)=>from[i]+(v-from[i])*ease);
    const [bx,by,rx,ry,hx,headY]=p,walking=mode==='walk',playing=mode==='play',sleeping=mode==='sleep';
    const gait=walking?Math.sin(age*9):0,breath=Math.sin(age*(sleeping?1.4:2))*.45;
    const hop=playing?Math.max(0,Math.sin(age*3.3))**5*3:0;
    const hy=headY+(walking?Math.abs(gait)*.7:mode==='groom'?Math.sin(age*5)*1.1:breath)-hop;
    const colors=night?['#090f18','#121c29','#1c2a3b','#2e4152','#506477','#849992']:['#111719','#1c2426','#293234','#3c4847','#61716a','#a0aa8d'];
    c.save();c.translate(Math.round(cat.x),Math.round(cat.y));c.scale(cat.facing||1,1);
    oval(c,1,3,walking?20:18,4,night?'#08132288':'#23352866',1);
    // Four paws alternate naturally; the far paws sit in deeper shadow.
    const pawY=sleeping?0:1;
    for(const [i,lx]of [[0,bx-rx+4],[1,bx+rx-5],[2,bx-rx+7],[3,bx+rx-2]]){
      const phase=i%2?gait:-gait,lift=walking?Math.max(0,phase)*3:0;
      rect(c,lx+(walking?phase*2:0),by+ry-6,3,Math.max(1,7-lift),i<2?colors[0]:colors[1]);
      oval(c,lx+1+(walking?phase*2:0),pawY-lift,3,2,i<2?colors[1]:colors[3],1);
    }
    // Curved tail, gently flicking at its tip rather than swinging as a rigid bar.
    const sway=motion?.matches?0:Math.sin(age*(playing?3.5:1.7))*3;
    for(let i=0;i<15;i++){
      const t=i/14,tx=sleeping?-rx+5+Math.sin(t*4.9)*11:bx-rx+2-t*12+Math.sin(t*3)*3;
      const ty=sleeping?-2+Math.cos(t*4.9)*4:by+4-t*(walking?17:20)+sway*t*t;
      oval(c,tx,ty,t>.8?2:3,2,colors[0],1);rect(c,tx,ty-1,2,1,colors[3]);
    }
    oval(c,bx,by-hop,rx,ry+breath,colors[0],1);
    oval(c,bx+2,by-2-hop,Math.max(2,rx-2),Math.max(2,ry-3),colors[1],1);
    oval(c,bx+3,by-4-hop,Math.max(2,rx-5),Math.max(2,ry-6),colors[2],1);
    // Short charcoal strands catch warm daylight or blue moonlight.
    for(let i=0;i<26;i++){
      const fx=(hash(i*13,7)*2-1)*(rx-2),fy=(hash(i*19,11)*2-1)*(ry-2);
      if((fx*fx)/(rx*rx)+(fy*fy)/(ry*ry)>.7)continue;
      rect(c,bx+fx,by+fy-hop,1+(i%3===0?1:0),1,i%4===0?colors[4]:colors[2]);
    }
    oval(c,hx,hy,8,7,colors[0],1);oval(c,hx+1,hy-1,6,5,colors[2],1);
    for(const ex of [-7,3]){
      const twitch=motion?.matches?0:Math.sin(age*1.2+ex)> .97?1:0;
      for(let row=0;row<7;row++){const width=1+Math.floor(row*.65);rect(c,hx+ex-width/2+twitch,hy-11+row,width,1,colors[0]);}
      rect(c,hx+ex,hy-8,1,3,night?'#654c60':'#9a7276');rect(c,hx+ex-1,hy-5,3,1,colors[3]);
    }
    const closed=sleeping||age%7>6.7||mode==='groom'&&Math.sin(age*5)>.5;
    if(closed){rect(c,hx-5,hy,4,1,colors[4]);rect(c,hx+3,hy,4,1,colors[4]);}
    else{
      if(night){oval(c,hx-3,hy-1,4,3,'#bbc68118',1);oval(c,hx+5,hy-1,4,3,'#bbc68118',1);}
      for(const ex of [-5,3]){rect(c,hx+ex,hy-1,4,2,night?'#cbd694':'#a9bb72');rect(c,hx+ex+2,hy-1,1,2,colors[0]);rect(c,hx+ex,hy-1,1,1,'#f4e8c1');}
    }
    oval(c,hx+1,hy+3,4,2,colors[3],1);rect(c,hx,hy+2,2,1,night?'#a47d93':'#c09291');rect(c,hx+1,hy+3,1,2,colors[0]);
    for(const side of [-1,1]){rect(c,hx+side*8-(side<0?4:0),hy+2,5,1,colors[5]);rect(c,hx+side*8-(side<0?3:0),hy+5,4,1,colors[4]);}
    if(playing){const reach=3+Math.sin(age*6)*4;oval(c,9+reach,-11-hop,6,3,colors[1],1);rect(c,13+reach,-12-hop,3,2,colors[4]);}
    if(mode==='groom'){const lick=Math.sin(age*5);rect(c,hx+2,hy+5,3,7,colors[3]);oval(c,hx+3,hy+5,3,2,colors[4],1);if(lick>.4)rect(c,hx+2,hy+4,2,2,'#b5828c');}
    c.restore();
  }
  function bossAttack(c,a){
    const colors={lava:['#fb813e','#f9d675'],storm:['#86b6f7','#e1ebff'],forest:['#80a267','#c1d594'],cosmic:['#c397ed','#fff0c6'],poison:['#9ecb4d','#d1e794'],crystal:['#99c9ee','#dcbbf4'],infernal:['#e87d5e','#efbd73']},[base,light]=colors[a.theme]||colors.lava;
    c.save();c.globalAlpha=a.hit?Math.max(0,1+a.timer/(a.hold||1.2)):.8;
    if(!a.hit){
      c.strokeStyle=base;c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,a.radius,0,Math.PI*2);c.stroke();
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;rect(c,a.x+Math.cos(angle)*a.radius-2,a.y+Math.sin(angle)*a.radius-2,4,4,light);}
      const progress=Math.max(0,Math.min(1,a.age/(a.warning||1.8))),x=a.fromX+(a.x-a.fromX)*progress,y=a.fromY+(a.y-a.fromY)*progress-Math.sin(progress*Math.PI)*65;
      if(['lava','infernal'].includes(a.theme)){oval(c,x,y,7,7,base,1);oval(c,x-1,y-1,3,3,light,1);}
      else if(a.theme==='cosmic')sparkle(c,x,y,5,light);
      else if(a.theme==='crystal'){rect(c,x-2,y-6,5,12,base);rect(c,x,y-4,1,7,light);}
      else if(a.theme==='poison')oval(c,x,y,5,7,base,1);
      else{for(let i=0;i<4;i++)rect(c,a.x-10+i*7,a.y-15-i*3,2,8,base);}
    }else{
      if(a.theme==='storm'){
        c.strokeStyle=light;c.lineWidth=3;c.beginPath();c.moveTo(a.x+8,a.y-90);for(let i=0;i<7;i++)c.lineTo(a.x+(i%2?-9:8),a.y-78+i*13);c.stroke();
      }else if(a.theme==='forest'){
        for(let i=0;i<8;i++){const angle=i*Math.PI/4;c.strokeStyle=base;c.lineWidth=3;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+Math.cos(angle)*a.radius,a.y+Math.sin(angle)*a.radius);c.lineTo(a.x+Math.cos(angle)*a.radius+5,a.y+Math.sin(angle)*a.radius-11);c.stroke();}
      }else if(a.theme==='poison'){
        oval(c,a.x,a.y,a.radius,12,base+'88',1);for(let i=0;i<6;i++)oval(c,a.x-22+i*9,a.y-5-(i%3)*7,3,4,light,1);
      }else if(a.theme==='crystal'){
        for(let i=0;i<10;i++){const angle=i*Math.PI/5,x=a.x+Math.cos(angle)*a.radius*.7,y=a.y+Math.sin(angle)*a.radius*.5;rect(c,x,y-12,4,18,base);rect(c,x+1,y-10,1,12,light);}
      }else if(a.theme==='cosmic'){
        for(let i=0;i<8;i++){const angle=i*Math.PI/4+a.age,x=a.x+Math.cos(angle)*a.radius*.8,y=a.y+Math.sin(angle)*a.radius*.5;sparkle(c,x,y,4,light);}
      }else{
        for(let i=0;i<9;i++){const x=a.x-30+i*7,y=a.y+(i%3)*4;oval(c,x,y-8,4,10+(i%3)*3,base,1);rect(c,x-1,y-9,2,7,light);}
      }
    }
    c.restore();
  }
  function garden(c,s,time=0,input={},effects=[],cat=null){
    const effectTime=time;
    time=motion?.matches?0:time;const night=s.phase==='night';c.imageSmoothingEnabled=false;
    loadScenery(s.level);
    const entry=sceneryCache.get(scenerySource(s.level)),scenery=entry?.loaded?entry.image:null;
    if(scenery){
      c.drawImage(scenery,0,0,960,640);
      // Subtle clipped movements in the existing canopy retain the detailed painting.
      const ratio=(scenery.naturalWidth||scenery.width)/960;
      for(const [i,r]of [[0,[0,0,120,135]],[1,[440,0,210,120]],[2,[880,335,80,160]]]){
        const [x,y,w,h]=r,wind=Math.sin(time*.8+i)*1.1;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(scenery,x*ratio,y*ratio,w*ratio,h*ratio,x+wind,y,w,h);c.restore();
      }
      for(let i=0;i<4;i++)rect(c,132+i*20+Math.sin(time*.6+i)*3,67+(i%2)*13,10,1,'#d5edda66');
    }else{drawGround(c,s.level);pond(c,time);trees.forEach(([x,y],i)=>tree(c,x,y,s.level,time,i));bushes(c,time);architecture(c,s.level,time);}
    for(const p of s.plots)flower(c,p,time,night);for(const t of s.structures)structure(c,t,time);
    atmosphere(c,s,time);
    for(const a of s.bossAttacks||[])bossAttack(c,a);
    for(const n of s.snails)snail(c,n,time,night);
    if(cat&&cat.y<=s.player.y)blackCat(c,cat,night);
    character(c,s.character,s.player.x,s.player.y,time,Math.hypot(input.x||0,input.y||0)>.1,s.player,{water:s.lastAction>0});
    if(cat&&cat.y>s.player.y)blackCat(c,cat,night);
    if(s.weapon&&s.weapon!=='hoe'&&!s.attackFlash&&!s.lastAction)root.SnailExtras?.draw(c,s.weapon,s.player.x+s.player.dx*20,s.player.y-9+s.player.dy*6,30);
    rect(c,s.player.x+s.player.dx*30-2,s.player.y+s.player.dy*30-2,4,4,night?'#fff0b4':'#e9d595');
    if(s.attackFlash>0){const direction=Math.atan2(s.player.dy,s.player.dx),progress=1-s.attackFlash/.22,angle=direction-.7+progress*1.4;c.strokeStyle='#f4df9b9e';c.lineWidth=3;c.beginPath();c.arc(s.player.x,s.player.y,58,direction-.6,direction+.6);c.stroke();const hx=s.player.x+Math.cos(angle)*43,hy=s.player.y+Math.sin(angle)*43;c.strokeStyle='#b1905d';c.lineWidth=4;c.beginPath();c.moveTo(s.player.x,s.player.y-14);c.lineTo(hx,hy);c.stroke();if(!s.weapon||s.weapon==='hoe'){rect(c,hx-6,hy-4,13,7,'#b9c5c4');rect(c,hx-6,hy-4,13,2,'#e6eae0');}else root.SnailExtras?.draw(c,s.weapon,hx,hy,38);}
    if(s.lastAction>0){const progress=1-s.lastAction/.35;for(let i=0;i<7;i++){const x=s.player.x+s.player.dx*(27+i*4),y=s.player.y-15+s.player.dy*(27+i*4)+progress*12;rect(c,x,y,2,4,i%2?'#83c5dd':'#c9e8ed');}}
    // Income floats above its source: amount first, followed by a spinning coin.
    for(const effect of effects){
      const age=effectTime-effect.born;if(age<0||age>=1.35)continue;
      const alpha=Math.min(1,(1.35-age)/.45),rise=motion?.matches?0:age*43,cy=effect.y-22-rise;
      c.save();c.globalAlpha=alpha;c.font='bold 13px Georgia';c.textAlign='right';
      c.fillStyle='#23392c';c.fillText('+'+effect.amount,effect.x-8,cy+1);
      c.fillStyle='#fff2b1';c.fillText('+'+effect.amount,effect.x-9,cy);
      const rx=motion?.matches?5:2+Math.abs(Math.cos(age*9))*4;
      oval(c,effect.x+1,cy-5,rx+1,7,'#6e4b22',1);oval(c,effect.x,cy-6,rx,6,'#d4a34f',1);oval(c,effect.x-1,cy-7,Math.max(1,rx-2),4,'#f7d975',1);rect(c,effect.x-1,cy-9,1,5,'#fff4b9');c.restore();
    }
    ambient(c,night,time);c.fillStyle='#f0dcaa';c.font='11px monospace';c.textAlign='left';c.fillText(night?'Die Hecken flüstern …':'Ein kleiner Garten. Ein großes Abenteuer.',117,632);
  }
  root.SnailArt={garden,bossAttack,character,sprite,blackCat,createCat,updateCat,get ready(){return Promise.all([Promise.all([0,1,2].map(loadScenery)).then(results=>results.every(Boolean)),root.SnailSprites?.ready||Promise.resolve(false),root.SnailDefenses?.ready||Promise.resolve(false),root.SnailExtras?.ready||Promise.resolve(false),root.SnailCat?.ready||Promise.resolve(false),root.SnailBosses?.ready||Promise.resolve(false)]).then(results=>results[0]);}};
})(globalThis);
