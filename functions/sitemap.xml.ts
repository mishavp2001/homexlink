import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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
    const deals = await base44.asServiceRole.entities.Deal.filter({ status: 'active' });
    const dealUrls = deals.map(deal => {
      const encodedAddress = encodeURIComponent(deal.location || '');
      let path = '/deals';
      if (deal.deal_type === 'sale') path = `/sale?address=${encodedAddress}`;
      else if (deal.deal_type === 'long_term_rent') path = `/rent?address=${encodedAddress}`;
      else if (deal.deal_type === 'short_term_rent') path = `/airbnb?address=${encodedAddress}`;
      
      return {
        url: path,
        lastmod: deal.updated_date || deal.created_date,
        priority: '0.7',
        changefreq: 'weekly'
      };
    });

    // Fetch active services
    const services = await base44.asServiceRole.entities.ServiceListing.filter({ status: 'active' });
    const serviceUrls = services.map(service => ({
      url: `/service?name=${encodeURIComponent(service.expert_name)}`,
      lastmod: service.updated_date || service.created_date,
      priority: '0.7',
      changefreq: 'weekly'
    }));

    // Fetch published insights
    const insights = await base44.asServiceRole.entities.Insight.filter({ status: 'published' });
    const insightUrls = insights.map(insight => ({
      url: `/insights#${insight.id}`,
      lastmod: insight.updated_date || insight.created_date,
      priority: '0.6',
      changefreq: 'monthly'
    }));

    // Combine all URLs
    const allUrls = [...staticPages, ...dealUrls, ...serviceUrls, ...insightUrls];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${origin}${page.url}</loc>
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