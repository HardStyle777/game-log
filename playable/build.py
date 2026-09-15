from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent.parent
out=root/'playable'
source=root/'restored' if (root/'restored').exists() else root
for f in ['full_op_source.json','full_op_model.cjs','balanced_loot.cjs','town_shop.cjs']:
 shutil.copy(source/f,out/'src'/f)
s=(source/'revised_combat.cjs').read_text().replace('function battle(', 'function* stream(')
s=s.replace('const casts={},ps=',"let cursor=state.cursor||0,events=[];\n const snapshot=()=>({seconds:t,hp:Math.max(0,hp),cp,potions,cursor,action:pending?.s?.id||null,foes:foes.map(e=>({hp:Math.max(0,e.hp),maxHp:e.maxHp,element:e.element,statuses:{...e.statuses}})),events:events.splice(0)});\n const casts={},ps=")
s=s.replace('({win,reason,seconds:', '({view:snapshot(),win,reason,seconds:').replace('state:{hp:', 'state:{cursor,hp:')
a=s.index(' let s=skills.find(');b=s.index('\n if(!s)',a)
s=s[:a]+''' const eligible=s=>s.ready<=t+1e-8&&(s.type==='potion'?potions>0&&potionReady<=t&&hp/maxHp<=clamp(s.hpBelow??.4):cp>=Math.max(0,s.cost||0));
 let s;
 if(p.ordered){for(let n=0;n<skills.length;n++){const i=(cursor+n)%skills.length;if(eligible(skills[i])){s=skills[i];cursor=(i+1)%skills.length;break;}}}else s=skills.find(eligible);'''+s[b:]
s=s.replace("s={id:'basic',mult:1,cast:1,targets:1,basic:true}","s={id:'basic',mult:1,cast:1,targets:1,basic:true,hitFractions:p.ordered?[.46]:undefined}")
s=s.replace('pending={s,done:t+chaseDelay+', 'const duration=chaseDelay+')
s=s.replace(')))};chaseDelay=0;', ')));pending={s,start:t,end:t+duration,done:t+duration,hit:0};if(s.hitFractions)pending.done=t+duration*s.hitFractions[0];events.push({type:"cast",id:s.id,time:t,duration});chaseDelay=0;')
s=s.replace('while(t<maxSeconds&&hp>0&&living().length){','while(t<maxSeconds&&hp>0&&living().length){\n yield snapshot();')
s=s.replace("if(s&&!disabled(ps)){", "if(s&&!pending.recovery&&!disabled(ps)){")
s=s.replace('casts[s.id]=(casts[s.id]||0)+1;', 'if(!pending.hit)casts[s.id]=(casts[s.id]||0)+1;')
s=s.replace('if(rnd()>=hit)continue;', 'if(rnd()>=hit){events.push({type:"miss",target:foes.indexOf(e),time:t});continue;}')
s=s.replace('*(s.mult??1)*', '*(s.mult??1)/(s.hitFractions?.length||1)*')
s=s.replace('const actual=Math.min', 'damage/=1;\n const actual=Math.min')
s=s.replace('e.hp-=actual;', 'e.hp-=actual;events.push({type:"hit",id:s.id,target:foes.indexOf(e),damage:actual,crit,time:t});')
s=s.replace('}pending=null;}', '''}
 if(pending.s?.hitFractions&&!pending.recovery){pending.hit++;if(pending.hit<pending.s.hitFractions.length)pending.done=pending.start+(pending.end-pending.start)*pending.s.hitFractions[pending.hit];else{pending.recovery=true;pending.done=pending.end;}}else pending=null;}''')
s=s.replace('hp-=d*(1-absorb);','hp-=d*(1-absorb);events.push({type:"hurt",target:foes.indexOf(e),damage:d*(1-absorb),time:t});')
s=s.replace('module.exports={battle};', '''function battle(args){const g=stream(args);let x;do{x=g.next();}while(!x.done);return x.value;}
module.exports={battle,stream};''')
s=s.replace("return out(true,'victory')", "return yield* victory()")
s=s.replace('const control=', """function* victory(){while(pending?.end>t+1e-8){const next=Math.min(pending.end,t+.1),dt=next-t;hp=Math.min(maxHp,hp+Math.max(0,p.hpRegen||0)*dt*(active(ps,'curse')?.5:1)+hots.reduce((v,h)=>v+h.rate*Math.max(0,Math.min(next,h.until)-t),0));cp=Math.min(maxCp,cp+Math.max(0,p.cpRegen||0)*dt*(active(ps,'curse')?.5:1));t=next;yield snapshot();}return out(true,'victory');}
 const control=""")
s=s.replace('damage/=1;', '')
s=s.replace('else damage+=amt;', 'else damage+=amt/(s.hitFractions?.length||1);')
s=s.replace("element==='physical'?(p.atk||0)+flat:(p.magicPower||0)", "element==='physical'?(p.atk||0)+flat:s.powerSource==='weapon'?((p.atk||0)+flat)*(1+(p.stats?.知識||0)/500):(p.magicPower||0)")
s=s.replace('damage:actual,crit,time:t', 'damage:actual,element,crit,time:t')
s=s.replace('proc(p.procs,e);', 'proc(p.procs,e);proc(s.procs,e);')
(out/'src/live_combat.cjs').write_text(s)
j=(source/'balanced_journey.cjs').read_text(); (out/'src/enemies.cjs').write_text(j[j.index('const els='):j.index("const {score}=")]+ '\nmodule.exports={enemies};')
# Generate renderer directly from approved previews; no redrawn poses or substituted swings.
a=(source/'blade-matched-combo.html').read_text(); b=(source/'skill-motion-first.html').read_text()
a=a[a.index('const crops='):a.index("root.querySelector('[data-step]')")]
a=a.replace("if(!ready)return;",'').replace("g.fillStyle='#101b2b';g.fillRect(0,0,600,400);g.fillStyle='#233945';g.fillRect(0,360,600,40);",'').replace("status.textContent=(i+1)+' / 12　'+names[i];",'')
b=b[b.index('const rects='):b.index('function play(')]
b=b.replace('if(!ready)return;skill=k;frame=f;', '').replace("g.fillStyle='#101b2b';g.fillRect(0,0,600,400);g.fillStyle='#233945';g.fillRect(0,356,600,44);",'').replace("status.textContent=names[k]+'　'+(f+1)+' / 4';",'')
renderer='''window.SwordArt={};
SwordArt.load=async function(url){const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height);SwordArt.removeMatte(d,c.width,c.height);g.putImageData(d,0,0);return c;};

// Remove only the connected white backdrop; unmatte its antialiased contour.
SwordArt.removeMatte=function(image,w,h){const d=image.data,n=w*h,bg=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
const push=i=>{if(i<0||i>=n||bg[i])return;const j=i*4;if(Math.min(d[j],d[j+1],d[j+2])<=232)return;bg[i]=1;q[tail++]=i;};
for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
while(head<tail){const i=q[head++],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);push(i-w);push(i+w);}
for(let i=0;i<n;i++){const j=i*4;if(bg[i]){d[j+3]=0;continue;}const x=i%w,y=Math.floor(i/w);let distance=3;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&bg[i+dy*w+dx])distance=Math.min(distance,Math.max(Math.abs(dx),Math.abs(dy)));}if(distance>2)continue;const low=Math.min(d[j],d[j+1],d[j+2]),floor=distance===1?85:125;if(low<=floor)continue;const a=Math.min(1,(255-low)/(255-floor));for(let c=0;c<3;c++)d[j+c]=Math.max(0,Math.min(255,(d[j+c]-255*(1-a))/Math.max(.01,a)));d[j+3]=Math.round(d[j+3]*a);}
};
SwordArt.combo=function(g,sprite){let f=0;
'''+a+'''return(time,idle=false)=>{let f=0,left=time;while(f<11&&left>=durations[f])left-=durations[f++];draw(idle?11:f,idle?-1000:time);};};
SwordArt.other=function(g,sprite){
'''+b+'''return(k,time,idle=false)=>{let f=0,left=time;while(f<3&&left>=times[k][f])left-=times[k][f++];draw(k,idle?0:f,time);};};
'''
(out/'art.js').write_text(renderer)
# Browser CommonJS loader bundles exact source modules with no network dependencies.
mods=['full_op_model.cjs','balanced_loot.cjs','town_shop.cjs','live_combat.cjs','enemies.cjs']
bundle="(()=>{const factories={},cache={};\n"
for f in mods: bundle+=f"factories['./{f}']=function(require,module,exports){{\n"+(out/'src'/f).read_text()+"\n};\n"
bundle+="factories['./full_op_source.json']=function(r,m){m.exports="+(out/'src/full_op_source.json').read_text()+"};\n"
bundle+="function require(id){if(id==='node:fs')return {};if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;factories[id](require,m,m.exports);return m.exports;}window.GameCore={loot:require('./balanced_loot.cjs'),combat:require('./live_combat.cjs'),shop:require('./town_shop.cjs'),enemies:require('./enemies.cjs').enemies};})();"
(out/'core.js').write_text(bundle)
