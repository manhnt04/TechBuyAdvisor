export interface AffiliateConfig {
  shopeePartnerId?: string;
  tikiPartnerId?: string;
  subId?: string;
}

export function generateAffiliateUrl(originalUrl: string, config: AffiliateConfig = {}): string {
  if (!originalUrl || originalUrl === '#' || originalUrl.includes('example.com')) {
    return originalUrl;
  }

  const subId = config.subId || 'techbuy_advisor';

  try {
    const url = new URL(originalUrl);

    // Shopee Affiliate Deeplink Transformation
    if (url.hostname.includes('shopee.vn')) {
      url.searchParams.set('utm_source', 'an_techbuy');
      url.searchParams.set('utm_medium', 'affiliates');
      url.searchParams.set('utm_campaign', 'techbuy_hardware');
      url.searchParams.set('aff_sub', subId);
      return url.toString();
    }

    // Tiki Affiliate Deeplink Transformation
    if (url.hostname.includes('tiki.vn')) {
      url.searchParams.set('utm_source', 'tiki-affiliate');
      url.searchParams.set('utm_medium', 'cpc');
      url.searchParams.set('utm_campaign', 'techbuy_advisor');
      url.searchParams.set('aff_sub', subId);
      return url.toString();
    }

    // Partner Retailers UTM tracking (An Phát, KCCShop, MemoryZone, GearVN, HACOM)
    url.searchParams.set('ref', 'techbuy_advisor');
    url.searchParams.set('utm_source', 'techbuy.vn');
    url.searchParams.set('utm_medium', 'advisor_recommendation');
    return url.toString();
  } catch {
    return originalUrl;
  }
}
