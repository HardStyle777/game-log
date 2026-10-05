/* Opt-in synthesized sounds; AudioContext is unlocked only by a user gesture. */
(function(root){
let context=null,enabled=false;
async function enable(value=true){enabled=value;if(!value)return false;const C=root.AudioContext||root.webkitAudioContext;if(!C){enabled=false;return false;}try{context??=new C();await context.resume();return context.state==='running';}catch{enabled=false;return false;}}
function play(kind){if(!enabled||context?.state!=='running')return;const t=context.currentTime,o=context.createOscillator(),gain=context.createGain();o.type=kind==='hit'?'triangle':'sawtooth';o.frequency.setValueAtTime(kind==='hit'?180:650,t);o.frequency.exponentialRampToValueAtTime(kind==='hit'?45:100,t+.09);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(kind==='hit'?.16:.045,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(gain);gain.connect(context.destination);o.start(t);o.stop(t+.15);}
root.SkillAudio={enable,play};
})(typeof window==='object'?window:globalThis);
