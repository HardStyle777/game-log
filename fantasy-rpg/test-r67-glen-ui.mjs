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
try {
 browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {channel:process.env.CHROME_CHANNEL||'chrome'}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let checks=0;
 const ok=(value,message)=>{checks++;if(!value)throw Error(message);};
 const ready=()=>page.waitForFunction(()=>window.__field?.ready&&window.__field.frames>2);
 const gear={main:'fortressblade',offhand:'fortressshield',head:'helm',body:'gunmetal',feet:'sabaton',accessory:'oath'};
 const saved=()=>page.evaluate(value=>Object.entries(value).every(([slot,id])=>window.__field.glenAppearance[slot]===id),gear);
 const sample=selector=>page.locator(selector).evaluate(canvas=>canvas.toDataURL());
 await page.goto(url+'/field-r67.html');await ready();
 await page.locator('#fieldActor').click();await page.locator('#fieldActor').click();
 ok(await page.evaluate(()=>window.__field.actor==='glen'&&window.__field.frame.asset==='glen'),'Glen exploration');
 await page.locator('#gearOpen').click();
 ok(await page.locator('#gearCharacter').inputValue()==='glen','Glen appearance opens with the field actor');
 for(const [slot,option] of Object.entries(gear))await page.locator('#glen-'+slot).selectOption(option);
 const pose=page.locator('#gearPose');
 await pose.selectOption('guard');const before=await sample('#gearBattle');
 await page.locator('#gearNext').click();ok(await sample('#gearBattle')!==before,'independent shield block pose');
 await pose.selectOption('revive');const rising=new Set([await sample('#gearBattle')]);
 for(let i=0;i<3;i++){await page.locator('#gearNext').click();rising.add(await sample('#gearBattle'));}
 ok(rising.size===4,'down, kneel, rise, stand in the preview');
 await page.locator('#gearExploreMode').selectOption('run');await page.locator('#gearExploreDir').selectOption('2');
 const running=new Set();for(let i=0;i<9;i++){running.add(await sample('#gearPreview'));await page.waitForTimeout(90);}
 ok(running.size>=3,'three frames in the rear running loop');
 await page.locator('#gearApply').click();ok(await saved(),'all six settings applied');
 await page.locator('#run').click();
 const expectedBattle=page.waitForURL('**/battle-r67.html?*token=*',{timeout:20000});
 await page.keyboard.down('ArrowDown');await expectedBattle;await page.keyboard.up('ArrowDown');
 await page.waitForFunction(()=>window.__r12?.live&&window.__r12.frames>1);
 ok(new URL(page.url()).searchParams.get('from')==='field','real encounter from exploration');
 ok(await page.locator('#member-glen img').evaluate(image=>image.complete&&image.naturalWidth===256&&image.src.endsWith('/r67/glen-portrait.png')),'dedicated portrait loaded');
 const targets=page.locator('#fieldTargets [data-target]').first();
 const skill=choice=>page.locator(`[data-action="${choice}"]`).click();
 async function round(glensAction){
  await page.locator('#member-glen').click();await skill(glensAction);
  if(glensAction!=='guard')await targets.dblclick({delay:45});
  for(const actor of ['leon','fia','lucia']){
   if(!await page.evaluate(id=>window.__r12.view.active.includes(id),actor))continue;
   await page.locator('#member-'+actor).click();await skill('basic');await targets.dblclick({delay:45});
  }
  ok(await page.evaluate(()=>window.__r12.view.complete&&!window.__r12.planningInputOpen),'confirmed round locks inputs');
  await page.locator('#submit').click();
 }
 await round('guard');
 await page.waitForFunction(()=>window.__r12.poses.glen.clip==='guard'&&window.__r12.poses.glen.frame.x===240&&window.__r12.poses.glen.frame.y===216,{},{timeout:10000});
 if(process.env.GEAR_REVIEW_DIR)await page.screenshot({path:process.env.GEAR_REVIEW_DIR+'/r67-glen-live-guard.png'});
 if(await page.locator('#skip').isVisible())await page.locator('#skip').click();
 await page.waitForFunction(()=>!window.__r12.view.busy);
 await round('tech');
 await page.waitForFunction(()=>window.__r12.poses.glen.clip==='attack'&&window.__r12.poses.glen.frame.x===480&&window.__r12.poses.glen.frame.y===0,{},{timeout:10000});
 if(await page.locator('#skip').isVisible())await page.locator('#skip').click();
 await page.waitForFunction(()=>!window.__r12.view.busy);
 for(let i=0;i<15&&!await page.evaluate(()=>window.__r12.view.outcome);i++){
  await round('basic');if(await page.locator('#skip').isVisible())await page.locator('#skip').click();
  await page.waitForFunction(()=>!window.__r12.view.busy);
 }
 ok(await page.evaluate(()=>window.__r12.view.outcome==='win'),'victory');
 const victories=new Set();for(let i=0;i<14;i++){
  const value=await page.evaluate(()=>window.__r12.poses.glen);ok(value.clip==='victory','victory remains on screen');victories.add(value.frame.x);await page.waitForTimeout(95);
 }
 ok(victories.size===2,'both victory poses played');
 await Promise.all([page.waitForURL('**/field-r67.html'),page.locator('#fieldReturn').click()]);await ready();
 ok(await saved()&&await page.evaluate(()=>window.__field.actor==='glen'&&window.__field.state.cleared.includes('wolf')),'Glen and equipment persist on return');
 await page.reload();await ready();ok(await saved(),'Glen equipment persists on reload');
 ok((await page.locator('#money').textContent()).trim()==='130 G','reward credited once');
 await page.goto(url+'/review-equipment-r67.html');await page.locator('#status').waitFor({state:'hidden'});
 ok(await page.locator('#actor').inputValue()==='glen','Glen starts in comparison');
 ok(await page.locator('#gear option').count()===7,'six individually selectable gear appearances');
 await page.locator('#actor').selectOption('fia');await page.locator('#gear').selectOption('offhand');
 await page.locator('#actor').selectOption('leon');await page.locator('#gear').selectOption('accessory');
 await page.locator('#actor').selectOption('glen');await page.locator('#pose').selectOption('guard');
 ok(errors.length===0,'browser errors: '+errors.join(','));
 console.log(JSON.stringify({uiChecks:checks, failures:0}));
 const result=await page.evaluate(async()=>await (await import('./test-r67-glen-browser.js')).verifyGlen());
 console.log(JSON.stringify(result));
} finally {await browser?.close();await new Promise(r=>server.close(r));}
