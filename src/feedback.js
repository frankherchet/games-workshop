(function(root){
  'use strict';
  function context(win,catalog,build){
    const game=catalog.find(game=>`#spiel/${game.id}`===win.location.hash);
    return {page:win.location.pathname+(game||['#','#alle','#kategorien','#main'].includes(win.location.hash)?win.location.hash:''),game:game?`${game.title} (${game.id})`:'Spieleübersicht',build,browser:win.navigator.userAgent,language:win.navigator.language,viewport:`${win.innerWidth} × ${win.innerHeight}`,pixelRatio:String(win.devicePixelRatio),time:new Date().toISOString()};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={context};
  if(!root.document)return;
  const doc=root.document,dialog=doc.getElementById('feedback'),form=doc.getElementById('feedback-form'),send=doc.getElementById('feedback-send'),status=doc.getElementById('feedback-status'),trigger=doc.getElementById('feedback-open');
  let metadata,busy=false,submitted=false;
  trigger.addEventListener('click',()=>{
    if(busy){if(!dialog.open)dialog.showModal();return;}
    if(submitted){form.reset();submitted=false;send.disabled=false;}
    metadata=context(root,root.Arcade.catalog,root.ArcadeBuild);
    doc.getElementById('feedback-context').textContent=JSON.stringify(metadata,null,2);status.textContent='';
    for(const field of [form.elements.type,form.elements.description])field.disabled=false;
    root.dispatchEvent(new Event('blur'));
    const pause=doc.getElementById('pause');if(pause&&!pause.disabled&&pause.textContent==='Pause')pause.click();
    dialog.showModal();form.elements.description.focus();
  });
  doc.getElementById('feedback-close').addEventListener('click',()=>dialog.close());
  // Keep gameplay shortcuts and fullscreen focus handling away from the modal.
  doc.addEventListener('keydown',event=>{if(dialog.open)event.stopImmediatePropagation();},true);
  dialog.addEventListener('close',()=>trigger.focus());
  root.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||submitted||!form.reportValidity())return;
    busy=true;send.disabled=true;send.textContent='Wird gesendet …';status.textContent='';
    form.elements.type.disabled=true;form.elements.description.disabled=true;
    const payload={type:form.elements.type.value,description:form.elements.description.value.trim(),context:metadata};
    try{
      const session=await root.fetch('feedback.php',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!session.ok)throw new Error('Die Meldefunktion ist gerade nicht verfügbar. Dein Text bleibt erhalten.');
      const {csrf}=await session.json();
      if(typeof csrf!=='string')throw new Error('Die Meldefunktion ist noch nicht eingerichtet. Dein Text bleibt erhalten.');
      const response=await root.fetch('feedback.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Senden fehlgeschlagen. Dein Text bleibt erhalten.');
      if(!Number.isInteger(result.number))throw new Error('Die Antwort konnte nicht bestätigt werden. Bitte prüfe die GitHub-Issues vor erneutem Senden.');
      submitted=true;status.textContent=`Danke! Deine Meldung wurde als Issue #${result.number} gespeichert.`;
    }catch(error){status.textContent=error.name==='TimeoutError'?'Zeitüberschreitung. Möglicherweise wurde das Issue bereits angelegt. Bitte vor erneutem Senden auf GitHub prüfen.':error instanceof SyntaxError?'Die Meldefunktion ist gerade nicht verfügbar. Dein Text bleibt erhalten.':error.message;}
    finally{form.elements.type.disabled=submitted;form.elements.description.disabled=submitted;busy=false;send.disabled=submitted;send.textContent='Meldung senden';}
  });
})(globalThis);
