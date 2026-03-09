/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const pages = [
      { name: 'Landing', context: 'Home page showcasing platform benefits, services, and deals' },
      { name: 'Deals', context: 'Browse exclusive real estate deals, properties for sale, rent, and Airbnb listings' },
      { name: 'Services', context: 'Find and connect with verified home service providers and contractors' },
      { name: 'Insights', context: 'Community tips, tricks, and insights about home ownership and maintenance' },
      { name: 'Dashboard', context: 'User dashboard for managing properties, expenses, and maintenance' },
      { name: 'PropertyCapture', context: 'Digitize your property by uploading details and components' },
      { name: 'PropertyDetails', context: 'View detailed property information, components, and AI insights' },
      { name: 'Maintenance', context: 'Track and manage property maintenance tasks and projects' },
      { name: 'Accounting', context: 'Track property income, expenses, and financial transactions' },
      { name: 'Messages', context: 'Communicate with service providers and other users' },
      { name: 'Profile', context: 'Manage user profile and account settings' }
    ];

    const results = [];
    const errors = [];

    for (const page of pages) {
      try {
        // Generate SEO metadata using AI
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate SEO-optimized metadata for a website page named "${page.name}".
          
Context about this page: ${page.context}

The website is a home management and real estate platform that helps users:
- Control home expenses with AI-powered property management
- Connect with verified service providers
- Discover exclusive real estate deals
- Digitize property portfolios
- Track maintenance and expenses
- Find homes to buy or rent

Generate compelling, keyword-rich metadata that will improve search engine visibility.

Return the metadata in this JSON format:
{
  "meta_title": "60-70 character title optimized for search engines",
  "meta_description": "150-160 character description that entices clicks",
  "meta_keywords": "comma, separated, relevant, keywords",
  "og_title": "Engaging Open Graph title",
  "og_description": "Compelling Open Graph description",
  "twitter_title": "Concise Twitter card title",
  "twitter_description": "Engaging Twitter card description"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              meta_title: { type: "string" },
              meta_description: { type: "string" },
              meta_keywords: { type: "string" },
              og_title: { type: "string" },
              og_description: { type: "string" },
              twitter_title: { type: "string" },
              twitter_description: { type: "string" }
            },
            required: ["meta_title", "meta_description", "meta_keywords"]
          }
        });

        // Check if metadata already exists for this page
        const existing = await base44.asServiceRole.entities.PageMetadata.filter({ page_name: page.name });
        
        const metadataWithTimestamp = {
          page_name: page.name,
          ...result,
          is_auto_generated: true,
          last_generated_date: new Date().toISOString()
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.PageMetadata.update(existing[0].id, metadataWithTimestamp);
        } else {
          await base44.asServiceRole.entities.PageMetadata.create(metadataWithTimestamp);
        }
        
        results.push({ page: page.name, success: true });
      } catch (error) {
        errors.push({ page: page.name, error: error.message });
      }
    }

    return Response.json({
      success: true,
      generated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated metadata for ${results.length} pages`
    });

  } catch (error) {
    console.error('Error generating all metadata:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});