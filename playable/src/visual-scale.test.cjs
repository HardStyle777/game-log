const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function loadLayout(){
 const window={};
 const source=fs.readFileSync(require.resolve('../art.js'),'utf8').replace('window.SwordArt={};','window.SwordArt=SwordArt={};');
 vm.runInNewContext(source,{window,Image:function(){},document:{}});
 return window.SwordArt.layout;
}

test('every hero sheet resolves to one visual body scale and ground line',()=>{
 const layout=loadLayout();
 assert.deepEqual(JSON.parse(JSON.stringify({x:layout.x,ground:layout.ground})),{x:340,ground:360});
 // Measured standing-body pixel heights in the approved source sheets.
 const displayed=[270*layout.scales.combo,279*layout.scales.other,321*layout.scales.basic,316*layout.scales.support];
 const spread=Math.max(...displayed)-Math.min(...displayed);
 assert.ok(spread/layout.targetBodyHeight<.04,`hero height spread must stay under 4%, got ${spread.toFixed(1)}px`);
 assert.ok(displayed.every(h=>Math.abs(h-layout.targetBodyHeight)<9),`all sheets must stay near ${layout.targetBodyHeight}px: ${displayed.join(', ')}`);
});
