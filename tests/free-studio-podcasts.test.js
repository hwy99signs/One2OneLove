import test from 'node:test';
import assert from 'node:assert/strict';
import { isO2OLPermanentlyFreeMediaFeature,isO2OLPromoFreeFeature } from '../src/lib/o2olFreePromo2026.js';
import { FEATURE_PRICE_BY_CODE } from '../src/lib/featurePricing.js';

test('both Studio video and podcast media stay free after the promotional window',()=>{
  const yearsLater=new Date('2028-06-01T00:00:00Z');
  for(const code of ['studio_episode_unlock','podcast_episode_unlock']){
    assert.equal(isO2OLPermanentlyFreeMediaFeature(code),true);
    assert.equal(isO2OLPromoFreeFeature(code,yearsLater),false);
    assert.equal(FEATURE_PRICE_BY_CODE[code].cents,0);
    assert.match(FEATURE_PRICE_BY_CODE[code].priceLabel,/FREE FOREVER/);
  }
});
test('permanently free media rule never opens paid AI or private content',()=>{
  for(const code of ['ai_content_generation','bianca_response','love_note_template_unlock','date_idea_unlock']){
    assert.equal(isO2OLPermanentlyFreeMediaFeature(code),false);
  }
  assert.equal(FEATURE_PRICE_BY_CODE.ai_content_generation.cents,49);
  assert.equal(FEATURE_PRICE_BY_CODE.love_note_template_unlock.cents,49);
});
