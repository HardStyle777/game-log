import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,migrateCampaign,campaignObjective,campaignDiscover,advanceCampaign,validState,SHORE_CLUES} from '../dist/engine.js';

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
 assert.equal(advanceCampaign(s),null);
 assert.ok(validState(s));
});

test('legacy cleared saves migrate without replaying chapter rewards',()=>{
 const s=makeState();delete s.campaign;s.ended=true;s.badges=[0,1,2,3];s.coins=777;s.balls=9;
 assert.ok(validState(s));
 migrateCampaign(s);
 assert.deepEqual(s.campaign.claimed,[1,2,3,4]);
 assert.equal(s.campaign.chapter,5);
 assert.equal(s.coins,777);
 assert.equal(s.balls,9);
 assert.equal(advanceCampaign(s),null);
});

test('version 30 campaign records gain schema and discoveries without losing progress',()=>{
 const s=makeState();s.badges=[0];s.campaign={chapter:3,step:1,baseWins:8,baseCaptures:3,claimed:[1,2]};
 assert.ok(validState(s));
 migrateCampaign(s);
 assert.equal(s.campaign.schema,2);
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
 const old={...s};delete old.campaign;
 assert.ok(validState(old));
});
