/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, count = 10 } = await req.json();

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if user has enough credits (1 credit = 10 images)
    const userCredits = user.credits || 0;
    if (userCredits < 1) {
      return Response.json({ 
        success: false, 
        error: 'Insufficient credits. You need 1 credit to generate 10 images.' 
      }, { status: 400 });
    }

    // Create prompt for image generation
    const prompt = `Create a professional, clean, modern image for a home improvement or real estate insight article titled "${title}". ${description ? `The article is about: ${description}.` : ''} Style: photorealistic, high quality, suitable for a professional website. Focus on home, property, or relevant tools/services.`;

    // Generate images using DALL-E
    const imagePromises = [];
    const imagesToGenerate = Math.min(count, 10); // Max 10 images

    for (let i = 0; i < imagesToGenerate; i++) {
      imagePromises.push(
        openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        })
      );
    }

    const results = await Promise.all(imagePromises);
    const tempImageUrls = results.map(result => result.data[0].url);

    // Upload images to Base44 storage for permanent access
    const permanentUrls = await Promise.all(
      tempImageUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], `insight-${Date.now()}-${Math.random()}.png`, { type: 'image/png' });
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          return uploadResult.file_url;
        } catch (error) {
          console.error('Failed to upload image to Base44:', error);
          return url; // Fallback to original URL
        }
      })
    );

    const imageUrls = permanentUrls;

    // Deduct 1 credit
    const newCredits = userCredits - 1;
    await base44.asServiceRole.entities.User.update(user.id, {
      credits: newCredits
    });

    return Response.json({
      success: true,
      imageUrls,
      creditsRemaining: newCredits,
      imagesGenerated: imagesToGenerate
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ 
      success: false,
      error: error.message || 'Failed to generate images' 
    }, { status: 500 });
  }
});