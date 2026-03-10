import { listAmplifyPublicItems } from './_amplifyPublicData.ts';

const LIST_DEALS_FOR_SITEMAP = `
  query ListDealsForSitemap($filter: ModelDealFilterInput, $limit: Int, $nextToken: String) {
    listDeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        location
        deal_type
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const LIST_SERVICE_LISTINGS_FOR_SITEMAP = `
  query ListServiceListingsForSitemap($filter: ModelServiceListingFilterInput, $limit: Int, $nextToken: String) {
    listServiceListings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        expert_name
        business_name
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const LIST_INSIGHTS_FOR_SITEMAP = `
  query ListInsightsForSitemap($filter: ModelInsightFilterInput, $limit: Int, $nextToken: String) {
    listInsights(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

const escapeXml = value =>
  String(value).replace(/[<>&'\"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  }[character] || character));

Deno.serve(async (req) => {
  try {
    const origin = new URL(req.url).origin;

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/deals', priority: '0.9', changefreq: 'daily' },
      { url: '/services', priority: '0.9', changefreq: 'daily' },
      { url: '/insights', priority: '0.8', changefreq: 'daily' },
      { url: '/sale', priority: '0.8', changefreq: 'daily' },
      { url: '/rent', priority: '0.8', changefreq: 'daily' },
      { url: '/airbnb', priority: '0.8', changefreq: 'daily' },
    ];

    // Fetch active deals
    const deals = await listAmplifyPublicItems({
      query: LIST_DEALS_FOR_SITEMAP,
      rootField: 'listDeals',
      filter: { status: { eq: 'active' } },
    });
    const dealUrls = deals.map(deal => {
      const encodedAddress = encodeURIComponent(deal.location || '');
      let path = '/deals';
      if (deal.deal_type === 'property_sales' || deal.deal_type === 'sale') path = `/sale?address=${encodedAddress}`;
      else if (deal.deal_type === 'long_term_rent') path = `/rent?address=${encodedAddress}`;
      else if (deal.deal_type === 'short_term_rent') path = `/airbnb?address=${encodedAddress}`;
      
      return {
        url: path,
        lastmod: deal.updatedAt || deal.createdAt,
        priority: '0.7',
        changefreq: 'weekly'
      };
    });

    // Fetch active services
    const services = await listAmplifyPublicItems({
      query: LIST_SERVICE_LISTINGS_FOR_SITEMAP,
      rootField: 'listServiceListings',
      filter: { status: { eq: 'active' } },
    });
    const serviceUrls = services.map(service => ({
      url: `/service?name=${encodeURIComponent(service.expert_name || service.business_name || '')}`,
      lastmod: service.updatedAt || service.createdAt,
      priority: '0.7',
      changefreq: 'weekly'
    }));

    // Fetch published insights
    const insights = await listAmplifyPublicItems({
      query: LIST_INSIGHTS_FOR_SITEMAP,
      rootField: 'listInsights',
      filter: { status: { eq: 'published' } },
    });
    const insightUrls = insights.map(insight => ({
      url: `/insights#${insight.id}`,
      lastmod: insight.updatedAt || insight.createdAt,
      priority: '0.6',
      changefreq: 'monthly'
    }));

    // Combine all URLs
    const allUrls = [...staticPages, ...dealUrls, ...serviceUrls, ...insightUrls];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${escapeXml(`${origin}${page.url}`)}</loc>
    ${page.lastmod ? `<lastmod>${new Date(page.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});