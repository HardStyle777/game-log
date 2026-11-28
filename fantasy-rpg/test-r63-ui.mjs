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
 browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(m)};
 await page.goto(url+'/field-r63.html');await page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>1,{},{timeout:60000});
 await page.locator('#gearOpen').click();await page.locator('#gearCharacter').selectOption('leon');
 await page.locator('#leonMain').selectOption('royalsword');await page.locator('#leonBody').selectOption('royalplate');await page.locator('#leonFeet').selectOption('sabaton');
 await page.locator('#gearExploreDir').selectOption('1');await page.locator('#gearExploreMode').selectOption('run');
 const sample=id=>page.locator(id).evaluate(c=>c.toDataURL());
 const frames=new Set();for(let i=0;i<12;i++){frames.add(await sample('#gearPreview'));await page.waitForTimeout(65)}
 ok(frames.size>=3,'actual run preview animated');
 await page.locator('#gearPose').selectOption('attack');await page.locator('#gearMotionPlay').click();const battleFrames=new Set();for(let i=0;i<12;i++){battleFrames.add(await sample('#gearBattle'));await page.waitForTimeout(100)}
 ok(battleFrames.size>=2,'attack playback');
 await page.locator('#gearMotionPlay').click();const stopped=await sample('#gearBattle');await page.waitForTimeout(500);ok(stopped===await sample('#gearBattle'),'pause');
 await page.locator('#gearPlay').click();const cheers=new Set();for(let i=0;i<15;i++){cheers.add(await sample('#gearBattle'));await page.waitForTimeout(90)}
 ok(cheers.size>=2,'Leon victory playback');
 await page.locator('#gearApply').click();ok(await page.evaluate(()=>window.__field.leonAppearance.main==='royalsword'&&window.__field.leonAppearance.body==='royalplate'&&window.__field.leonAppearance.feet==='sabaton'),'apply');
 await page.locator('#gearOpen').click();await page.locator('#gearCharacter').selectOption('fia');await page.locator('#gearMain').selectOption('moonfang');await page.locator('#gearOffhand').selectOption('moonfang');await page.locator('#gearBody').selectOption('rangercoat');await page.locator('#gearFeet').selectOption('rangerboots');await page.locator('#gearApply').click();
 ok(await page.evaluate(()=>window.__field.appearance.main==='moonfang'&&window.__field.appearance.offhand==='moonfang'&&window.__field.appearance.body==='rangercoat'&&window.__field.appearance.feet==='rangerboots'),'Fia apply');
 await page.goto(url+'/battle-r63.html?live=1');await page.waitForFunction(()=>window.__r12?.live&&window.__r12.frames>1,{},{timeout:60000});
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
 await Promise.all([page.waitForURL('**/field-r63.html'),page.locator('#fieldReturn').click()]);await page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>1);
 ok(await page.evaluate(()=>window.__field.leonAppearance.main==='royalsword'&&window.__field.leonAppearance.body==='royalplate'&&window.__field.appearance.main==='moonfang'&&window.__field.appearance.offhand==='moonfang'&&window.__field.appearance.body==='rangercoat'),'return preserves outfits');ok(errors.length===0,'page errors: '+errors.join(';'));
 await page.goto(url+'/review-weapon-poses-r63.html');await page.waitForFunction(()=>window.__weaponReview?.poses===39,{},{timeout:60000});ok(await page.locator('canvas').count()===78,'39 pose visual review');await page.locator('#outfit').selectOption('full');ok(await page.locator('canvas').count()===78,'full gear visual review');ok(errors.length===0,'review page errors');console.log(JSON.stringify({uiChecks:checks,failures:0}));
 const raster=await page.evaluate(async()=>{const {createVerifier}=await import('./test-r63-browser.js'),v=await createVerifier();for(const g of v.list)v.verifyOne(g);return v.summary()});
 console.log(JSON.stringify(raster));if(raster.done!==576||raster.frames!==40320||raster.legacy!==256||raster.failures)throw Error('raster regression');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
