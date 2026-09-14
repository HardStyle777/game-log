'use strict';
// Candidate economy; item prices are not recovered original specifications.
const defaults={enabled:true,threshold:5,target:30,reserve:100,price:10};
function purchase({gold,potions},settings={},manual=false){
 const s={...defaults,...settings};
 for(const [key,v] of Object.entries({gold,potions,...Object.fromEntries(['threshold','target','reserve','price'].map(k=>[k,s[k]]))}))
   if(!Number.isSafeInteger(v)||v<0)throw new Error('Invalid '+key);
 if(s.price===0||s.target<=s.threshold)throw new Error('Invalid shop settings');
 if(!manual&&(!s.enabled||potions>s.threshold))return {gold,potions,bought:0,spent:0,reason:'not_requested'};
 const bought=Math.max(0,Math.min(s.target-potions,Math.floor(Math.max(0,gold-s.reserve)/s.price)));
 return {gold:gold-bought*s.price,potions:potions+bought,bought,spent:bought*s.price,reason:bought?'purchased':'insufficient_budget_or_full'};
}
module.exports={purchase,defaults};
