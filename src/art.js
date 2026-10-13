(function(root){
  function art(id){
    const frame=(body,bg='#112231')=>`<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pixelgrafik zum Spiel" shape-rendering="crispEdges"><rect width="480" height="300" fill="${bg}"/>${body}</svg>`;
    const star=(x,y,color)=>`<path d="M${x+6} ${y}h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="${color}"/>`;
    if(id==='frogger')return `<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frosch am leuchtenden Neon-Teich"><rect width="480" height="300" fill="#102237"/><path d="M0 90h480v105H0z" fill="#175465"/><path d="M0 106h480M0 158h480" stroke="#74f7d055"/><g fill="#886d68" stroke="#74f7d0" stroke-width="2"><rect x="30" y="115" width="130" height="24" rx="12"/><rect x="250" y="160" width="170" height="24" rx="12"/></g><path d="M0 222h480" stroke="#ef91ad" stroke-width="20"/><g fill="#83f6c4"><ellipse cx="240" cy="260" rx="33" ry="22"/><circle cx="222" cy="239" r="12"/><circle cx="258" cy="239" r="12"/></g><g fill="#142c3c"><circle cx="222" cy="237" r="5"/><circle cx="258" cy="237" r="5"/></g><g fill="#ffe3a1"><circle cx="150" cy="62" r="5"/><circle cx="240" cy="62" r="5"/><circle cx="330" cy="62" r="5"/></g></svg>`;
    if(id==='pferdezauber'){
      return `<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Haflinger mit heller Mähne auf einer sonnigen, märchenhaften Pferdeweide">
        <defs>
          <linearGradient id="pz-sky" x2="0" y2="1"><stop stop-color="#173d54"/><stop offset="1" stop-color="#9acbb9"/></linearGradient>
          <linearGradient id="pz-meadow" x2="0" y2="1"><stop stop-color="#659c74"/><stop offset="1" stop-color="#234d45"/></linearGradient>
          <linearGradient id="pz-coat" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efc38a"/><stop offset=".5" stop-color="#c9905b"/><stop offset="1" stop-color="#936342"/></linearGradient>
          <linearGradient id="pz-mane" x2="1" y2="1"><stop stop-color="#fff1c5"/><stop offset="1" stop-color="#c3a36d"/></linearGradient>
          <radialGradient id="pz-sun"><stop stop-color="#ffedb1" stop-opacity=".6"/><stop offset="1" stop-color="#ffedb1" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="480" height="300" fill="url(#pz-sky)"/>
        <circle cx="381" cy="66" r="105" fill="url(#pz-sun)"/>
        <circle cx="381" cy="66" r="24" fill="#ffebba"/>
        <path d="M0 151 61 103 115 149 182 88 256 151 324 115 395 152 448 109 480 131V230H0Z" fill="#639088"/>
        <path d="m150 124 32-36 37 32-27-11-12 7-11-3Z" fill="#bad3bc" opacity=".55"/>
        <path d="M0 164Q76 130 163 158T328 155T480 156V300H0Z" fill="#84ad7b"/>
        <path d="M0 197Q115 151 239 182T480 174V300H0Z" fill="url(#pz-meadow)"/>
        <path d="M67 300Q156 217 265 206Q177 241 157 300Z" fill="#afba83" opacity=".28"/>
        <g fill="#356951">
          <path d="M22 166V116H29V166Z"/><path d="M25 82 4 137H45Z"/><path d="M25 99 0 153H51Z"/>
          <path d="M431 171V102H438V171Z"/><path d="M434 66 410 126H458Z"/><path d="M434 91 403 151H466Z"/>
        </g>
        <g stroke-linejoin="round">
          <path d="M63 152H125V197H63Z" fill="#ba9270"/>
          <path d="m54 154 40-32 41 32Z" fill="#5d5260"/>
          <path d="m57 150 37-29 39 29" fill="none" stroke="#d1ae85" stroke-width="3"/>
          <path d="M84 197V166Q95 153 106 166V197Z" fill="#4c5b4a"/>
          <path d="M67 162H76V174H67Z" fill="#f5d8a0"/>
        </g>
        <g fill="none" stroke="#adc19a" stroke-width="4" stroke-linecap="round">
          <path d="M15 195 170 182M15 210 170 197"/>
          <path d="M26 187V224M78 181V215M132 175V206"/>
        </g>
        <ellipse cx="280" cy="269" rx="106" ry="12" fill="#122f2d" opacity=".32"/>
        <g stroke-linejoin="round">
          <path d="M198 174Q183 170 181 191Q183 226 162 241Q184 244 192 221L204 189Z" fill="url(#pz-mane)"/>
          <path d="M230 191 257 197 253 220 242 244 248 266H233L224 241 235 215Z" fill="#8c623f"/>
          <path d="M323 182 343 183 345 218 354 257 350 267H336L335 256 326 219Z" fill="#8c623f"/>
          <path d="M236 261H249L250 269H233Z M337 261H352V269H336Z" fill="#35413b"/>
          <path d="M197 180Q199 160 224 158L298 161Q320 161 337 179L342 200Q330 216 306 214L232 211Q209 214 199 204Z" fill="url(#pz-coat)"/>
          <path d="M306 169Q330 157 334 136L343 112 363 111 375 136Q360 159 354 191L337 206 313 198Z" fill="url(#pz-coat)"/>
          <path d="M333 143Q332 122 344 110L351 114Q343 143 342 166L327 181Q334 157 330 157Z" fill="url(#pz-mane)"/>
          <path d="M217 196Q206 211 210 227L223 243 219 266H234L239 239 227 221 237 202Z" fill="url(#pz-coat)"/>
          <path d="M318 198 334 198 334 225 330 251 333 266H318L315 253 319 226Z" fill="url(#pz-coat)"/>
          <path d="M219 261H235L236 269H216Z M318 261H333L337 269H317Z" fill="#35413b"/>
          <path d="M210 176Q235 164 288 173" fill="none" stroke="#f7d9a0" stroke-width="4" stroke-linecap="round" opacity=".45"/>
          <path d="M344 119 341 95Q348 93 354 114M356 116 357 93Q365 97 366 117" fill="#d7a66e" stroke="#b77d4e" stroke-width="2"/>
          <path d="M343 119Q350 106 368 112L381 128 402 140Q407 146 402 154L390 158 366 146 352 140Z" fill="url(#pz-coat)"/>
          <path d="M390 139 403 142Q407 149 400 154L390 156 385 149Z" fill="#dec5a1"/>
          <path d="M345 118Q352 106 371 114L379 128 370 126 364 137 361 120 353 129Z" fill="url(#pz-mane)"/>
          <path d="M374 129 381 137 378 145 371 133Z" fill="#fff0c8"/>
          <ellipse cx="375" cy="132" rx="3" ry="3.5" fill="#273b36"/>
          <circle cx="376" cy="131" r="1" fill="#fff8dc"/>
          <ellipse cx="399" cy="147" rx="2" ry="1.5" fill="#755b47"/>
          <path d="m392 153 8-1" stroke="#967452" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <g fill="#dfdca1"><circle cx="51" cy="252" r="2"/><circle cx="84" cy="272" r="2"/><circle cx="407" cy="263" r="2"/><circle cx="430" cy="246" r="2"/></g>
        <g stroke="#77a581" stroke-width="2" stroke-linecap="round"><path d="m42 279 3-10 5 10m327 17 2-10 4 8m76-17 4-11 2 10"/></g>
        <g fill="#fff0ba"><path d="m407 186 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z"/><circle cx="423" cy="173" r="2"/><circle cx="387" cy="204" r="2"/></g>
      </svg>`;
    }
    if(id==='schneckenkampf'){
      let blooms='';for(let i=0;i<6;i++){const x=94+(i%3)*68,y=145+Math.floor(i/3)*55;blooms+=`<rect x="${x-19}" y="${y-19}" width="38" height="38" fill="#916341"/><rect x="${x-2}" y="${y-14}" width="4" height="25" fill="#345b39"/><rect x="${x-12}" y="${y-20}" width="24" height="9" fill="${i%2?'#d99ac5':'#ffe49a'}"/><rect x="${x-4}" y="${y-27}" width="8" height="24" fill="${i%2?'#d99ac5':'#ffe49a'}"/><rect x="${x-3}" y="${y-19}" width="6" height="6" fill="#e6b957"/>`;}
      return frame(`<rect x="280" width="200" height="300" fill="#12243b"/><path d="M280 0V300" stroke="#85955c" stroke-width="2"/><rect x="30" y="70" width="40" height="52" fill="#75563d"/><rect x="10" y="35" width="80" height="50" fill="#5f8247"/><rect x="25" y="20" width="50" height="30" fill="#86a257"/><rect x="310" y="205" width="120" height="9" fill="#826342"/><rect x="318" y="185" width="7" height="52" fill="#ac8c61"/><rect x="405" y="185" width="7" height="52" fill="#ac8c61"/>${blooms}<rect x="174" y="239" width="32" height="20" fill="#efb069"/><rect x="169" y="228" width="42" height="10" fill="#e8cb84"/><rect x="178" y="221" width="25" height="8" fill="#d8b76c"/><rect x="178" y="258" width="25" height="23" fill="#537779"/><rect x="310" y="260" width="65" height="11" fill="#879386"/><rect x="312" y="225" width="35" height="35" fill="#a38459"/><rect x="320" y="234" width="20" height="5" fill="#d6b479"/><rect x="320" y="234" width="5" height="20" fill="#d6b479"/><rect x="362" y="239" width="3" height="22" fill="#879386"/><rect x="360" y="236" width="7" height="5" fill="#ffe591"/>${star(380,50,'#eadfb488')}<rect x="372" y="78" width="42" height="38" fill="#d8e1c0"/><rect x="386" y="70" width="30" height="11" fill="#d8e1c0"/>`,'#789454');
    }
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
