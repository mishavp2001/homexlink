Deno.serve(async (req) => {
  const origin = new URL(req.url).origin;
  
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin and private pages
Disallow: /dashboard
Disallow: /profile
Disallow: /messages
Disallow: /admin
Disallow: /edit*
Disallow: /maintenance
Disallow: /accounting
Disallow: /provider-billing

# Allow crawling of public pages
Allow: /deals
Allow: /services
Allow: /insights
Allow: /sale
Allow: /rent
Allow: /airbnb
Allow: /service

# Sitemap location
Sitemap: ${origin}/sitemap.xml

# Crawl delay (optional, adjust as needed)
Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});