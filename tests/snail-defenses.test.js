const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(fail=false){let loads=0;const calls=[];class Image{constructor(){this.width=2172;}set src(v){loads++;if(fail)this.onerror();else this.onload();}}
 const root={Image,SnailAssets:{defenses:'local.png'}};vm.runInNewContext(fs.readFileSync('src/games/snail-defenses.js','utf8'),root);let depth=0;const c={imageSmoothingEnabled:false,save(){depth++;},restore(){depth--;},drawImage(...args){calls.push(args.slice(1));}};return {root,c,calls,loads:()=>loads,depth:()=>depth};
}
test('Every defense draws its healthy and worn state from the atlas without changing saved data',async()=>{
 const {root,c,calls,loads,depth}=setup();assert.equal(loads(),0);await root.SnailDefenses.ready;assert.equal(loads(),1);
 for(const [index,type]of ['pit','beer','fence','electric','copper','duck'].entries())for(const worn of [false,true]){const item={type,x:200,y:400,hp:worn?10:55,charges:worn?1:5,age:worn?3:0,fed:true,dx:1,dy:0},before=JSON.stringify(item);assert.equal(root.SnailDefenses.draw(c,item,worn?.25:0),true);assert.deepEqual(calls.at(-1).slice(0,4),Array.from(root.SnailDefenses.layout[index+(worn?6:0)]));assert.equal(JSON.stringify(item),before);assert.equal(depth(),0);}
});
test('All defense crop rectangles fit inside the supplied PNG',()=>{const {root}=setup();for(const [x,y,w,h]of root.SnailDefenses.layout){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=2172&&y+h<=724);}});
test('A missing defense image retains the old renderer and does not refetch',async()=>{const {root,c,loads}=setup(true);assert.equal(await root.SnailDefenses.ready,false);assert.equal(root.SnailDefenses.draw(c,{type:'duck'},0),false);assert.equal(loads(),1);});
