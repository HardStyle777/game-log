// Seeded, connected labyrinth; no RNG consumption from the combat state.
export function riftLayout(run){
 const width=17,height=13,cells=Array.from({length:height},()=>Array(width).fill(0));
 let seed=(run.seed^Math.imul(run.floor,0x9e3779b9))>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stack=[[1,1]];cells[1][1]=1;
 while(stack.length){const [x,y]=stack.at(-1),options=[[0,-2],[2,0],[0,2],[-2,0]].filter(([dx,dy])=>x+dx>0&&x+dx<width-1&&y+dy>0&&y+dy<height-1&&!cells[y+dy][x+dx]);if(!options.length){stack.pop();continue;}const [dx,dy]=options[Math.floor(random()*options.length)];cells[y+dy/2][x+dx/2]=1;cells[y+dy][x+dx]=1;stack.push([x+dx,y+dy]);}
 // Longest distance from entrance, rather than an exit accidentally next to it.
 const queue=[[1,1,0]],seen=new Set(['1,1']),points=[];
 for(let i=0;i<queue.length;i++){const [x,y,d]=queue[i];points.push({x,y,d});for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const key=`${x+dx},${y+dy}`;if(cells[y+dy]?.[x+dx]&&!seen.has(key)){seen.add(key);queue.push([x+dx,y+dy,d+1]);}}}
 points.sort((a,b)=>b.d-a.d);const exit=points[0];const chests=points.filter(p=>p.d>5&&(p.x!==exit.x||p.y!==exit.y)&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>cells[p.y+dy]?.[p.x+dx]).length===1).slice(0,2);
 return {width,height,cells,exit,chests};
}
export function resetRiftWalk(run){run.walk={floor:run.floor,x:1,y:1,opened:[]};return run.walk;}
export function enterRiftWalk(s){const run=s.postgame?.rift;if(!s.ended||!run?.waiting||run.complete)return false;if(!run.walk)resetRiftWalk(run);return true;}
export function moveRiftWalk(s,dx,dy){const run=s.postgame?.rift,w=run?.walk;if(!run?.waiting||run.complete||!w||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return false;const map=riftLayout(run);if(!map.cells[w.y+dy]?.[w.x+dx])return false;w.x+=dx;w.y+=dy;return true;}
export function riftAtExit(s){const run=s.postgame?.rift;if(!run?.walk||!run.waiting||run.complete)return false;const exit=riftLayout(run).exit;return run.walk.x===exit.x&&run.walk.y===exit.y;}
export function collectRiftChest(s){const run=s.postgame?.rift,w=run?.walk;if(!run?.waiting||run.complete||!w)return false;const chest=riftLayout(run).chests.findIndex(p=>p.x===w.x&&p.y===w.y);if(chest<0||w.opened.includes(chest))return false;w.opened.push(chest);run.pending+=2;return true;}
export function validRiftWalk(run){const w=run.walk;if(w===undefined||w===null)return true;if(!w||w.floor!==run.floor||!Number.isInteger(w.x)||!Number.isInteger(w.y)||!Array.isArray(w.opened)||w.opened.length>2||new Set(w.opened).size!==w.opened.length)return false;const map=riftLayout(run);return !!map.cells[w.y]?.[w.x]&&w.opened.every(i=>Number.isInteger(i)&&i>=0&&i<map.chests.length);}
