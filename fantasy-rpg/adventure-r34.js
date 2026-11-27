const KEY='fantasy-adventure-r34';
export function read(){try{const s=JSON.parse(sessionStorage.getItem(KEY));if(s&&Number.isSafeInteger(s.gold)&&s.gold>=0&&Number.isSafeInteger(s.potion)&&s.potion>=0&&Array.isArray(s.claimed))return s}catch{}return {gold:100,potion:4,claimed:[]}}
export function save(s){sessionStorage.setItem(KEY,JSON.stringify(s));return s}
export function claim(id,gold,potion){const s=read();if(s.claimed.includes(id))return false;save({...s,gold:s.gold+gold,potion:s.potion+potion,claimed:[...s.claimed,id]});return true}
export function trade(n){const s=read(),cost=n>0?20:10;if(![1,-1].includes(n)||n>0&&s.gold<cost||n<0&&s.potion<1)return false;save({...s,gold:s.gold-n*cost,potion:s.potion+n});return true}
export function settle(token,outcome,count,enemy){const s=read();if(!token||s.claimed.includes('battle:'+token)||!Number.isSafeInteger(count)||count<0||count>s.potion)return false;save({...s,potion:count,gold:s.gold+(outcome==='win'?(enemy==='boss'?120:30):0),claimed:[...s.claimed,'battle:'+token]});return true}
