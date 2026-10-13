const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Every new weapon and trap selects an in-bounds crop and preserves canvas smoothing',async()=>{
 class Image{constructor(){this.width=1536;}set src(v){this.onload();}}
 const root={Image,SnailAssets:{extras:'local.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-extras.js','utf8'),root);await root.SnailExtras.ready;const c={imageSmoothingEnabled:false,drawImage(...args){this.args=args.slice(1);}};
 for(const [i,type]of ['rake','mallet','sickle','thorn','resin','lantern'].entries()){assert.equal(root.SnailExtras.draw(c,type,100,100,60),true);const [x,y,w,h]=root.SnailExtras.layout[i];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1536&&y+h<=1024);assert.deepEqual(c.args.slice(0,4),Array.from(root.SnailExtras.layout[i]));assert.equal(c.imageSmoothingEnabled,false);}
});
