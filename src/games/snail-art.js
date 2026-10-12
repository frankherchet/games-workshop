(function(root) {
  'use strict';
  const M = root.SnailModel;
  const palettes = { '.':null, h:'#513831', s:'#e5b594', d:'#bb8066', g:'#536950', G:'#78976b', b:'#40646d', B:'#628f94', y:'#ddbb70', Y:'#f8dc93', o:'#c97742', O:'#efb069', k:'#273237', w:'#f1e5c5', p:'#c782a1' };
  const person = [
    '.....hhhhhh.....','....hyyyyyyh....','...hyyyyyyyyh...','..yyyyyyyyyyyy..','.....ssssss.....','.....skssks.....','.....ssssss.....','......sdds......','....GGbbbbGG....','...sGGbBBbGGs...','...sGGbbbbGGs...','...sGGbbbbGGs...','....GGbbbbGG....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'
  ];
  const woman = [
    '.....hhhhhh.....','....hyyyyyyh....','...hyyyyyyyyh...','..yyyyyyyyyyyy..','....hssssssh....','....hskssksh....','....hssssssh....','....hhpddphh....','....ppbbbbpp....','...sppbBBbpps...','...sppbbbbpps...','...sppbbbbpps...','....ppbbbbpp....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'
  ];
  const fox = [
    '....o......o....','....oO....Oo....','....oOyyyyOo....','...yyyyyyyyyy...','.....OOOOOO.....','....OOkOOkOO....','.....OwwwO......','......wkw.......','....GGbbbbGG....','...OGGbBBbGGO...','...OGGbbbbGGO...','...OGGbbbbGGO...','....GGbbbbGG....','.....bbbbbb.....','.....bb..bb.....','.....bb..bb.....','.....kk..kk.....'
  ];
  function sprite(c, pattern, x, y, scale = 2, palette = palettes) {
    pattern.forEach((row, py) => [...row].forEach((char, px) => { const color=palette[char]; if(color){c.fillStyle=color;c.fillRect(Math.round(x+px*scale),Math.round(y+py*scale),scale,scale);} }));
  }
  function character(c, type, x, y, time=0, moving=false) {
    c.fillStyle='#1c322d35';c.fillRect(x-20,y-4,40,10);
    if(type==='fox'){c.fillStyle='#c97a43';c.fillRect(x+12,y-25,18,8);c.fillRect(x+25,y-33,8,12);c.fillStyle='#f1e5c5';c.fillRect(x+25,y-33,8,6);}
    sprite(c,type==='fox'?fox:type==='gardeneress'?woman:person,x-24,y-51+(moving?Math.round(Math.sin(time*15)*2):0),3);
  }
  function flower(c,p,time,night=false) {
    const x=p.x,y=p.y;
    c.fillStyle=p.unlocked?'#674a35':'#4c633f';c.fillRect(x-28,y-28,56,56);c.fillStyle=p.unlocked?'#96714f':'#678457';c.fillRect(x-28,y-28,56,4);
    if(p.unlocked){for(let row=0;row<4;row++){c.fillStyle=row%2?'#bb966325':'#392e2925';c.fillRect(x-24,y-18+row*11,48,3);}c.fillStyle='#caa37655';c.fillRect(x-20,y+14,3,3);c.fillRect(x+19,y-15,4,2);}
    if(!p.unlocked){c.fillStyle='#d1c39688';c.font='18px monospace';c.textAlign='center';c.fillText('+',x,y+7);return;}
    if(!p.type){c.fillStyle='#c6a77d';c.fillRect(x-9,y-4,18,3);c.fillRect(x-1,y-10,3,15);return;}
    const plant=M.PLANTS[p.type];
    c.fillStyle=p.dry?'#807445':'#426b38';c.fillRect(x-2,y-13,4,30);c.fillRect(x-12,y+4,10,5);c.fillRect(x+2,y-4,10,5);
    const bend=Math.round(Math.sin(time*1.3+x)*1.5),fx=x+bend,fy=y-20;
    c.fillStyle=p.dry?'#b79474':plant.color;
    if(p.type==='tulip'){c.fillRect(fx-10,fy-8,20,16);c.fillRect(fx-10,fy-13,5,8);c.fillRect(fx-2,fy-15,5,8);c.fillRect(fx+5,fy-13,5,8);}
    else {c.fillRect(fx-14,fy-4,28,8);c.fillRect(fx-4,fy-14,8,28);c.fillRect(fx-10,fy-10,20,20);c.fillStyle='#ffda68';c.fillRect(fx-4,fy-4,8,8);}
    if(p.type==='moon'||p.type==='crystal'){c.fillStyle=night?'#d1ecff88':'#ffffff88';c.fillRect(fx-22,fy-18,3,3);c.fillRect(fx+18,fy+8,3,3);}
    if(p.watered){c.fillStyle='#79cbd6';c.fillRect(x+18,y+14,5,8);c.fillRect(x+19,y+12,3,2);}
    c.fillStyle='#2f382d';c.fillRect(x-15,y+22,30,3);c.fillStyle=p.hp<=1?'#e29075':'#a4cf77';c.fillRect(x-15,y+22,30*p.hp/plant.hp,3);
  }
  function snail(c,n,time,night) {
    const giant=n.type==='giant',r=giant?18:12,x=Math.round(n.x),y=Math.round(n.y);
    c.fillStyle='#172d3340';c.fillRect(x-r-4,y+8,r*2+20,7);
    c.fillStyle=n.type==='fast'?'#b2a88c':'#8da185';c.fillRect(x-r-5,y+4,r*2+19,7);c.fillRect(x+r+5,y-1,10,9);
    c.fillStyle=n.type==='armored'?'#738590':giant?'#956d91':'#b28758';c.fillRect(x-r,y-r,r*2,r*2);c.fillRect(x-r+4,y-r-4,r*2-8,4);
    c.fillStyle=n.type==='armored'?'#a5b7c0':'#d2ac78';c.fillRect(x-r+4,y-r+4,r*2-8,3);c.fillRect(x-r+4,y-r+4,3,r*2-8);c.fillRect(x+1,y-3,5,6);c.fillRect(x-4,y+3,9,3);
    c.fillStyle='#8da185';c.fillRect(x+r+6,y-11,3,13);c.fillRect(x+r+12,y-8,3,9);
    c.fillStyle=night?'#f6df81':'#303630';c.fillRect(x+r+5,y-13,5,4);c.fillRect(x+r+11,y-10,5,4);
    if(n.maxHp>1){c.fillStyle='#392e3e';c.fillRect(x-15,y-r-11,30,3);c.fillStyle='#db8a97';c.fillRect(x-15,y-r-11,30*n.hp/n.maxHp,3);}
    if(n.type==='fast'){c.fillStyle='#adb7b844';c.fillRect(x-r-10,y+12,10,2);}
  }
  function structure(c,t,time) {
    const x=t.x,y=t.y;
    if(t.type==='duck'){c.fillStyle=t.fed?'#f1e5c5':'#beb49b';c.fillRect(x-8,y-5,20,14);c.fillRect(x+5,y-17,10,19);c.fillStyle='#f3b45e';c.fillRect(x+15,y-12,8,4);c.fillRect(x-4,y+9,4,4);c.fillRect(x+7,y+9,4,4);c.fillStyle='#24362a';c.fillRect(x+11,y-16,2,2);return;}
    if(t.type==='pit'){c.fillStyle='#47382e';c.fillRect(x-19,y-17,38,32);c.fillStyle='#26312a';c.fillRect(x-14,y-12,28,22);c.fillStyle='#a89564';c.fillRect(x-18,y-17,36,4);}
    if(t.type==='beer'){c.fillStyle='#896845';c.fillRect(x-12,y-14,24,29);c.fillStyle='#edc574';c.fillRect(x-9,y-10,18,5);c.fillStyle='#402d25';c.fillRect(x-10,y-3,20,3);}
    if(t.type==='fence'||t.type==='electric'){c.fillStyle=t.type==='fence'?'#b59567':'#a0adb5';c.fillRect(x-22,y-16,5,38);c.fillRect(x+17,y-16,5,38);c.fillRect(x-22,y-8,44,5);c.fillRect(x-22,y+8,44,5);if(t.type==='electric'){c.fillStyle='#a9e5ed';c.fillRect(x-6,y-18,5,13);c.fillRect(x-1,y-9,7,4);c.fillRect(x+2,y-5,4,10);}else{c.fillStyle='#31503c';c.fillRect(x-20,y+25,40,3);c.fillStyle='#caaa6e';c.fillRect(x-20,y+25,40*t.hp/M.ITEMS.fence.hp,3);}}
    if(t.type==='copper'){c.fillStyle='#c88959';c.fillRect(x-26,y-9,52,19);c.fillStyle='#f0be7e';c.fillRect(x-26,y-9,52,3);}
    if(t.charges){c.fillStyle='#f4e3b9';c.font='10px monospace';c.textAlign='center';c.fillText(t.charges,x,y+31);}
  }
  function tree(c,x,y,level) {
    c.fillStyle='#20392928';c.fillRect(x-27,y+20,80,15);c.fillStyle=level===2?'#807d78':'#755740';c.fillRect(x-8,y-10,16,44);
    const greens=level===1?['#315440','#416849','#557c53']:['#456b3f','#5c8545','#789c50'];
    greens.forEach((color,i)=>{c.fillStyle=color;c.fillRect(x-38+i*5,y-72+i*16,76-i*7,40);});c.fillStyle='#93ae6280';c.fillRect(x-25,y-61,13,5);
    c.fillStyle='#284a3938';c.fillRect(x-33,y-25,61,7);c.fillRect(x-39,y-60,5,23);c.fillStyle='#a4be6970';
    for(let i=0;i<16;i++){const px=x-30+(i*13)%60,py=y-65+(i*17)%54;c.fillRect(px,py,6+i%4,4);}
    c.fillStyle='#466843';c.fillRect(x-44,y-52,7,23);c.fillRect(x+34,y-48,8,19);c.fillRect(x-26,y-77,46,7);
    c.fillStyle=level===0?'#d8a06d':'#b09cbc';for(const [dx,dy]of [[-18,-38],[20,-54],[7,-18]])c.fillRect(x+dx,y+dy,5,6);
    c.fillStyle='#af9161';c.fillRect(x-3,y+7,3,18);
  }
  function garden(c,s,time=0,input={}) {
    const level=M.LEVELS[s.level],night=s.phase==='night';c.imageSmoothingEnabled=false;
    c.fillStyle=level.ground;c.fillRect(0,0,960,640);
    for(let y=0;y<640;y+=24)for(let x=0;x<960;x+=24){const hash=(x*17+y*31)%127;c.fillStyle=hash<60?'#b8ca6832':'#36583425';c.fillRect(x+(hash%13),y+(hash%9),2,5);if(hash%11===0){c.fillStyle='#d9d689';c.fillRect(x+8,y+12,3,3);}}
    // Small borders, stones and flowers make the garden feel tended rather than tiled.
    for(let i=0;i<38;i++){const x=125+(i*71)%730,y=i%2?485+(i%4)*9:200+(i%3)*6;c.fillStyle='#375e3838';c.fillRect(x-2,y,15,5);c.fillStyle='#9daf63';c.fillRect(x,y-7,3,10);c.fillRect(x+5,y-10,3,12);if(i%3===0){c.fillStyle=i%2?'#dba1bc':'#e5cd8e';c.fillRect(x-1,y-10,6,4);}}
    for(let i=0;i<8;i++){const x=115+i*102;c.fillStyle='#b8b69a';c.fillRect(x,568,11,6);c.fillStyle='#819277';c.fillRect(x,574,11,3);}
    c.fillStyle=s.level===2?'#a5aaa0':'#c0b48b';c.fillRect(75,145,810,40);c.fillRect(715,145,45,445);c.fillRect(160,535,600,35);
    for(let x=78;x<880;x+=32){c.fillStyle='#ffffff17';c.fillRect(x,150,24,6);c.fillStyle='#746e5633';c.fillRect(x,175,17,3);}
    c.fillStyle='#588c91';c.fillRect(103,55,134,66);c.fillRect(87,72,155,35);c.fillStyle='#8cc1b9';c.fillRect(108,67,70,3);c.fillRect(170,93,50,3);
    for(const [x,y]of [[60,96],[305,80],[615,90],[920,110],[65,380],[920,380],[65,605],[890,612]])tree(c,x,y,s.level);
    for(const [x,y]of [[115,260],[840,325],[120,460],[835,500]]){c.fillStyle='#4c723f';c.fillRect(x-16,y-10,34,18);c.fillRect(x-11,y-15,23,6);c.fillStyle='#8ba65f';c.fillRect(x-10,y-8,7,4);c.fillRect(x+5,y-5,8,4);c.fillStyle='#e1b9cf';c.fillRect(x-7,y,4,4);c.fillRect(x+11,y-3,4,4);}
    // A straw scarecrow, seed sacks and lantern posts.
    c.fillStyle='#9a7654';c.fillRect(630,145,5,53);c.fillRect(605,157,52,5);c.fillStyle='#8c8f68';c.fillRect(622,148,21,30);c.fillStyle='#e2c181';c.fillRect(623,127,19,19);c.fillRect(615,124,35,6);c.fillRect(623,118,18,8);c.fillStyle='#554837';c.fillRect(627,135,3,3);c.fillRect(636,135,3,3);
    for(let i=0;i<3;i++){c.fillStyle='#d1b083';c.fillRect(800+i*24,190,18,18);c.fillStyle='#88703e';c.fillRect(803+i*24,198,12,3);}
    for(const [x,y]of [[90,162],[760,190],[760,556]]){c.fillStyle='#604d38';c.fillRect(x-3,y-22,6,42);c.fillStyle='#d7b876';c.fillRect(x-9,y-32,18,20);c.fillStyle='#f4dea0';c.fillRect(x-5,y-28,10,11);c.fillStyle='#664d36';c.fillRect(x-11,y-36,22,5);}
    if(s.level===1){for(let i=0;i<9;i++){const x=110+i*90,y=95+(i%3)*30;c.fillStyle='#b892b8';c.fillRect(x,y,14,6);c.fillStyle='#e6d3c4';c.fillRect(x+5,y+6,4,10);}}
    if(s.level===2){c.fillStyle='#626c65';c.fillRect(365,50,170,35);c.fillStyle='#8c9687';for(let x=365;x<535;x+=24)c.fillRect(x,37,15,20);c.fillStyle='#bec7a6';c.fillRect(442,75,18,45);}
    c.fillStyle='#576d4030';c.fillRect(259,205,384,267);
    for(const p of s.plots)flower(c,p,time,night);
    // Wooden market stall with paper signs and striped canvas roof.
    c.fillStyle='#5d4434';c.fillRect(783,105,10,75);c.fillRect(892,105,10,75);c.fillStyle='#ac8056';c.fillRect(772,148,139,39);c.fillStyle='#d5aa72';c.fillRect(766,145,150,9);c.fillStyle='#eee0b9';c.fillRect(763,92,157,35);for(let x=763;x<920;x+=30){c.fillStyle='#b87869';c.fillRect(x,92,15,35);}c.fillStyle='#6d4938';c.fillRect(797,50,91,30);c.fillStyle='#f8e8bc';c.font='bold 15px monospace';c.textAlign='center';c.fillText('STAND',842,71);c.fillStyle='#ead29b';c.fillRect(823,155,42,22);c.fillStyle='#7a5940';c.font='12px monospace';c.fillText('SHOP',844,171);
    for(const t of s.structures)structure(c,t,time);
    if(night){c.fillStyle='#091b469c';c.fillRect(0,0,960,640);for(const [x,y]of [[90,162],[760,190],[760,556]]){const glow=c.createRadialGradient(x,y,5,x,y,100);glow.addColorStop(0,'#fbd38d36');glow.addColorStop(1,'#fbd38d00');c.fillStyle=glow;c.fillRect(x-100,y-100,200,200);}}
    for(const p of s.plots)if(p.type&&(p.type==='moon'||p.type==='crystal')&&night){c.fillStyle='#bcd7f444';c.fillRect(p.x-16,p.y-30,32,25);}
    for(const n of s.snails)snail(c,n,time,night);
    character(c,s.character,s.player.x,s.player.y,time,Math.hypot(input.x||0,input.y||0)>.1);
    c.fillStyle=night?'#fff0aa':'#f0d68a';c.fillRect(s.player.x+s.player.dx*28-2,s.player.y+s.player.dy*28-2,4,4);
    if(s.attackFlash>0){c.strokeStyle='#f6dc98';c.lineWidth=5;c.beginPath();const angle=Math.atan2(s.player.dy,s.player.dx);c.arc(s.player.x,s.player.y,58,angle-.65,angle+.65);c.stroke();c.fillStyle='#b39e7c';c.fillRect(s.player.x+s.player.dx*40-5,s.player.y+s.player.dy*40-5,10,10);}
    if(s.lastAction>0){c.fillStyle='#92d8ec';for(let i=0;i<6;i++)c.fillRect(s.player.x-18+i*7,s.player.y-45+(i%3)*8,3,6);}
    for(let i=0;i<12;i++){const x=(i*83+Math.sin(time*.2+i)*15+960)%960,y=90+(i*53)%475;if(night){c.fillStyle='#d2dfa765';c.fillRect(x,y,2,2);}else{c.fillStyle=i%2?'#ffe5b7':'#e7ade6';c.fillRect(x,y,4,3);c.fillRect(x+5,y+Math.sin(time*5+i)*2,4,3);}}
    if(night){for(let i=0;i<4;i++){const y=190+i*95,x=(time*7+i*230)%1250-220;c.fillStyle='#afbccc0c';c.fillRect(x,y,350,35);c.fillRect(x+50,y-10,220,55);}}
    c.fillStyle='#76583e';for(let x=120;x<900;x+=43){c.fillRect(x,599,5,22);c.fillRect(x,605,38,4);}c.fillStyle='#e6ce9f';c.font='12px monospace';c.textAlign='left';c.fillText(night?'Die Hecken flüstern …':'Ein kleiner Garten. Ein großes Abenteuer.',116,630);
  }
  root.SnailArt={garden,character,sprite};
})(globalThis);
