(function(root){
  root.Arcade.games['memory-quest']=function(api){
    const {stage,score,status,finish}=api;let cards,open,matches,moves,active=false,remaining=0,timer=0,deadline=0,disposed=false;
    const symbols=['◆','✚','★','●','▲','■','♥','☀'];
    const closePair=()=>{for(const i of open){const el=stage.querySelector(`[data-card="${i}"]`);el.classList.remove('revealed');el.setAttribute('aria-label',`Karte ${i+1}, verdeckt`);}open=[];remaining=0;timer=0;};
    const schedule=()=>{deadline=Date.now()+remaining;timer=setTimeout(()=>{if(!disposed)closePair();},remaining);};
    function reset(){clearTimeout(timer);cards=root.ArcadeCore.shuffle([...symbols,...symbols]);open=[];matches=new Set();moves=0;remaining=0;score(0);status('0 VON 8 PAAREN');stage.innerHTML=`<div class="memory-board">${cards.map((symbol,i)=>`<button class="memory-card" data-card="${i}" aria-label="Karte ${i+1}, verdeckt"><span class="question" aria-hidden="true">?</span><span class="symbol" aria-hidden="true">${symbol}</span></button>`).join('')}</div>`;}
    function click(e){const button=e.target.closest('[data-card]');if(!button||!active||remaining||disposed)return;const i=Number(button.dataset.card);if(matches.has(i)||open.includes(i))return;open.push(i);button.classList.add('revealed');button.setAttribute('aria-label',`Karte ${i+1}: ${cards[i]}`);if(open.length!==2)return;moves++;score(moves);const [a,b]=open;if(cards[a]===cards[b]){for(const index of open){matches.add(index);const el=stage.querySelector(`[data-card="${index}"]`);el.classList.add('matched');el.disabled=true;}open=[];status(`${matches.size/2} VON 8 PAAREN`);if(matches.size===16){active=false;finish(moves,'Alle Paare gefunden!',`Du hast ${moves} Züge gebraucht. Je weniger, desto besser.`);}}else{remaining=850;schedule();}}
    stage.addEventListener('click',click);reset();
    const visibility=()=>{if(document.hidden&&active)api.pause();};const blur=()=>{if(active)api.pause();};document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',blur);
    return {start(){active=true;if(remaining)schedule();},pause(){active=false;if(timer){remaining=Math.max(1,deadline-Date.now());clearTimeout(timer);timer=0;}},reset(){active=false;reset();},dispose(){disposed=true;active=false;clearTimeout(timer);stage.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);}};
  };
})(globalThis);
