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
  function promptPosition(point,size,viewport,obstacles=[]){
    const pad=10,w=Math.min(size.width,viewport.width-pad*2),h=size.height;
    let left=clamp(point.x-w/2,pad,Math.max(pad,viewport.width-w-pad));
    let top=clamp(point.y-h-12,pad,Math.max(pad,viewport.height-h-pad));
    for(const obstacle of obstacles){
      if(left<obstacle.right+pad&&left+w>obstacle.left-pad&&top<obstacle.bottom+pad&&top+h>obstacle.top-pad){
        const below=obstacle.bottom+pad;
        if(below+h<=viewport.height-pad)top=below;
        else if(obstacle.left-w-pad>=pad)left=obstacle.left-w-pad;
        else top=Math.max(pad,obstacle.top-h-pad);
      }
    }
    return {left,top,width:w,height:h};
  }
  root.SnailView={camera,project,unproject,nearby,promptPosition};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.SnailView;
})(globalThis);
