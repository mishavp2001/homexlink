/// <reference lib="deno.ns" />
import { requireAmplifyUser, toErrorResponse } from './_amplifyAuth.ts';
import { generatePageMetadataWithAI, upsertPageMetadata } from './_pageMetadata.ts';

Deno.serve(async (req: Request) => {
  try {
    const user = await requireAmplifyUser(req);

    if (!user.isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { page_name, page_context } = await req.json() as { page_name?: string; page_context?: string };

    if (!page_name) {
      return Response.json({ error: 'page_name is required' }, { status: 400 });
    }

    const generatedMetadata = await generatePageMetadataWithAI(page_name, page_context);
    const metadataWithTimestamp = {
      page_name,
      ...generatedMetadata,
      is_auto_generated: true,
      last_generated_date: new Date().toISOString(),
    };

    const savedMetadata = await upsertPageMetadata(user.authToken, metadataWithTimestamp);

    return Response.json({
      success: true,
      metadata: savedMetadata,
    });

  } catch (error) {
    console.error('Error generating metadata:', error);
    return toErrorResponse(error, 'Failed to generate page metadata');
  }
});