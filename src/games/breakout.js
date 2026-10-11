(function(root){
  const {clamp}=root.ArcadeCore;
  root.Arcade.games['neon-breakout']=function(api){
    const {canvas,finish,score,status}=api,c=canvas.getContext('2d');let paddle,ball,bricks,points,lives,wait,session;
    const resetBall=()=>{ball={x:paddle+65,y:440,vx:220,vy:-280};wait=.8;};
    function reset(){paddle=415;points=0;lives=3;bricks=[];for(let r=0;r<4;r++)for(let col=0;col<10;col++)bricks.push({x:52+col*86,y:65+r*35,w:76,h:25,active:true,row:r});resetBall();score(0);status('3 LEBEN · 40 BLÖCKE');}
    function update(dt,keys){
      if(keys.has('ArrowLeft')||keys.has('a'))paddle-=520*dt;if(keys.has('ArrowRight')||keys.has('d'))paddle+=520*dt;paddle=clamp(paddle,12,818);
      if(wait>0){wait-=dt;ball.x=paddle+65;return;}
      const oldY=ball.y;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x<8){ball.x=8;ball.vx=Math.abs(ball.vx);}if(ball.x>952){ball.x=952;ball.vx=-Math.abs(ball.vx);}if(ball.y<8){ball.y=8;ball.vy=Math.abs(ball.vy);}
      if(ball.vy>0&&oldY+8<=466&&ball.y+8>=466&&ball.x>=paddle-8&&ball.x<=paddle+138){ball.y=458;const angle=(ball.x-paddle-65)/65;ball.vx=angle*360;ball.vy=-Math.sqrt(Math.max(40000,420*420-ball.vx*ball.vx));}
      for(const b of bricks){if(!b.active||ball.x+8<b.x||ball.x-8>b.x+b.w||ball.y+8<b.y||ball.y-8>b.y+b.h)continue;b.active=false;points+=10;score(points);if(oldY+8<=b.y||oldY-8>=b.y+b.h)ball.vy*=-1;else ball.vx*=-1;break;}
      if(bricks.every(b=>!b.active)){session.pause();finish(points,'Alle Blöcke abgeräumt!','Perfekte Runde. Dein Neon-Bestwert ist gespeichert.');}
      if(ball.y>555){lives--;if(!lives){session.pause();finish(points,'Runde beendet',`${points} Punkte. Bereit für einen neuen Versuch?`);}else{resetBall();status(`${lives} LEBEN · NEUER BALL`);}}
    }
    function draw(){c.fillStyle='#0c1c2b';c.fillRect(0,0,960,540);c.strokeStyle='#163143';for(let x=0;x<960;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}for(let y=0;y<540;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}const colors=['#74f7d0','#50bfc6','#698fea','#aa87df'];for(const b of bricks){if(!b.active)continue;c.fillStyle=colors[b.row];c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#ffffff35';c.fillRect(b.x,b.y,b.w,4);}c.fillStyle='#74f7d0';c.fillRect(paddle,466,130,14);c.fillStyle='#398474';c.fillRect(paddle,480,130,5);c.fillStyle='#fff';c.fillRect(ball.x-8,ball.y-8,16,16);}
    reset();session=root.Arcade.session({canvas,update,draw,onPause:api.pause});
    session.listen(canvas,'pointermove',e=>{if(e.pointerType==='mouse'||e.buttons){const rect=canvas.getBoundingClientRect();paddle=clamp((e.clientX-rect.left)/rect.width*960-65,12,818);}});
    session.listen(canvas,'pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const rect=canvas.getBoundingClientRect();paddle=clamp((e.clientX-rect.left)/rect.width*960-65,12,818);canvas.focus({preventScroll:true});});
    draw();return {start:()=>session.start(),pause:()=>session.pause(),dispose:()=>session.dispose(),reset(){session.pause();reset();draw();}};
  };
})(globalThis);
