import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAffiliateUrl } from '../lib/affiliate';

test('generateAffiliateUrl adds proper tracking parameters for Shopee and Tiki', () => {
  const shopeeUrl = 'https://shopee.vn/search?keyword=RTX%204060';
  const affShopee = generateAffiliateUrl(shopeeUrl);
  assert.ok(affShopee.includes('utm_source=an_techbuy'));
  assert.ok(affShopee.includes('aff_sub=techbuy_advisor'));

  const tikiUrl = 'https://tiki.vn/search?q=RTX%204060';
  const affTiki = generateAffiliateUrl(tikiUrl);
  assert.ok(affTiki.includes('utm_source=tiki-affiliate'));
  assert.ok(affTiki.includes('utm_campaign=techbuy_advisor'));

  const kccUrl = 'https://kccshop.vn/?s=RTX%204060';
  const affKcc = generateAffiliateUrl(kccUrl);
  assert.ok(affKcc.includes('ref=techbuy_advisor'));
});
