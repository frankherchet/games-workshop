(function(root){
  'use strict';
  const layout=[[48,15,119,205],[218,14,121,206],[386,14,126,206],[583,14,109,204],[746,14,121,206],[935,14,115,206],[49,226,117,203],[227,226,114,204],[389,229,120,201],[572,227,112,205],[748,228,121,204],[934,229,114,203],[49,438,107,229],[228,438,102,229],[390,439,113,228],[575,439,115,223],[746,439,123,225],[930,439,123,224],[51,672,108,214],[224,674,105,213],[394,675,111,212],[563,674,126,216],[741,675,123,215],[928,675,121,215],[31,890,134,179],[206,890,145,180],[375,890,146,180],[551,890,165,180],[731,890,163,180],[912,890,159,180],[41,1070,117,173],[214,1070,121,174],[387,1070,127,173],[567,1070,152,173],[744,1070,154,172],[929,1070,146,174],[18,1252,163,85],[197,1252,165,85],[376,1257,167,80],[549,1251,175,85],[737,1254,168,81],[918,1257,154,78],[18,1345,163,90],[198,1345,164,90],[376,1344,167,91],[548,1338,176,97],[733,1337,172,98],[917,1339,155,96]];
  let atlas=null,pending=null,loaded=false;
  function ready(){
    if(pending)return pending;
    if(!root.Image||!root.SnailAssets?.sprites)return Promise.resolve(false);
    pending=new Promise(resolve=>{atlas=new root.Image();atlas.onload=()=>{loaded=(atlas.naturalWidth||atlas.width)>0;resolve(loaded);};atlas.onerror=()=>resolve(false);atlas.src=root.SnailAssets.sprites;});
    return pending;
  }
  function cell(c,index,x,y,size,snail=false){
    ready();if(!loaded)return false;
    const [sx,sy,sw,sh]=layout[index],height=snail?size*sh/sw:size,width=snail?size:size*sw/sh;
    const smoothing=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;
    c.drawImage(atlas,sx,sy,sw,sh,x-width/2,y-height,width,height);
    c.imageSmoothingEnabled=smoothing;return true;
  }
  function character(c,type,x,y,time,moving,direction){
    const who={gardener:0,gardeneress:1,fox:2}[type]??0;
    const dx=direction.dx||0,dy=direction.dy||0;
    const facing=Math.abs(dx)>Math.abs(dy)?(dx<0?3:1):(dy<-.2?2:0);
    const frame=moving?1+(Math.floor(time*8)%2):0;
    return cell(c,who*12+facing*3+frame,x,y,64);
  }
  function snail(c,n,time){
    const type={normal:0,fast:1,armored:2,giant:3}[n.type]??0;
    const size=n.type==='giant'?78:n.type==='fast'?64:56;
    c.save();c.translate(n.x,n.y+10);if(n.dx<0)c.scale(-1,1);
    const result=cell(c,36+type*3+Math.floor(time*6+n.id)%3,0,0,size,true);c.restore();return result;
  }
  root.SnailSprites={layout,character,snail,get ready(){return ready();}};
})(globalThis);
