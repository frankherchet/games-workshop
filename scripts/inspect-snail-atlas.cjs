// Optional asset authoring helper. Derives crop rectangles; never modifies the PNG.
const fs=require('node:fs'),{loadImage,createCanvas}=require('@napi-rs/canvas');
(async()=>{
 const image=await loadImage('src/assets/garden-sprites-v4.png'),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,image.width,image.height).data;
 const rows=[0,224,436,672,890,1070,1246,1337,image.height],rects=[];
 for(let row=0;row<8;row++)for(let col=0;col<6;col++){
  const x0=Math.round(col*image.width/6),x1=Math.round((col+1)*image.width/6),y0=rows[row],y1=rows[row+1],w=x1-x0,h=y1-y0,seen=new Uint8Array(w*h);let best=[];
  for(let i=0;i<w*h;i++){
   if(seen[i])continue;seen[i]=1;const x=i%w,y=Math.floor(i/w);if(data[((y+y0)*image.width+x+x0)*4+3]<120)continue;
   const queue=[i];for(let q=0;q<queue.length;q++){const n=queue[q],nx=n%w,ny=Math.floor(n/w);for(const [a,b]of [[nx-1,ny],[nx+1,ny],[nx,ny-1],[nx,ny+1]]){if(a<0||a>=w||b<0||b>=h)continue;const ni=b*w+a;if(seen[ni])continue;seen[ni]=1;if(data[((b+y0)*image.width+a+x0)*4+3]>=120)queue.push(ni);}}
   if(queue.length>best.length)best=queue;
  }
  if(best.length<500)throw Error('Missing sprite '+rects.length);
  const xs=best.map(i=>i%w+x0),ys=best.map(i=>Math.floor(i/w)+y0),left=Math.max(x0,Math.min(...xs)-2),top=Math.max(y0,Math.min(...ys)-2),right=Math.min(x1,Math.max(...xs)+3),bottom=Math.min(y1,Math.max(...ys)+3);
  rects.push([left,top,right-left,bottom-top]);
 }
 const file='src/games/snail-sprites.js';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/(?:\/\* ATLAS_LAYOUT \*\/|const layout=\[[^\n]*;)/,`const layout=${JSON.stringify(rects)};`));console.log('Derived',rects.length,'alpha-aware rectangles from',image.width,image.height);
})();
