(function(root){
  const {clamp}=root.ArcadeCore;
  root.Arcade.session=function({canvas,update,draw,onPause}){
    const keys=new Set(), cleanups=[];let running=false,last=0,frame=0,disposed=false;
    const listen=(target,event,handler,options)=>{target.addEventListener(event,handler,options);cleanups.push(()=>target.removeEventListener(event,handler,options));};
    const relevant=new Set(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w']);
    listen(document,'keydown',e=>{if(e.target.closest('input,button,a,dialog'))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(relevant.has(k)){e.preventDefault();keys.add(k);}});
    listen(document,'keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
    const clear=()=>keys.clear();listen(window,'blur',()=>{clear();if(running)onPause();});
    listen(document,'visibilitychange',()=>{if(document.hidden){clear();if(running)onPause();}});
    document.querySelectorAll('[data-key]').forEach(button=>{
      const release=()=>{keys.delete(button.dataset.key);button.classList.remove('held');};
      listen(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(button.dataset.key);button.classList.add('held');canvas.focus({preventScroll:true});});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(button,event,release);
    });
    const loop=time=>{if(!running||disposed)return;const dt=clamp((time-last)/1000,0,.025);last=time;update(dt,keys);draw();if(running)frame=requestAnimationFrame(loop);};
    return {keys,listen,start(){if(running||disposed)return;running=true;last=performance.now();canvas.focus({preventScroll:true});frame=requestAnimationFrame(loop);},pause(){running=false;cancelAnimationFrame(frame);clear();},draw,dispose(){disposed=true;this.pause();cleanups.forEach(fn=>fn());}};
  };
})(globalThis);
