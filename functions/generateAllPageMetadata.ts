/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { generatePageMetadataWithAI, upsertPageMetadata } from './_pageMetadata.ts';

const PAGES = [
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
  { name: 'Profile', context: 'Manage user profile and account settings' },
];

Deno.serve(async (req: Request) => {
  try {
    const user = await requireAmplifyUser(req);

    if (!user.isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = [];
    const errors = [];

    for (const page of PAGES) {
      try {
        const generatedMetadata = await generatePageMetadataWithAI(page.name, page.context);
        const metadataWithTimestamp = {
          page_name: page.name,
          ...generatedMetadata,
          is_auto_generated: true,
          last_generated_date: new Date().toISOString(),
        };

        await upsertPageMetadata(user.authToken, metadataWithTimestamp);
        results.push({ page: page.name, success: true });
      } catch (error) {
        errors.push({
          page: page.name,
          error: error instanceof Error ? error.message : 'Unknown metadata generation error',
        });
      }
    }

    return Response.json({
      success: true,
      generated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated metadata for ${results.length} pages`,
    });

  } catch (error) {
    console.error('Error generating all metadata:', error);
    return toErrorResponse(error, 'Failed to generate all page metadata');
  }
});