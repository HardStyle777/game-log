import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,migrateCampaign,campaignObjective,campaignDiscover,campaignRepair,campaignAlignMirror,campaignTiming,campaignReadiness,advanceCampaignV6 as advanceCampaign,completeFinalCampaign,validState,SHORE_CLUES,HIGHLAND_REPAIRS,STARSHADOW_MIRRORS,createMonster,encounter,act} from '../dist/engine.js';

test('chapters one and two require new actions and grant each reward once',()=>{
 const s=makeState(),startBalls=s.balls,startPotions=s.potions,startCoins=s.coins;
 assert.match(campaignObjective(s),/長老/);
 assert.equal(advanceCampaign(s).changed,true);
 assert.equal(s.campaign.step,1);
 assert.match(campaignObjective(s),/捕獲/);
 s.captures++;
 const first=advanceCampaign(s);
 assert.equal(first.reward,'捕獲クリスタル3個・回復薬1個');
 assert.deepEqual(s.campaign.claimed,[1]);
 assert.equal(s.balls,startBalls+3);
 assert.equal(s.potions,startPotions+1);
 assert.match(campaignObjective(s),/あと3勝/);
 s.wins+=3;
 assert.equal(advanceCampaign(s).changed,true);
 assert.equal(s.campaign.step,1);
 assert.match(campaignObjective(s),/ミナ/);
 s.badges.push(0);
 const second=advanceCampaign(s);
 assert.equal(second.reward,'300コイン・捕獲クリスタル3個');
 assert.deepEqual(s.campaign.claimed,[1,2]);
 assert.equal(s.campaign.chapter,3);
 assert.equal(s.coins,startCoins+300);
 assert.equal(s.balls,startBalls+6);
 assert.match(campaignObjective(s),/第3章/);
 assert.ok(validState(s));
});

test('chapter timing records active play seconds once and leaves legacy history unknown',()=>{
 const s=makeState();s.playSeconds=120;advanceCampaign(s);s.playSeconds=600;s.captures++;advanceCampaign(s);
 let timing=campaignTiming(s);assert.equal(timing[0].seconds,600);assert.equal(timing[1].current,true);assert.equal(timing[1].currentSeconds,0);
 s.playSeconds=1800;s.wins+=3;advanceCampaign(s);s.badges.push(0);advanceCampaign(s);timing=campaignTiming(s);
 assert.equal(timing[1].seconds,1200);assert.equal(timing[2].current,true);assert.equal(s.campaign.chapterStartedAt,1800);
 const old=makeState();delete old.campaign;old.ended=true;old.badges=[0,1,2,3];old.playSeconds=24000;migrateCampaign(old);timing=campaignTiming(old);
 assert.ok(timing.every(v=>v.seconds===null));assert.ok(timing.every(v=>!v.current));assert.equal(old.campaign.chapterStartedAt,24000);
});

test('chapter completion gives only under-target party members one support level',()=>{
 const s=makeState();s.party.push(createMonster(1,3),createMonster(2,8));advanceCampaign(s);s.captures++;
 const result=advanceCampaign(s);
 assert.match(result.training,/仲間1体が1レベル成長/);
 assert.deepEqual(s.party.map(m=>m.level),[2,3,8]);
 const ready=campaignReadiness(s);
 assert.deepEqual({chapter:ready.chapter,min:ready.min,max:ready.max,ready:ready.ready,total:ready.total},{chapter:2,min:3,max:6,ready:2,total:3});
 assert.equal(advanceCampaign(s).changed,false);
 assert.deepEqual(s.party.map(m=>m.level),[2,3,8]);
});

test('chapters three and four require map discoveries, training and Nagi badge',()=>{
 const s=makeState(),startCoins=s.coins,startBalls=s.balls,startPotions=s.potions;
 s.badges=[0];s.campaign={schema:2,chapter:3,step:0,baseWins:5,baseCaptures:2,claimed:[1,2],discoveries:[]};s.wins=5;
 assert.match(campaignObjective(s),/長老/);
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/あと3か所/);
 assert.equal(campaignDiscover(s,0),true);
 assert.equal(campaignDiscover(s,0),false);
 assert.equal(campaignDiscover(s,-1),false);
 assert.equal(campaignDiscover(s,1),true);
 assert.equal(campaignDiscover(s,2),true);
 assert.equal(s.campaign.discoveries.length,SHORE_CLUES.length);
 assert.match(campaignObjective(s),/報告/);
 const third=advanceCampaign(s);
 assert.equal(third.reward,'250コイン・回復薬2個');
 assert.equal(s.campaign.chapter,4);
 assert.equal(s.coins,startCoins+250);
 assert.equal(s.potions,startPotions+2);
 assert.match(campaignObjective(s),/あと4勝/);
 s.wins+=4;
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/ナギ/);
 s.badges.push(1);
 const fourth=advanceCampaign(s);
 assert.equal(fourth.reward,'400コイン・捕獲クリスタル5個・回復薬2個');
 assert.deepEqual(s.campaign.claimed,[1,2,3,4]);
 assert.equal(s.campaign.chapter,5);
 assert.equal(s.coins,startCoins+650);
 assert.equal(s.balls,startBalls+5);
 assert.equal(s.potions,startPotions+4);
 assert.match(campaignObjective(s),/第5章/);
 assert.ok(validState(s));
});

test('chapters five and six require ordered repairs, highland wins and Akane badge',()=>{
 const s=makeState(),startCoins=s.coins,startBalls=s.balls,startPotions=s.potions;
 s.badges=[0,1];s.campaign={schema:3,chapter:5,step:0,baseWins:10,baseCaptures:4,claimed:[1,2,3,4],discoveries:[],regionWins:0};
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/工房の主炉/);
 assert.equal(campaignRepair(s,1),false);
 assert.equal(campaignRepair(s,0),true);
 assert.match(campaignObjective(s),/割れた送熱弁/);
 assert.equal(campaignRepair(s,2),false);
 assert.equal(campaignRepair(s,1),true);
 assert.equal(campaignRepair(s,2),true);
 assert.equal(s.campaign.discoveries.length,HIGHLAND_REPAIRS.length);
 const fifth=advanceCampaign(s);
 assert.equal(fifth.reward,'350コイン・捕獲クリスタル4個・回復薬2個');
 assert.equal(s.campaign.chapter,6);
 assert.match(campaignObjective(s),/あと5勝/);
 s.campaign.regionWins=5;
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/アカネ/);
 s.badges.push(2);
 const sixth=advanceCampaign(s);
 assert.equal(sixth.reward,'500コイン・捕獲クリスタル6個・回復薬3個');
 assert.deepEqual(s.campaign.claimed,[1,2,3,4,5,6]);
 assert.equal(s.campaign.chapter,7);
 assert.equal(s.coins,startCoins+850);
 assert.equal(s.balls,startBalls+10);
 assert.equal(s.potions,startPotions+5);
 assert.match(campaignObjective(s),/第7章/);
 assert.ok(validState(s));
});

test('chapters seven and eight require ordered mirrors, Yor badge and final victory',()=>{
 const s=makeState(),startCoins=s.coins,startBalls=s.balls,startPotions=s.potions;
 s.badges=[0,1,2];s.campaign={schema:4,chapter:7,step:0,baseWins:20,baseCaptures:8,claimed:[1,2,3,4,5,6],discoveries:[],regionWins:5};
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/月影の鏡/);
 assert.equal(campaignAlignMirror(s,1),false);
 assert.equal(campaignAlignMirror(s,0),true);
 assert.equal(campaignAlignMirror(s,0),false);
 assert.equal(campaignAlignMirror(s,1),true);
 assert.equal(campaignAlignMirror(s,2),true);
 assert.equal(s.campaign.discoveries.length,STARSHADOW_MIRRORS.length);
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/ヨル/);
 s.badges.push(3);
 const seventh=advanceCampaign(s);
 assert.equal(seventh.reward,'650コイン・捕獲クリスタル8個・回復薬4個');
 assert.equal(s.campaign.chapter,8);
 assert.equal(advanceCampaign(s).changed,true);
 assert.match(campaignObjective(s),/守護竜/);
 s.ended=true;
 assert.equal(completeFinalCampaign(s),true);
 assert.equal(completeFinalCampaign(s),false);
 assert.equal(s.campaign.chapter,9);
 assert.deepEqual(s.campaign.claimed,[1,2,3,4,5,6,7,8]);
 assert.equal(s.coins,startCoins+1650);
 assert.equal(s.balls,startBalls+18);
 assert.equal(s.potions,startPotions+9);
 assert.ok(validState(s));
});

test('final battle victory completes chapter eight automatically',()=>{
 const s=makeState();s.badges=[0,1,2,3];s.party=[createMonster(6,40,false,{vitality:3,force:3},0)];s.campaign={schema:4,chapter:8,step:1,baseWins:30,baseCaptures:10,claimed:[1,2,3,4,5,6,7],discoveries:[],regionWins:5};
 const b=encounter(s,3,true,true);for(const foe of [b.enemy,...b.roster])foe.hp=1;
 let turns=0;while(!b.result&&turns++<10)act(s,b,'attack');
 assert.equal(b.result,'win');assert.equal(s.ended,true);assert.equal(s.campaign.chapter,9);assert.ok(s.campaign.claimed.includes(8));assert.match(b.log.join(' '),/第8章完了/);
});

test('only ordinary highland victories count toward chapter six training',()=>{
 const s=makeState();s.badges=[0,1];s.party=[createMonster(6,40,false,{vitality:3,force:3},0)];s.campaign={schema:3,chapter:6,step:0,baseWins:0,baseCaptures:0,claimed:[1,2,3,4,5],discoveries:[0,1,2],regionWins:0};
 const other=encounter(s,1);other.enemy.hp=1;act(s,other,'attack');assert.equal(other.result,'win');assert.equal(s.campaign.regionWins,0);
 const highland=encounter(s,2);highland.enemy.hp=1;act(s,highland,'attack');assert.equal(highland.result,'win');assert.equal(s.campaign.regionWins,1);
 const boss=encounter(s,2,true);boss.enemy.hp=1;boss.roster=[];act(s,boss,'attack');assert.equal(boss.result,'win');assert.equal(s.campaign.regionWins,1);
});

test('legacy cleared saves migrate without replaying chapter rewards',()=>{
 const s=makeState();delete s.campaign;s.ended=true;s.badges=[0,1,2,3];s.coins=777;s.balls=9;
 assert.ok(validState(s));
 migrateCampaign(s);
 assert.deepEqual(s.campaign.claimed,[1,2,3,4,5,6,7,8]);
 assert.equal(s.campaign.chapter,9);
 assert.equal(s.coins,777);
 assert.equal(s.balls,9);
 assert.equal(advanceCampaign(s),null);
});

test('version 30 campaign records gain schema and discoveries without losing progress',()=>{
 const s=makeState();s.badges=[0];s.campaign={chapter:3,step:1,baseWins:8,baseCaptures:3,claimed:[1,2]};
 assert.ok(validState(s));
 migrateCampaign(s);
 assert.equal(s.campaign.schema,4);
 assert.deepEqual(s.campaign.discoveries,[]);
 assert.equal(s.campaign.chapter,3);
 assert.ok(validState(s));
});

test('malformed campaign records are rejected while old records remain readable',()=>{
 const s=makeState();
 assert.equal(validState({...s,campaign:{...s.campaign,claimed:[1,1]}}),false);
 assert.equal(validState({...s,campaign:{...s.campaign,baseWins:-1}}),false);
 assert.equal(validState({...s,campaign:{...s.campaign,discoveries:[0,0]}}),false);
 assert.equal(validState({...s,campaign:{...s.campaign,discoveries:[3]}}),false);
 assert.equal(validState({...s,campaign:{...s.campaign,regionWins:-1}}),false);
 const old={...s};delete old.campaign;
 assert.ok(validState(old));
});
