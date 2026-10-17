(function(root){
  'use strict';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function camera(width,height,player,immersive=false){
    width=Math.max(1,width);height=Math.max(1,height);
    const scale=immersive?Math.max(width/960,height/640):Math.min(width/960,height/640);
    return {width,height,scale,x:immersive?clamp(width/2-player.x*scale,width-960*scale,0):(width-960*scale)/2,y:immersive?clamp(height*.48-player.y*scale,height-640*scale,0):(height-640*scale)/2};
  }
  const project=(view,p)=>({x:p.x*view.scale+view.x,y:p.y*view.scale+view.y});
  const unproject=(view,p)=>({x:(p.x-view.x)/view.scale,y:(p.y-view.y)/view.scale});
  function nearby(state,tool='water'){
    if(!state||state.over||state.phase!=='day')return {flower:null,shop:false};
    const M=root.SnailModel;
    const plants=state.plots.map((p,index)=>({...p,index})).filter(p=>p.unlocked&&(tool==='seed'?!p.type:!!p.type)&&M.dist(p,state.player)<=96);
    if(tool==='seed')plants.sort((a,b)=>M.dist(a,state.player)-M.dist(b,state.player));
    else plants.sort((a,b)=>Number(a.watered&&a.hp>=M.PLANTS[a.type].hp)-Number(b.watered&&b.hp>=M.PLANTS[b.type].hp)||M.dist(a,state.player)-M.dist(b,state.player));
    return {flower:plants[0]||null,shop:M.dist(state.player,{x:835,y:175})<=140};
  }
  function structuresNearby(state){
    if(!state||state.over)return {duck:null,structure:null};
    const items=state.structures.filter(t=>t.hp>0&&root.SnailModel.dist(t,state.player)<=96).sort((a,b)=>root.SnailModel.dist(a,state.player)-root.SnailModel.dist(b,state.player));
    return {duck:items.find(t=>t.type==='duck')||null,structure:state.phase==='day'?(items.find(t=>t.type!=='duck')||null):null};
  }
  function promptPosition(point,size,viewport,obstacles=[]){
    const pad=10,w=Math.min(size.width,viewport.width-pad*2),h=size.height;
    let left=clamp(point.x-w/2,pad,Math.max(pad,viewport.width-w-pad));
    let top=clamp(point.y-h-12,pad,Math.max(pad,viewport.height-h-pad));
    for(const o of obstacles){
      if(left<o.right+pad&&left+w>o.left-pad&&top<o.bottom+pad&&top+h>o.top-pad){
        if(o.bottom+pad+h<=viewport.height-pad)top=o.bottom+pad;
        else if(o.left-w-pad>=pad)left=o.left-w-pad;
        else top=Math.max(pad,o.top-h-pad);
      }
    }
    const preferred={left,top};
    const xs=[left,pad,viewport.width-w-pad],ys=[top,pad,viewport.height-h-pad];
    for(const o of obstacles){xs.push(o.right+pad,o.left-w-pad);ys.push(o.bottom+pad,o.top-h-pad);}
    let best=Infinity;
    for(const x of xs)for(const y of ys){
      const l=clamp(x,pad,Math.max(pad,viewport.width-w-pad)),t=clamp(y,pad,Math.max(pad,viewport.height-h-pad));
      const overlap=obstacles.reduce((sum,o)=>sum+Math.max(0,Math.min(l+w+pad,o.right)-Math.max(l-pad,o.left))*Math.max(0,Math.min(t+h+pad,o.bottom)-Math.max(t-pad,o.top)),0);
      const score=overlap*1e6+(l-preferred.left)**2+(t-preferred.top)**2;
      if(score<best){best=score;left=l;top=t;}
    }
    return {left,top,width:w,height:h};
  }
  root.SnailView={camera,project,unproject,nearby,structuresNearby,promptPosition};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.SnailView;
})(globalThis);

