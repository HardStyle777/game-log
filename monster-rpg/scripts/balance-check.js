import {makeState,encounter,act,heal,equippedMoves} from '../dist/engine.js';
const useMoves=process.argv.includes('--moves');
const results=[];for(let seed=1;seed<=30;seed++){const s=makeState(seed%3);s.seed=seed;let fights=0,losses=0;
function fight(b,capture=false){let turn=0;while(!b.result&&turn++<300){const m=s.party[b.active];if(capture&&!b.boss){if(b.enemy.hp>15)act(s,b,'attack');else act(s,b,'capture');}else if(useMoves){const v=equippedMoves(m).filter(v=>v.power>0&&v.cost<=m.energy).sort((a,b)=>b.power-a.power)[0];if(v)act(s,b,'move',v.id);else act(s,b,'guard');}else act(s,b,m.energy>=2?'skill':'attack');}if(!b.result)throw Error('turn limit');fights++;if(b.result==='lose')losses++;return b.result;}
for(let r=0;r<5;r++){let cleared=false;for(let attempt=0;attempt<75&&!cleared;attempt++){heal(s);cleared=fight(encounter(s,Math.min(r,3),true,r===4))==='win';if(cleared)break;for(let i=0;i<3;i++){heal(s);if(s.balls<3){if(s.coins>=100){s.coins-=100;s.balls+=5;}else s.balls+=0;}fight(encounter(s,Math.min(r,3)),s.party.length<6&&s.balls>0);}}
if(!cleared)throw Error('progress stuck: '+seed+' stage '+r);}
results.push({seed,fights,losses,leadLevel:s.party[0].level,party:s.party.length});}
console.log(JSON.stringify({runs:results.length,minFights:Math.min(...results.map(x=>x.fights)),maxFights:Math.max(...results.map(x=>x.fights)),minLosses:Math.min(...results.map(x=>x.losses)),maxLosses:Math.max(...results.map(x=>x.losses)),minLeadLevel:Math.min(...results.map(x=>x.leadLevel)),maxLeadLevel:Math.max(...results.map(x=>x.leadLevel))}));
