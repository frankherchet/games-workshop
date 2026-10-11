(function(root){
  function art(id){
    const frame=(body,bg='#112231')=>`<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pixelgrafik zum Spiel" shape-rendering="crispEdges"><rect width="480" height="300" fill="${bg}"/>${body}</svg>`;
    const star=(x,y,color)=>`<path d="M${x+6} ${y}h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="${color}"/>`;
    if(id==='neon-breakout'){
      let blocks='';const colors=['#74f7d0','#4ab9b6','#638ee0','#9b82d4'];
      for(let r=0;r<4;r++)for(let c=0;c<8;c++)blocks+=`<rect x="${47+c*49}" y="${55+r*28}" width="42" height="19" fill="${colors[r]}"/><rect x="${47+c*49}" y="${55+r*28}" width="42" height="4" fill="#ffffff25"/>`;
      return frame(`<path d="M0 245H480M0 270H480M60 220v80M120 220v80M180 220v80M240 220v80M300 220v80M360 220v80M420 220v80" stroke="#254453"/>${blocks}<rect x="246" y="182" width="8" height="8" fill="#74f7d044"/><rect x="233" y="195" width="8" height="8" fill="#74f7d088"/><rect x="220" y="208" width="12" height="12" fill="#ffffff"/><rect x="178" y="260" width="100" height="12" fill="#74f7d0"/><rect x="178" y="272" width="100" height="4" fill="#328375"/>${star(30,200,'#4b687a')}${star(440,33,'#4b687a')}`);
    }
    if(id==='memory-quest'){
      let cards='';const symbols=['◆','✚','■','●','✚','◆'];
      for(let i=0;i<6;i++){const x=94+(i%3)*100,y=55+Math.floor(i/3)*105;cards+=`<rect x="${x+5}" y="${y+5}" width="82" height="85" fill="#090e1d"/><rect x="${x}" y="${y}" width="82" height="85" fill="${i===1||i===4?'#694e8e':'#283c58'}"/><rect x="${x+5}" y="${y+5}" width="72" height="75" fill="none" stroke="${i===1||i===4?'#e8a6ff':'#52647e'}" stroke-width="2"/><text x="${x+41}" y="${y+57}" text-anchor="middle" fill="${i===1||i===4?'#e8a6ff':'#7da0b4'}" font-family="monospace" font-size="39">${symbols[i]}</text>`;}
      return frame(cards+star(37,54,'#e8a6ff')+star(422,233,'#e8a6ff'),'#211b35');
    }
    let stars='';for(const [x,y]of [[120,130],[190,102],[260,74],[365,95]])stars+=star(x,y,'#ffdf77');
    return frame(`<rect x="34" y="35" width="90" height="12" fill="#ffffff0e"/><rect x="55" y="23" width="48" height="12" fill="#ffffff0e"/><path d="M0 210h55v-30h70v30h50v-65h55v35h75v-60h60v45h60v-25h55v160H0z" fill="#273951"/><rect y="246" width="170" height="54" fill="#374b39"/><rect y="246" width="170" height="9" fill="#88b879"/><rect x="235" y="206" width="100" height="94" fill="#374b39"/><rect x="235" y="206" width="100" height="9" fill="#88b879"/><rect x="380" y="167" width="100" height="133" fill="#374b39"/><rect x="380" y="167" width="100" height="9" fill="#88b879"/><rect x="78" y="202" width="23" height="27" fill="#74f7d0"/><rect x="72" y="212" width="35" height="20" fill="#74f7d0"/><rect x="91" y="208" width="5" height="5" fill="#102432"/><rect x="75" y="232" width="11" height="14" fill="#3d9292"/><rect x="94" y="232" width="11" height="14" fill="#3d9292"/><rect x="414" y="111" width="38" height="56" fill="#8265b9"/><rect x="422" y="119" width="22" height="48" fill="#cab4f5"/>${stars}`,'#17263a');
  }
  root.Arcade.art=art;
})(globalThis);
