import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState,migrateCampaign,campaignObjective,advanceCampaign,validState} from '../dist/engine.js';

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
 assert.equal(advanceCampaign(s),null);
 assert.ok(validState(s));
});

test('legacy cleared saves migrate without replaying chapter rewards',()=>{
 const s=makeState();delete s.campaign;s.ended=true;s.badges=[0,1,2,3];s.coins=777;s.balls=9;
 assert.ok(validState(s));
 migrateCampaign(s);
 assert.deepEqual(s.campaign.claimed,[1,2]);
 assert.equal(s.campaign.chapter,3);
 assert.equal(s.coins,777);
 assert.equal(s.balls,9);
 assert.equal(advanceCampaign(s),null);
});

test('malformed campaign records are rejected while old records remain readable',()=>{
 const s=makeState();
 assert.equal(validState({...s,campaign:{...s.campaign,claimed:[1,1]}}),false);
 assert.equal(validState({...s,campaign:{...s.campaign,baseWins:-1}}),false);
 const old={...s};delete old.campaign;
 assert.ok(validState(old));
});
