// Real Chromium, checked-out game served locally.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM||import.meta.url),{chromium}=require('playwright');
const root=resolve('fantasy-rpg'),mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep))throw Error('path');await stat(path);res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path))}catch{res.statusCode=404;res.end('not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {channel:process.env.CHROME_CHANNEL||'chrome'}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 await page.goto(url+'/field-r66.html');await page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>1,{},{timeout:60000});
 await page.locator('#gearOpen').click();await page.locator('#gearCharacter').selectOption('leon');
 await page.locator('#leonMain').selectOption('sunblade');await page.locator('#leonOffhand').selectOption('sunshield');await page.locator('#leonAccessory').selectOption('sunclasp');await page.locator('#leonBody').selectOption('crimsonmantle');await page.locator('#leonFeet').selectOption('sabaton');
 await page.locator('#gearExploreDir').selectOption('1');await page.locator('#gearExploreMode').selectOption('run');
 const sample=id=>page.locator(id).evaluate(c=>c.toDataURL());
 const frames=new Set();for(let i=0;i<12;i++){frames.add(await sample('#gearPreview'));await page.waitForTimeout(65)}
 ok(frames.size>=3,'actual run preview animated');
 await page.locator('#gearPose').selectOption('attack');await page.locator('#gearMotionPlay').click();const battleFrames=new Set();for(let i=0;i<12;i++){battleFrames.add(await sample('#gearBattle'));await page.waitForTimeout(100)}
 ok(battleFrames.size>=2,'attack playback');
 await page.locator('#gearMotionPlay').click();const stopped=await sample('#gearBattle');await page.waitForTimeout(500);ok(stopped===await sample('#gearBattle'),'pause');
 await page.locator('#gearPlay').click();const cheers=new Set();for(let i=0;i<15;i++){cheers.add(await sample('#gearBattle'));await page.waitForTimeout(90)}
 ok(cheers.size>=2,'Leon victory playback');
 await page.locator('#gearApply').click();ok(await page.evaluate(()=>window.__field.leonAppearance.main==='sunblade'&&window.__field.leonAppearance.offhand==='sunshield'&&window.__field.leonAppearance.accessory==='sunclasp'&&window.__field.leonAppearance.body==='crimsonmantle'&&window.__field.leonAppearance.feet==='sabaton'),'apply');
 await page.locator('#gearOpen').click();await page.locator('#gearCharacter').selectOption('fia');await page.locator('#gearMain').selectOption('ivyfang');await page.locator('#gearOffhand').selectOption('amethystguard');await page.locator('#gearHead').selectOption('amethystband');await page.locator('#gearBody').selectOption('royalcloak');await page.locator('#gearFeet').selectOption('rangerboots');await page.locator('#gearApply').click();
 ok(await page.evaluate(()=>window.__field.appearance.main==='ivyfang'&&window.__field.appearance.offhand==='amethystguard'&&window.__field.appearance.head==='amethystband'&&window.__field.appearance.body==='royalcloak'&&window.__field.appearance.feet==='rangerboots'),'Fia apply');
 await page.locator('#fieldActor').click();
 ok(await page.evaluate(()=>window.__field.actor==='leon'),'Leon is active on the map');
 await page.locator('#run').click();
 const startGold=Number((await page.locator('#money').textContent()).split(' ')[0]);
 const encountered=page.waitForURL('**/battle-r66.html?*token=*',{timeout:20000});
 await page.keyboard.down('ArrowDown');await encountered;await page.keyboard.up('ArrowDown');
 ok(new URL(page.url()).searchParams.get('from')==='field','exploration encounter route');
 await page.waitForFunction(()=>window.__r12?.live&&window.__r12.frames>1,{},{timeout:60000});
 for(let round=0;round<30;round++){
  if(await page.evaluate(()=>!!window.__r12.view.outcome))break;
  for(let i=0;i<4;i++){
   if(await page.evaluate(()=>window.__r12.view.complete))break;
   const target=page.locator('#fieldTargets [data-target]').first();await target.waitFor({state:'visible',timeout:10000});
   await target.dblclick({delay:45});
  }
  ok(await page.evaluate(()=>window.__r12.view.complete&&!window.__r12.planningInputOpen),'final input lock');
  ok(await page.locator('#fieldTargets').isHidden(),'targets closed');
  await page.locator('#submit').click();
  if(await page.locator('#skip').isVisible())await page.locator('#skip').click();
  await page.waitForFunction(()=>!window.__r12.view.busy,{},{timeout:30000});
 }
 ok(await page.evaluate(()=>window.__r12.view.outcome==='win'),'battle win');
 const poses=new Set();for(let i=0;i<20;i++){const v=await page.evaluate(()=>({poses:window.__r12.poses,vitals:window.__r12.view.vitals}));for(const [id,p] of Object.entries(v.poses))ok(v.vitals[id].hp>0?p.clip==='victory':p.clip==='down','result pose '+id);poses.add(JSON.stringify(v.poses));await page.waitForTimeout(75)}
 ok(poses.size>=2,'continuous victory');
 await Promise.all([page.waitForURL('**/field-r66.html'),page.locator('#fieldReturn').click()]);await page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>1);
 ok(await page.evaluate(()=>window.__field.leonAppearance.main==='sunblade'&&window.__field.leonAppearance.offhand==='sunshield'&&window.__field.leonAppearance.accessory==='sunclasp'&&window.__field.leonAppearance.body==='crimsonmantle'&&window.__field.appearance.main==='ivyfang'&&window.__field.appearance.offhand==='amethystguard'&&window.__field.appearance.head==='amethystband'&&window.__field.appearance.body==='royalcloak'),'return preserves outfits');ok(errors.length===0,'page errors: '+errors.join(';'));
 ok(await page.evaluate(()=>window.__field.state.map==='meadow'&&window.__field.state.cleared.includes('wolf')),'defeated wolf stays cleared');
 ok(Number((await page.locator('#money').textContent()).split(' ')[0])===startGold+30,'encounter reward settled');
 await page.reload();await page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>1);
 ok(Number((await page.locator('#money').textContent()).split(' ')[0])===startGold+30,'reward not duplicated');
 if(process.env.GEAR_REVIEW_DIR)await page.screenshot({path:process.env.GEAR_REVIEW_DIR+'/r66-field.png'});
 await page.goto(url+'/review-equipment-r66.html');
 await page.locator('#status').waitFor({state:'hidden'});
 ok(await page.locator('canvas').count()===6,'old and new comparisons');
 await page.locator('#playback').click();await page.locator('#direction').selectOption('0');
 for(const id of ['leon','fia']){
  await page.locator('#actor').selectOption(id);
  await page.locator('#pose').selectOption('idle');
  const left=page.locator('#outfits article').first().locator('canvas').first();
  const right=page.locator('#outfits article').last().locator('canvas').first();
  const read=locator=>locator.evaluate(canvas=>canvas.toDataURL());
  await page.waitForFunction(()=>[...document.querySelectorAll('#outfits article > figure canvas')].every(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v!==0)));
  ok(await read(left)!==await read(right),id+' comparisons show the new options');
  if(process.env.GEAR_REVIEW_DIR)await page.screenshot({path:process.env.GEAR_REVIEW_DIR+'/'+id+'-r66-compare.png',fullPage:true});
  const rendered=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const isolated=new Set();
  for(const option of await page.locator('#gear option').evaluateAll(nodes=>nodes.slice(1).map(o=>o.value))){
   await page.locator('#gear').selectOption(option);await page.locator('#pose').selectOption('attack');await rendered();
   const gearFrame=await read(right);isolated.add(gearFrame);
   ok(await read(left)!==gearFrame,id+' independent '+option);
  }
  ok(isolated.size===3,id+' three unique single-equipment looks');
  await page.locator('#gear').selectOption('all');await page.locator('#pose').selectOption('victory');await rendered();
  ok(await read(left)!==await read(right),id+' victory equipment');
  if(process.env.GEAR_REVIEW_DIR)await page.screenshot({path:process.env.GEAR_REVIEW_DIR+'/'+id+'-r66-result.png',fullPage:true});
 }
 ok(errors.length===0,'browser errors: '+errors.join(','));console.log(JSON.stringify({uiChecks:checks,failures:0}));
 if(process.env.GEAR_UI_ONLY!=='1'){
  const raster=await page.evaluate(async()=>await (await import('./test-r66-browser.js')).verifyEquipment());
  console.log(JSON.stringify(raster));
 }
}finally{await browser?.close();await new Promise(r=>server.close(r))}
