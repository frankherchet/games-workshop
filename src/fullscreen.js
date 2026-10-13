(function(root) {
  'use strict';
  let current=null;
  function fit(width,height,aspect) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||!Number.isFinite(aspect)||width<=0||height<=0||aspect<=0)return {width:0,height:0};
    const fittedWidth=Math.min(width,height*aspect);
    return {width:Math.floor(fittedWidth),height:Math.floor(fittedWidth/aspect)};
  }
  function create({element,button,stage,aspect=16/9,document:doc=root.document,window:win=root.window}) {
    let active=false,disposed=false,native=false,frame=0,previous=null;
    const listeners=[];
    const listen=(target,event,handler,options)=>{target?.addEventListener(event,handler,options);listeners.push(()=>target?.removeEventListener(event,handler,options));};
    const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
    function resize(){
      frame=0;if(!active||disposed)return;
      const viewport=win.visualViewport;
      const width=viewport?.width||win.innerWidth,height=viewport?.height||win.innerHeight;
      element.style.setProperty('--fs-viewport-height',`${height}px`);
      element.style.setProperty('--fs-viewport-width',`${width}px`);
      const rect=stage.getBoundingClientRect(),size=fit(rect.width,rect.height,aspect);
      stage.style.setProperty('--fs-content-width',`${size.width}px`);
      stage.style.setProperty('--fs-content-height',`${size.height}px`);
    }
    function schedule(){if(active&&!disposed&&!frame)frame=win.requestAnimationFrame(resize);}
    function update(){button.textContent=active?'Vollbild verlassen':'Vollbild';button.setAttribute('aria-pressed',String(active));}
    function leave(){
      if(!active)return;active=false;native=false;
      win.cancelAnimationFrame(frame);frame=0;element.classList.remove('game-fullscreen');doc.body.classList.remove('game-is-fullscreen');
      doc.body.style.overflow=previous.bodyOverflow;doc.documentElement.style.overflow=previous.htmlOverflow;
      const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
      if(nativeElement()===element&&exit){try{Promise.resolve(exit.call(doc)).catch(()=>{});}catch{}}
      update();if(current===controller)current=null;
      win.scrollTo(previous.x,previous.y);if(previous.focus?.isConnected)previous.focus.focus({preventScroll:true});
    }
    function enter(){
      if(disposed||active)return;
      current?.exit();previous={bodyOverflow:doc.body.style.overflow,htmlOverflow:doc.documentElement.style.overflow,x:win.scrollX,y:win.scrollY,focus:doc.activeElement};
      active=true;current=controller;doc.body.style.overflow='hidden';doc.documentElement.style.overflow='hidden';
      doc.body.classList.add('game-is-fullscreen');element.classList.add('game-fullscreen');update();schedule();
      const focusTarget=stage.querySelector?.('.overlay:not(.hidden) button, .sn-dialog:not([hidden]) button')||stage.querySelector?.('canvas')||stage.querySelector?.('button');
      focusTarget?.focus({preventScroll:true});
      // Request native fullscreen in the original click, without awaiting layout.
      // Browsers that reject or lack the API keep the fitted browser-window mode.
      const request=element.requestFullscreen||element.webkitRequestFullscreen;
      if(request&&doc.fullscreenEnabled!==false){
        try{Promise.resolve(request.call(element,request===element.requestFullscreen?{navigationUI:'hide'}:undefined)).then(()=>{if(disposed||!active){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;if(nativeElement()===element&&exit)Promise.resolve(exit.call(doc)).catch(()=>{});}else{native=nativeElement()===element;schedule();}}).catch(schedule);}catch{schedule();}
      }
    }
    const controller={enter,exit:leave,toggle(){active?leave():enter();},get active(){return active;},dispose(){leave();disposed=true;observer?.disconnect();listeners.forEach(fn=>fn());}};
    const report=doc.createElement?.('button');
    if(report&&doc.getElementById?.('feedback-open')){
      report.type='button';report.className='button small secondary';report.textContent='Bug / Wunsch';
      button.parentNode.append(report);
      listen(report,'click',()=>{controller.exit();doc.getElementById('feedback-open').click();});
      listeners.push(()=>report.remove());
    }
    listen(button,'click',()=>controller.toggle());
    listen(win,'resize',schedule);listen(win,'orientationchange',schedule);listen(win.visualViewport,'resize',schedule);
    const change=()=>{if(nativeElement()===element){native=true;schedule();}else if(native&&active)leave();};
    listen(doc,'fullscreenchange',change);listen(doc,'webkitfullscreenchange',change);
    listen(doc,'keydown',event=>{
      if(!active)return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();leave();return;}
      if(event.key==='Tab'){
        const elements=[...element.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
        if(!elements.length)return;const first=elements[0],last=elements.at(-1),focused=doc.activeElement;
        if(event.shiftKey&&(focused===first||!element.contains(focused))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(focused===last||!element.contains(focused))){event.preventDefault();first.focus();}
      }
    },true);
    const observer=win.ResizeObserver?new win.ResizeObserver(schedule):null;observer?.observe(stage);
    update();return controller;
  }
  root.ArcadeFullscreen={fit,create};
  if(typeof module!=='undefined'&&module.exports)module.exports={fit,create};
})(globalThis);
