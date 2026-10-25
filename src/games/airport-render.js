(function(root){
  'use strict';
  const C=root.AirportConfig,M=root.AirportModel;
  class AirportRenderer{
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');
      this.background=document.createElement('canvas');
      this.background.width=C.WIDTH;this.background.height=C.HEIGHT;
      this.backgroundKey='';
    }
    scenery(instance){
      const canvas=this.background,c=canvas.getContext('2d'),w=C.WIDTH,h=C.HEIGHT;
      const theme=instance.config.world.theme;
      const colors={province:'#a8c990',island:'#86cbd1',city:'#b2c1c4',desert:'#edcc92'};
      c.fillStyle=colors[theme];c.fillRect(0,0,w,h);
      const rng=M.randomFrom(instance.seed^0x3c6ef372);
      if(theme==='province'){
        for(let i=0;i<47;i++){
          const x=rng()*w,y=rng()*h,r=45+rng()*130;
          c.fillStyle=['#b6d5a1','#94bd84','#c5d9aa','#a1c78d'][i%4];
          c.fillRect(x-r/2,y-r/2,r,r*.7);
          c.strokeStyle='#dce4b8';c.lineWidth=2;c.strokeRect(x-r/2,y-r/2,r,r*.7);
        }
        c.fillStyle='#d7cbaa';c.fillRect(0,315,w,24);c.fillRect(426,0,23,h);
        for(let i=0;i<110;i++){const x=rng()*w,y=rng()*h;c.fillStyle=i%3?'#7baf73':'#649667';c.beginPath();c.arc(x,y,3+rng()*7,0,Math.PI*2);c.fill();}
      }else if(theme==='island'){
        c.fillStyle='#e9d6a5';c.beginPath();c.moveTo(124,83);
        c.bezierCurveTo(285,2,460,78,600,42);c.bezierCurveTo(790,28,917,149,902,322);
        c.bezierCurveTo(942,474,793,605,623,578);c.bezierCurveTo(412,635,208,588,131,479);
        c.bezierCurveTo(41,350,43,148,124,83);c.closePath();c.fill();
        c.fillStyle='#abd09b';c.beginPath();c.moveTo(142,104);
        c.bezierCurveTo(300,34,475,99,603,69);c.bezierCurveTo(777,61,892,165,876,321);
        c.bezierCurveTo(898,458,783,579,625,550);c.bezierCurveTo(410,612,217,559,157,459);
        c.bezierCurveTo(79,353,70,161,142,104);c.closePath();c.fill();
        for(let i=0;i<110;i++){
          const x=90+rng()*780,y=95+rng()*445;
          c.fillStyle=i%2?'#7fb88f':'#99c597';c.beginPath();c.arc(x,y,2+rng()*7,0,Math.PI*2);c.fill();
        }
        c.strokeStyle='#d9f1e7';c.lineWidth=3;
        for(let i=0;i<5;i++){c.beginPath();c.ellipse(500,320,400+i*17,260+i*10,-.1,0,Math.PI*2);c.stroke();}
      }else if(theme==='city'){
        c.fillStyle='#d3d3c9';
        for(let x=14;x<w;x+=113)c.fillRect(x,0,22,h);
        for(let y=26;y<h;y+=100)c.fillRect(0,y,w,24);
        for(let i=0;i<85;i++){
          const x=rng()*w,y=rng()*h,size=14+rng()*26;
          c.fillStyle=['#889eaa','#98a9ae','#d4c9b7','#899f9d'][i%4];
          c.fillRect(x,y,size,size*(.5+rng()));
          c.fillStyle='#e1e5dc';c.fillRect(x+3,y+3,Math.max(3,size-7),4);
        }
      }else{
        for(let i=0;i<23;i++){
          c.strokeStyle=['#e4b679','#efdda9','#d6ad79'][i%3];c.lineWidth=3+rng()*18;c.beginPath();
          const y=rng()*h;c.moveTo(-40,y);c.bezierCurveTo(200,y-110,580,y+130,1000,y-30);c.stroke();
        }
        c.fillStyle='#c9a174';c.fillRect(0,318,w,23);c.fillRect(448,0,22,h);
        for(let i=0;i<82;i++){
          const x=rng()*w,y=rng()*h;
          c.fillStyle=i%3?'#c8a884':'#bd9577';c.fillRect(x,y,6+rng()*14,5+rng()*8);
        }
      }
      // A stable, readable visual margin prevents terrain graphics from hiding the edges.
      c.strokeStyle='#ffffff88';c.lineWidth=4;c.strokeRect(2,2,w-4,h-4);
      this.backgroundKey=instance.config.index+':'+instance.seed;
    }
    airfield(c,field,theme){
      c.save();c.translate(field.x,field.y);
      c.fillStyle=theme==='desert'?'#d7b78a':'#c1c6b3';
      c.strokeStyle='#ffffff77';c.lineWidth=3;
      c.beginPath();c.roundRect(-84,-65,170,134,20);c.fill();c.stroke();
      c.fillStyle='#8b938c';c.fillRect(-62,-53,25,18);
      c.fillStyle='#e1dccb';c.fillRect(-59,-59,23,16);
      c.fillStyle='#8aada5';c.fillRect(-32,-50,26,19);
      c.restore();
      for(const zone of field.zones){
        c.save();c.translate(zone.x,zone.y);
        if(zone.type==='helipad'){
          c.fillStyle='#565f64';c.beginPath();c.arc(0,0,24,0,Math.PI*2);c.fill();
          c.strokeStyle='#f9f5e8';c.lineWidth=3;c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.stroke();
          c.textAlign='center';c.textBaseline='middle';c.font='bold 23px system-ui';c.fillStyle='#fff';c.fillText('H',0,1);
        }else{
          c.rotate(zone.angle);
          c.fillStyle=zone.type==='military'?'#5c6c64':'#5d6667';
          c.beginPath();c.roundRect(-48,-12,96,24,3);c.fill();
          c.lineWidth=2;c.strokeStyle=zone.type==='military'?'#aee1a6':'#fff9df';c.strokeRect(-46,-10,92,20);
          c.strokeStyle='#e9f3e8';c.setLineDash([9,8]);c.beginPath();c.moveTo(-37,0);c.lineTo(37,0);c.stroke();
          c.setLineDash([]);c.font='bold 23px system-ui';c.textAlign='center';c.fillStyle=zone.type==='military'?'#c7f2b1':'#fdf4d4';
          c.fillText(zone.type==='military'?'M':'C',0,-18);
        }
        c.restore();
      }
    }
    plane(c,plane,time,selected){
      const helicopter=plane.type==='helicopter';
      c.save();c.translate(plane.x,plane.y);c.rotate(plane.heading);
      const scale=plane.size;c.scale(scale,scale);
      c.translate(2.5,3);c.fillStyle='#1c37444d';
      c.beginPath();c.ellipse(0,1,17,9,0,0,Math.PI*2);c.fill();c.translate(-2.5,-3);
      if(selected){c.strokeStyle='#fff9bb';c.lineWidth=2;c.beginPath();c.arc(0,0,27/scale,0,Math.PI*2);c.stroke();}
      c.fillStyle=plane.color;c.strokeStyle='#334d59';c.lineWidth=1.2;
      c.beginPath();
      if(helicopter){
        c.ellipse(0,0,14,7,0,0,TAU);c.fill();c.stroke();
        c.fillRect(-22,-1,13,2);c.fillRect(-21,-5,2,11);
        const spin=Math.sin(time*25)*2;
        c.save();c.rotate(spin);c.fillStyle='#3a4d51bb';c.fillRect(-1.5,-20,3,40);c.restore();
        c.fillStyle='#a8e4eb';c.beginPath();c.ellipse(7,0,5,4,0,0,TAU);c.fill();
      }else{
        c.moveTo(20,0);c.lineTo(6,-3.3);c.lineTo(-5,-17);
        c.lineTo(-12,-17);c.lineTo(-10,-3.5);c.lineTo(-19,-8);
        c.lineTo(-22,-8);c.lineTo(-19,0);c.lineTo(-22,8);
        c.lineTo(-19,8);c.lineTo(-10,3.5);c.lineTo(-12,17);
        c.lineTo(-5,17);c.lineTo(6,3.3);c.closePath();c.fill();c.stroke();
        c.fillStyle='#8baebe';c.fillRect(5,-2.8,7,5.6);
        if(plane.type==='jet'){c.fillStyle='#516c5b';c.fillRect(-8,-13,7,26);}
      }
      c.restore();
    }
    draw(session,selectedId=null,drawing=[]){
      const c=this.ctx,instance=session.instance;
      const key=instance.config.index+':'+instance.seed;
      if(this.backgroundKey!==key)this.scenery(instance);
      c.clearRect(0,0,C.WIDTH,C.HEIGHT);c.drawImage(this.background,0,0);
      for(const field of instance.airfields)this.airfield(c,field,instance.config.world.theme);
      // Flight paths stay on the background, below the aircraft.
      for(const plane of session.aircraft){
        const points=plane.id===selectedId&&drawing.length?drawing:plane.path.points;
        if(!points.length)continue;
        c.save();c.strokeStyle=plane.id===selectedId?'#fff9af':'#ffffffc9';c.lineWidth=plane.id===selectedId?4:2.7;
        c.lineCap='round';c.lineJoin='round';c.setLineDash(plane.id===selectedId?[]:[5,8]);
        c.beginPath();c.moveTo(plane.x,plane.y);for(const p of points)c.lineTo(p.x,p.y);c.stroke();
        c.setLineDash([]);c.restore();
      }
      for(const plane of session.aircraft)this.plane(c,plane,session.elapsed,plane.id===selectedId);
      if(session.lastLanded&&session.elapsed-session.lastLanded.at<.65){
        const q=session.lastLanded,p=(session.elapsed-q.at)/.65;
        c.strokeStyle='rgba(255,255,255,'+(1-p)+')';c.lineWidth=4;c.beginPath();
        c.arc(q.x,q.y,10+p*40,0,TAU);c.stroke();
      }
      if(this.canvas.clientWidth>=600){
        c.save();c.fillStyle='#24444b94';c.beginPath();c.roundRect(16,C.HEIGHT-40,322,26,8);c.fill();
        c.font='600 13px system-ui';c.fillStyle='#fff';
        c.fillText('Flugzeug antippen und Route zeichnen',27,C.HEIGHT-22);c.restore();
      }
    }
  }
  const TAU=Math.PI*2;
  root.AirportRenderer=AirportRenderer;
})(globalThis);
